"""
test_endpoints.py
-----------------
Live smoke test for the WisdomKernel API with MySQL Database Integration.
Uses only the Python standard library.

    Terminal 1:  uvicorn main:app --reload --port 8000
    Terminal 2:  python test_endpoints.py

Exit code is 0 only if everything passed.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
DEMO_ORG = "Northstar Engineering"
DEMO_PASSWORD = "Northstar@2026"
ALT_ORG = "Meridian Cloud Labs"
ALT_PASSWORD = "meridian@2026"

passed, failed = [], []


def report(name: str, ok: bool, detail: str = "") -> bool:
    (passed if ok else failed).append(name)
    print(f"{'PASS' if ok else 'FAIL'} | {name}" + (f"  -> {detail}" if detail and not ok else ""))
    return ok


def call(method: str, path: str, body=None, headers=None, raw=None, content_type=None):
    """Return (status_code, parsed_json_or_text)."""
    url = BASE_URL + path
    data = raw
    hdrs = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode()
        hdrs["Content-Type"] = "application/json"
    if content_type:
        hdrs["Content-Type"] = content_type

    request = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode()
        try:
            return exc.code, json.loads(payload)
        except json.JSONDecodeError:
            return exc.code, payload
    except urllib.error.URLError as exc:
        print(f"\nCannot reach {url} -- is the server running?  ({exc.reason})\n")
        sys.exit(2)


def multipart(field: str, filename: str, content: bytes) -> tuple[bytes, str]:
    boundary = "----WisdomKernelTestBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field}"; filename="{filename}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode() + content + f"\r\n--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


print("=" * 68)
print(f"WisdomKernel API Smoke Test -> {BASE_URL}")
print("=" * 68)

# 1. Server is up
code, data = call("GET", "/")
report("Server starts and GET / responds", code == 200 and data.get("status") == "ok", str(data))

# 1b. Database Health
code, data = call("GET", "/health/database")
report(
    "GET /health/database connects to MySQL",
    code == 200 and data.get("status") in ("connected", "unexpected_result") and data.get("tables_count", 0) >= 10,
    str(data)[:160],
)

# 2. Docs and OpenAPI schema
code, _ = call("GET", "/openapi.json")
report("GET /openapi.json serves the schema", code == 200, f"status {code}")
try:
    with urllib.request.urlopen(BASE_URL + "/docs", timeout=15) as response:
        report("GET /docs serves Swagger UI", response.status == 200)
except Exception as exc:  # noqa: BLE001
    report("GET /docs serves Swagger UI", False, str(exc))

# 3. Dashboard
code, data = call("GET", "/dashboard")
report(
    "GET /dashboard returns MySQL aggregate stats",
    code == 200 and "experiences_captured" in data.get("stats", {}),
    str(data.get("stats"))[:160],
)

# 4. Transcribe & Structure
code, data = call("POST", "/structure", {"transcript": "The problem was that a feed pump eroded its impeller repeatedly under cavitation."})
report("POST /structure returns structured experience", code == 200 and bool(data.get("experience")), str(data)[:160])

# 5. Search
code, data = call("GET", "/search?query=transformer")
report(
    "GET /search returns ranked results from MySQL",
    code == 200 and data.get("count", 0) > 0 and data["results"][0]["relevance"] > 0,
    str(data)[:200],
)

# 6. Experiences library and pagination
code, data = call("GET", "/experiences?limit=5&offset=0")
report("GET /experiences returns library with facets", code == 200 and data.get("count", 0) > 0 and bool(data.get("facets")), str(data)[:160])

code, data = call("GET", "/experiences/exp-001")
report("GET /experiences/exp-001 returns full 9-field experience", code == 200 and data.get("experience", {}).get("id") == "exp-001", str(data)[:160])

# 6b. Create experience (CRUD)
code, data = call("POST", "/experiences", {
    "title": "Smoke Test Surge Voltage",
    "problem": "Voltage surge on motor terminals.",
    "decision": "Added surge capacitors.",
    "lesson": "Surge protection prevents winding breakdown.",
    "domain": "Power Distribution",
})
report("POST /experiences writes new record to MySQL", code == 201 and bool(data.get("id")), str(data)[:160])

# 7. Mistakes
code, data = call("GET", "/mistakes")
report("GET /mistakes returns records from MySQL", code == 200 and data.get("count", 0) >= 5, str(data)[:120])

code, data = call("GET", "/mistakes/mis-001")
report("GET /mistakes/mis-001 returns single mistake with related", code == 200 and data.get("mistake", {}).get("id") == "mis-001", str(data)[:120])

# 8. Simulator
code, data = call("GET", "/simulator")
report("GET /simulator returns complete scenarios from MySQL", code == 200 and data.get("count", 0) >= 2, str(data)[:120])

# 9. Score & Attempt tracking
code, data = call("POST", "/score", {"correct_answers": 2, "total_questions": 3, "scenario_id": "incident-001"})
report("POST /score calculates score and tracks attempt", code == 200 and data.get("score") == 67, str(data)[:160])

# 10. Advice
code, data = call("GET", "/advice")
report("GET /advice returns advice from MySQL", code == 200 and data.get("count", 0) >= 8, str(data)[:120])

# 11. Protected endpoints reject unauthenticated requests
SECTIONS = ["vault", "onboarding", "troubleshooting", "postmortems", "retirement", "kri", "dashboard"]
unauth_ok = True
for section in SECTIONS:
    c, d = call("GET", f"/organization/{section}")
    if c != 401:
        unauth_ok = False
report("All 7 vault endpoints reject unauthenticated requests with 401", unauth_ok)

# 12. Login
code, data = call("POST", "/organization/login", {"organization_name": DEMO_ORG, "password": "wrong-password"})
report("POST /organization/login rejects bad credentials with 401", code == 401, str(data)[:120])

code, data = call("POST", "/organization/login", {"organization_name": DEMO_ORG, "password": DEMO_PASSWORD})
login_ok = code == 200 and bool(data.get("token"))
report("POST /organization/login succeeds with demo credentials", login_ok, str(data)[:160])
token = data.get("token", "")

# 13. Protected endpoints work after authentication
if login_ok:
    auth_header = {"Authorization": f"Bearer {token}"}
    auth_ok = True
    for section in SECTIONS:
        c, d = call("GET", f"/organization/{section}", headers=auth_header)
        if c != 200 or not d.get("data"):
            auth_ok = False
            print(f"       (section '{section}' returned {c})")
    report("All 7 vault endpoints return organization data after authentication", auth_ok)
else:
    report("All 7 vault endpoints return organization data after authentication", False, "login failed")

# 14. Unknown route
code, _ = call("GET", "/does-not-exist")
report("Unknown route returns 404 without crashing", code == 404)

print("=" * 68)
print(f"RESULT: {len(passed)} passed, {len(failed)} failed")
for name in failed:
    print("  FAILED:", name)
print("=" * 68)
sys.exit(1 if failed else 0)
