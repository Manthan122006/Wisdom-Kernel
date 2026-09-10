# WisdomKernel — Frontend

**Team AXIOM · Smart India Hackathon 2026**

> *"Experience should never retire."*

React + Vite frontend for the WisdomKernel FastAPI backend. Nine features, every one connected to a real endpoint.

---

## Quick start

The backend must be running first.

```bash
# Terminal 1 — backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env       # Windows: copy .env.example .env
npm run dev
```

Open <http://localhost:5173>.

The sidebar shows a live **Backend connected** indicator. If it reads *Backend unreachable*, the API is not running or `VITE_API_BASE_URL` is wrong.

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

---

## Project structure

```
frontend/
├── index.html                     # fonts + root element
├── package.json
├── vite.config.js
├── tailwind.config.js             # design tokens: colour, type scale, motion
├── postcss.config.js
├── .env.example
├── README.md
│
└── src/
    ├── main.jsx                   # entry: Router + AuthProvider
    ├── App.jsx                    # route table
    ├── index.css                  # base styles + the record-sheet classes
    │
    ├── api/
    │   └── api.js                 # every endpoint, the axios instance, 401 handling
    │
    ├── context/
    │   └── AuthContext.jsx        # token + organization state
    │
    ├── hooks/
    │   ├── useApi.js              # loading / error / reload for every read
    │   └── useRecorder.js         # MediaRecorder lifecycle and permissions
    │
    ├── layouts/
    │   └── AppLayout.jsx          # sidebar, mobile drawer, page container
    │
    ├── components/
    │   ├── Button.jsx             # one button, four variants
    │   ├── Card.jsx               # Card, Badge, DemoBadge
    │   ├── Metrics.jsx            # ProgressBar, Stat, StatRow
    │   ├── Modal.jsx              # focus-trapped dialog
    │   ├── PageHeader.jsx         # heading + breadcrumbs
    │   ├── ProtectedRoute.jsx     # vault guard
    │   ├── RecordSheet.jsx        # the nine-field record layout
    │   ├── Sidebar.jsx            # nav items + backend status
    │   └── StateViews.jsx         # LoadingState, ErrorState, EmptyState
    │
    ├── pages/
    │   ├── Home.jsx
    │   ├── Record.jsx
    │   ├── Search.jsx
    │   ├── Mistakes.jsx
    │   ├── Simulator.jsx
    │   ├── TransferScore.jsx
    │   ├── Advice.jsx
    │   ├── OrganizationLogin.jsx
    │   └── OrganizationVault.jsx
    │
    └── utils/
        └── format.js              # display helpers + real simulator run history
```

---

## Route table

| Route | Page | Auth | Backend calls |
|---|---|---|---|
| `/` | Home / dashboard | — | `GET /dashboard` |
| `/record` | Record Experience | — | `POST /transcribe` |
| `/search` | Ask Experience | — | `GET /search` |
| `/mistakes` | Mistakes Library | — | `GET /mistakes` |
| `/simulator` | Incident Simulator | — | `GET /simulator`, `POST /score` |
| `/score` | Experience Transfer Score | — | `POST /score` |
| `/advice` | What I Wish I Knew | — | `GET /advice` |
| `/organization` | Organization login | — | `POST /organization/login` |
| `/organization/vault` | Organization vault | **Token** | 7 `GET /organization/*` calls |
| `*` | Not found | — | — |

Every route also runs `GET /` once on load for the backend status indicator.

---

## Backend API integration table

