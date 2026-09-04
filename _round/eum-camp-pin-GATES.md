# Gates: eum-camp PIN PBKDF2 migration

OWNS: src/auth/storage.ts, src/auth/AuthContext.tsx, src/auth/types.ts, src/auth/storage.test.ts

Scope: Store new PIN/password credentials as salted PBKDF2 records while preserving and upgrading legacy SHA-256 records on successful login.

- [x] G1: Credential migration unit tests pass
  CHECK: npm test -- src/auth/storage.test.ts
  EXPECT: /Tests\s+3 passed/
  CWD: ..
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\hong\09_이음\02_제품\Web\eum-camp; path=b03093b53694/20 entries; EXPECT=matched; output-sha256=76ffcf2a82191172df1b3d588e75b6a1ea009e5f4f0d43159fab4151bc7015b5; output-bytes=286

- [x] G2: The production build passes
  CHECK: npm run build
  EXPECT: built in
  CWD: ..
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\hong\09_이음\02_제품\Web\eum-camp; path=b03093b53694/20 entries; EXPECT=matched; output-sha256=1204599bc7649fd55aaddebc0dc09eb346455635f995bd0a88914b2e050f8f8c; output-bytes=3530

- [x] G3: The complete test suite passes
  CHECK: npm test
  EXPECT: passed
  CWD: ..
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\hong\09_이음\02_제품\Web\eum-camp; path=b03093b53694/20 entries; EXPECT=matched; output-sha256=3e94a11afaeb5ae5130cf764dd8d1f61be81f43c8cc74c424d592e831047374a; output-bytes=265

- [x] G4: Local commit and diff evidence are recorded
  EVIDENCE: commit 788f89a; git diff --check passed; verification report at round/evidence/eum-camp-pin-pbkdf2-20260904/verification.md
