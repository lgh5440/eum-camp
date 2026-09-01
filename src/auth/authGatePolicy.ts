/** The public demo skips account onboarding, but the public application route remains standalone. */
export function shouldBypassAuthGate(demoMode: boolean, isPublicApplicationRoute: boolean): boolean {
  return demoMode && !isPublicApplicationRoute;
}