| UI element | Method | Endpoint | Request | Response fields used |
|---|---|---|---|---|
| Backend status dot | GET | `/` | — | `status` |
| Home statistics | GET | `/dashboard` | — | `stats.*`, `domains`, `recent_experiences`, `note` |
| Record → structure | POST | `/transcribe` | `FormData` field **`file`** | `transcript`, `experience.*` (9 fields), `meta.transcription_mode`, `meta.extraction_mode`, `meta.notices` |
| Search results | GET | `/search` | `query`, `engineering_type`, `company`, `domain`, `expertise`, `years_min`, `years_max`, `limit` | `count`, `ranking_method`, `message`, `results[]` |
| Mistakes grid | GET | `/mistakes` | — | `count`, `mistakes[]` |
| Scenario picker + steps | GET | `/simulator` | — | `scenarios[].steps[].options[]`, `senior_reasoning`, `lesson` |
| Run scoring | POST | `/score` | `scenario_id`, `correct_answers`, `total_questions`, `time_taken_seconds`, optional `previous_score` | `score`, `band`, `band_description`, `improvement`, `improvement_note`, `metrics.*`, `formula`, `disclaimer` |
| Advice cards + tabs | GET | `/advice` | `category` | `count`, `categories`, `advice[]` |
| Login | POST | `/organization/login` | `organization_name`, `password` | `token`, `organization.id`, `organization.name` |
| Vault tabs (7) | GET | `/organization/{section}` | `Authorization: Bearer <token>` | `organization`, `section`, `count`, `data` |

**Auth header.** An axios request interceptor attaches `Authorization: Bearer <token>` to every request once a token exists. A `401` on any request except login clears the token and redirects to `/organization` with a "Your session has expired" notice.

---

## Data integrity

The brief was explicit about not inventing data, so three places deserve a note:

**Transfer Score has no fake "before".** The score, band and metrics all come from `POST /score`. A *Before* figure appears only after a second real run exists; until then the page shows the backend's own `improvement_note` explaining why there is no baseline. "Faster resolution", "Fewer hints" and "Reasoning quality" are listed as **Not measured**, with the reason, rather than filled with plausible numbers.

**The vault renders what the backend sends.** The Dashboard tab is built generically from the response object, so its labels can never drift from the API. Where the brief asked for a measure the backend does not expose — onboarding completion, time to productivity — the tile reads "Not tracked yet" instead of showing an estimate.

**Extraction gaps stay visible.** A `null` field from `/transcribe` renders as *"Not covered in this recording"*. When the backend falls back to its offline extractor, the page says so in a badge and repeats the backend's own notice.

**Demo data is labelled.** Records with `is_demo: true` carry a "Demo data" badge.

---

## Suggested backend additions

None of these are required to run the app — every page works today. They would let the UI show measures it currently marks as untracked.

| Want to display | Needs | Where |
|---|---|---|
| Onboarding progress, completed tasks, time to productivity | Per-engineer completion on `GET /organization/onboarding` | Vault → Onboarding |
| KRI as Capture / Preservation / Transfer | Those three sub-scores on `GET /organization/kri`; it currently returns a different indicator set, which the UI renders faithfully | Vault → KRI |
| Engineers, simulations completed, average transfer score | Those keys on `GET /organization/dashboard`; the tab renders whatever keys arrive | Vault → Dashboard |
| A lesson per troubleshooting guide | A `lesson` field on `GET /organization/troubleshooting` | Vault → Troubleshooting |
| Score history across sessions | Server-side run storage; history is currently per-browser | Transfer Score |
| Saving a captured experience | A `POST /experiences` endpoint — `/transcribe` returns the record but nothing persists it | Record |

One documentation change was made to the backend README: the frontend env var is `VITE_API_BASE_URL` throughout, per this brief.

---

## Testing checklist

Start both servers, then walk this list.

