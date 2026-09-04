# eum-camp PIN PBKDF2 migration verification

## Scope

- New credentials are stored as `pbkdf2-sha256$<iterations>$<salt>$<derived-key>` records.
- Existing SHA-256 records remain verifiable and are upgraded only after a successful login.
- Admin and committee credentials use the same migration path; committee upgrade runs before a session exists.

## Evidence

- `npm test`: 7 test files, 55 tests passed.
- `npm test -- src/auth/storage.test.ts`: 3 migration tests passed.
- `npm run build`: TypeScript compilation and Vite production build passed.
- `npm run lint`: 0 errors; 8 pre-existing React hook warnings remain outside this change.
- `git diff --check`: passed before commit.

## Source anchors

- `src/auth/storage.ts`: PBKDF2 derivation, record encoding, legacy verification, and upgrade persistence.
- `src/auth/AuthContext.tsx`: successful-login detection and in-place upgrade call.
- `src/auth/storage.test.ts`: current-format verification, legacy compatibility, and selective upgrade coverage.
