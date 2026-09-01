import { describe, expect, it } from 'vitest';
import { shouldBypassAuthGate } from './authGatePolicy';

describe('AuthGate mode policy', () => {
  it('bypasses onboarding in demo mode but never on the public application route', () => {
    expect(shouldBypassAuthGate(true, false)).toBe(true);
    expect(shouldBypassAuthGate(true, true)).toBe(false);
  });

  it('keeps onboarding enabled for real installations', () => {
    expect(shouldBypassAuthGate(false, false)).toBe(false);
  });
});
