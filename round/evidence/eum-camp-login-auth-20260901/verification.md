# E:UM Camp auth verification — 2026-09-01

## Scope

- Source files: `src/auth/LoginScreen.tsx`, `src/auth/SetupScreen.tsx`, `src/auth/EventSetupWizard.tsx`
- Deployment config: `.github/workflows/firebase-deploy.yml`
- No archived or backup files were modified.

## Static and build evidence

- `eum-camp-auth-regression.mjs`: passed after the change.
- The check covers forbidden legacy gold/orange/amber literals, lucide usage, card depth, and `VITE_DEMO_MODE=true` in the deployment workflow.
- `npm run build`: passed; Vite transformed 1,830 modules.
- `npm run lint`: passed with 8 pre-existing warnings in unrelated `src/pages/*` files and 0 errors.

## Playwright evidence

- `login-screen-blue.png`: local LoginScreen shows the blue E:UM Camp brand mark, lucide user/shield/lock icons, blue access divider, blue focus-capable fields, raised white card, and blue gradient CTA.
- `login-after-demo1234.png`: submitting `demo1234` created an admin session (`role=admin`, `displayName=체험용 관리자`) and advanced to the event setup screen.
- `login-after-1234.png`: submitting `1234` created a committee session (`role=committee`, `displayName=운영위원`) and advanced to the expected event-information pending screen.
- Playwright captured no failed requests or page errors. The local Vite log had no Firebase warning in the final `VITE_DEMO_MODE=false` run.

## Actions / live deployment investigation

- Run #30: [33498843331](https://github.com/lgh5440/eum-camp/actions/runs/33498843331), HEAD `7fea28e098b081ed2c107c8a62a759645077172e`, `completed/failure`.
- API job inspection identifies only `Deploy Hosting and Firestore rules` as failed; checkout, install, lint, build, and service-account write completed successfully.
- GitHub's public job page says `Sign in to view logs`; the REST logs endpoint returns HTTP 403 (`Must have admin rights to Repository`). Therefore the exact Firebase CLI terminal error is not exposed to this unauthenticated worker and is not claimed here.
- The failure is not caused by `VITE_DEMO_MODE` missing: that variable is consumed during the successful Build step and cannot explain a later deploy-step exit 1. It is a separate public-demo behavior defect, now fixed in the workflow by adding `VITE_DEMO_MODE: 'true'`.
- The current workflow already uses step-level `GOOGLE_APPLICATION_CREDENTIALS` and writes the service account to `$RUNNER_TEMP`; commit `a6c646b` documents that earlier job-level runner-context issue and its correction. Run #30's observable evidence confirms a distinct deploy-step failure remains, but the unauthenticated log restriction prevents deeper attribution.

## Deployment boundary

- No `git push`, Actions rerun, workflow dispatch, or Firebase deployment was performed after the master cancellation. Live Firebase remains unchanged by this task.
