#!/usr/bin/env python3
"""
CLI utility to create or promote a Super Admin account in FacePass.

Usage:
    python create_admin.py --email admin@university.edu --name "System Admin" --password AdminPassword123
"""
import argparse
import random
import bcrypt
from dotenv import load_dotenv

load_dotenv()

from models import storage
from models.user import User
from models.auth_provider import AuthProvider


def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description="Create or promote a FacePass Super Admin user.")
    parser.add_argument("--email", required=True, help="Admin institutional email address")
    parser.add_argument("--name", default="System Administrator", help="Admin full name")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--matric", default=None, help="Optional staff ID (e.g., ADM-0001)")
    parser.add_argument(
        "--force-change",
        action="store_true",
        help="Require password change upon next login (default: False for CLI bootstrap)",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    name = args.name.strip()
    password = args.password.strip()
    matric = (args.matric or f"ADM-{random.randint(1000, 9999)}").strip()

    ses = storage._DBStorage__session
    existing = ses.query(User).filter(User.email == email).first()

    if existing:
        existing.role = "admin"
        existing.is_verified = True
        existing.must_change_password = bool(args.force_change)
        if args.name:
            existing.name = name

        auth_prov = ses.query(AuthProvider).filter_by(userID=existing.id).first()
        if auth_prov:
            auth_prov.password = _hash_password(password)
        else:
            auth_prov = AuthProvider(
                password=password,
                provider="Local",
                provider_id=email,
                userID=existing.id,
            )
            auth_prov.save()

        storage.save()
        print(f"[OK] Promoted existing user '{existing.email}' (ID: {existing.id}) to role='admin'.")
    else:
        user = User(
            name=name,
            email=email,
            matric=matric,
            role="admin",
            is_verified=True,
            verification_code=None,
            must_change_password=bool(args.force_change),
        )
        user.save()

        created = storage.get_email(User, email)
        provider = AuthProvider(
            password=password,
            provider="Local",
            provider_id=email,
            userID=created.id,
        )
        provider.save()
        print(f"[OK] Created new Super Admin '{created.email}' (ID: {created.id}, Staff ID: {created.matric}).")


if __name__ == "__main__":
    main()