| # | Check | Expected |
|---|---|---|
| 1 | Load `/` | Hero, pipeline, three actions, live statistics |
| 2 | Sidebar status dot | "Backend connected" |
| 3 | `/record` → Start recording | Browser asks for the microphone; timer counts up with a pulsing dot |
| 4 | Stop recording | Audio player appears for playback |
| 5 | Structure this experience | Transcript, then the nine-field record sheet |
| 6 | Null fields | Show "Not covered in this recording" |
| 7 | Deny microphone permission | Clear guidance, no crash |
| 8 | `/search` "transformer tripping after rain" | Ranked results, top one is the transformer experience with a match % |
| 9 | Search → View experience | Modal opens; Escape closes it; focus returns to the button |
| 10 | Search "asdfgh" | "No experiences found" with the backend's message |
| 11 | Apply a domain filter | Results narrow; the filter count appears on the button |
| 12 | `/mistakes` | Six cards; the lesson block is the loudest element |
| 13 | Mistakes filter box | Narrows without a network request |
| 14 | `/simulator` → start an incident | One decision at a time with a progress bar |
| 15 | Choose an option | Selection locks, feedback appears, correct answer is marked |
| 16 | Click the same step again | Nothing changes — answers are final |
| 17 | Finish the incident | Score, correct decisions, accuracy, senior reasoning, key lesson |
| 18 | `/score` | Latest run; no "Before" until a second run exists |
| 19 | Complete a second incident | Before / After / Improvement, all real |
| 20 | `/advice` category tabs | Refetches per category; counts update |
| 21 | Visit `/organization/vault` signed out | Redirects to `/organization` |
| 22 | Log in with a wrong password | "That organization name and password do not match" |
| 23 | Log in as `northwind` / `northwind@2026` | Redirects to the vault |
| 24 | Click all 7 vault tabs | Each loads independently with its own spinner |
| 25 | Log out, log in as `meridian` / `meridian@2026` | Different data — no leakage between organizations |
| 26 | Stop the backend, reload a page | "Unable to connect to WisdomKernel" with the uvicorn command |
| 27 | Clear the token in devtools, click a vault tab | Session-expired notice on the login page |
| 28 | Resize to 375px | Sidebar becomes a drawer; no horizontal scrolling |
| 29 | Tab through any page | Visible royal focus ring on every control |
| 30 | Enable reduced motion | Animations stop |

### Demo credentials

| Organization | Name or slug | Password |
|---|---|---|
| Northwind Power Systems | `northwind` | `northwind@2026` |
| Meridian Cloud Labs | `meridian` | `meridian@2026` |

---

## Design notes

**Palette.** Off-white `#F6F7F9`, deep navy `#0A1F3C`, royal blue `#1B4BD8`. Secondary colour is semantic only: teal for a correct decision, red for an incorrect one, amber for caution. No gradients, no glass, no glow.

**Type.** Source Serif 4 for headings, IBM Plex Sans for the interface, IBM Plex Mono for real numerals — the recording timer, scores and match percentages.

**The record sheet.** The nine-field layout with its fixed label column and hairline rules is the one piece of deliberate visual identity, borrowed from engineering incident report forms. It appears in the extraction result, the search detail view and the mistakes cards, so structured knowledge always reads the same way. Everything around it stays quiet — borders carry structure instead of shadows.

**Motion.** Page fade-in, a recording pulse, the progress-bar fill, and the modal transition. Nothing else moves, and `prefers-reduced-motion` disables all of it.

**Accessibility.** Semantic landmarks, a skip link, labels on every input, `aria-live` on async regions, `role="tablist"` with `aria-selected` on both tab sets, a focus trap in the modal, and a visible focus ring that is never removed.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| "Backend unreachable" | Backend not running, or `VITE_API_BASE_URL` is wrong. Restart Vite after editing `.env`. |
| CORS error in the console | Add `http://localhost:5173` to `ALLOWED_ORIGINS` in the backend `.env`, then restart uvicorn. |
| Microphone button does nothing | `getUserMedia` needs `http://localhost` or HTTPS. A LAN IP such as `192.168.x.x` will be blocked. |
| `422` from `/transcribe` | The form field must be named `file`. `api.js` already does this. |
| Logged out after a backend restart | Expected — sessions are in memory on the backend prototype. |
| Transfer Score is empty | Complete an incident in the simulator first. Nothing is shown without a real run. |
