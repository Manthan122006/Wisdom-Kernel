"""
seed.py
-------
Convenience CLI command to seed the Aiven MySQL database with WisdomKernel knowledge.
Idempotent: safe to run multiple times without duplicating data.
"""

from __future__ import annotations

import sys
from app.database.connection import SessionLocal, check_database_connection
from migrate_json import run_migration

def main():
    print("Connecting to database...")
    health = check_database_connection()
    if health.get("status") != "connected":
        print(f"Error: Could not connect to database. Details: {health}")
        sys.exit(1)

    print(f"Connected to {health.get('dialect')} database. Seeding data...")
    db = SessionLocal()
    try:
        counts = run_migration(db)
        print("\n" + "=" * 55)
        print("WISDOMKERNEL SEED COMPLETED SUCCESSFULLY")
        print("=" * 55)
        for table, count in counts.items():
            print(f"  {table:32s}: {count:5d} records")
        print("=" * 55)
    except Exception as exc:
        print(f"\nSeed failed with error: {exc}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
