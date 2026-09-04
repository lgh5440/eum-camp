import { describe, expect, it } from 'vitest';
import { hash, hashCredential, loadCreds, upgradeCreds, verifyCredential, CREDS_KEY } from './storage';

describe('credential hashing', () => {
  it('creates salted PBKDF2 records and verifies the correct secret', async () => {
    const record = await hashCredential('2468');

    expect(record.startsWith('pbkdf2-sha256$')).toBe(true);
    await expect(verifyCredential('2468', record)).resolves.toEqual({ valid: true, needsRehash: false });
    await expect(verifyCredential('9999', record)).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it('accepts a legacy SHA-256 record and marks it for upgrade', async () => {
    const legacy = await hash('2468');

    await expect(verifyCredential('2468', legacy)).resolves.toEqual({ valid: true, needsRehash: true });
    await expect(verifyCredential('9999', legacy)).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it('upgrades only the successfully verified legacy credential', async () => {
    localStorage.setItem(CREDS_KEY, JSON.stringify({
      adminHash: await hash('admin-secret'),
      committeeHash: await hash('2468'),
      adminName: 'Admin',
      setupAt: new Date().toISOString(),
      version: 1,
    }));

    const upgraded = await upgradeCreds({ committeePin: '2468' });

    expect(upgraded?.adminHash).not.toMatch(/^pbkdf2-sha256\$/);
    expect(upgraded?.committeeHash).toMatch(/^pbkdf2-sha256\$/);
    await expect(verifyCredential('2468', loadCreds()!.committeeHash!)).resolves.toEqual({ valid: true, needsRehash: false });
  });
});
