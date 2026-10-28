import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminAuth, computeHash } from '../services/adminAuth';
import { db } from '../services/db';

describe('Admin Authentication & Security Controls', () => {
  beforeEach(() => {
    adminAuth.resetAll();
    adminAuth.clearSession();
    db.setAdminSession(null);
  });

  afterEach(() => {
    adminAuth.resetAll();
    adminAuth.clearSession();
    db.setAdminSession(null);
  });

  it('computes salted SHA-256 hash correctly without exposing plaintext credentials', async () => {
    const hash = await computeHash('admin1234');
    expect(hash).toBe('96115dc05b04dfa3c7ea6b4419f160839f0b9ad08bde87016a7b00966f674580');
    expect(hash.length).toBe(64);
  });

  it('authenticates successfully with valid admin credentials (admin1234 / admin1234)', async () => {
    const result = await adminAuth.login('admin1234', 'admin1234');
    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session?.role).toBe('admin');
    expect(result.session?.token).toMatch(/^v2_adm_/);

    const activeSession = adminAuth.getSession();
    expect(activeSession).not.toBeNull();
    expect(activeSession?.role).toBe('admin');
  });

  it('rejects invalid password and tracks remaining attempts', async () => {
    const result = await adminAuth.login('admin1234', 'wrong_password_999');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid administrator username or password');
    expect(result.rateLimit?.attemptsRemaining).toBe(4);
  });

  it('rejects invalid username and tracks remaining attempts', async () => {
    const result = await adminAuth.login('fake_admin', 'admin1234');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid administrator username or password');
    expect(result.rateLimit?.attemptsRemaining).toBe(4);
  });

  it('enforces lockout rate limiting after 5 consecutive failed attempts', async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await adminAuth.login('admin1234', 'bad_pass');
      expect(res.success).toBe(false);
      expect(res.rateLimit?.isLocked).toBe(false);
      expect(res.rateLimit?.attemptsRemaining).toBe(5 - i);
    }

    // 5th failed attempt triggers lockout
    const finalRes = await adminAuth.login('admin1234', 'bad_pass');
    expect(finalRes.success).toBe(false);
    expect(finalRes.rateLimit?.isLocked).toBe(true);
    expect(finalRes.rateLimit?.remainingSeconds).toBeGreaterThan(0);

    // Subsequent attempt while locked is blocked immediately
    const blockedRes = await adminAuth.login('admin1234', 'admin1234');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.error).toContain('Too many failed attempts');
  });

  it('terminates admin session upon logout', async () => {
    const loginRes = await adminAuth.login('admin1234', 'admin1234');
    expect(loginRes.success).toBe(true);
    expect(adminAuth.getSession()).not.toBeNull();

    await adminAuth.logout();
    expect(adminAuth.getSession()).toBeNull();
  });

  it('prevents customer privilege escalation on admin database operations', async () => {
    // Ensure no admin session
    adminAuth.clearSession();
    db.setAdminSession(null);

    // In a non-test environment or when assertAdminAuthorized is checked,
    // unauthenticated calls must be blocked.
    // Test assertAdminAuthorized directly by temporarily mocking isAdminAuthorized
    const originalMethod = db.isAdminAuthorized.bind(db);
    db.isAdminAuthorized = () => false;

    try {
      expect(() => db.assertAdminAuthorized()).toThrow(/Administrative authorization is required/);

      await expect(
        db.createProduct({
          name: 'Hacked Product',
          description: 'Hacked',
          category_id: 'cat-1',
          sku: 'HACK-01',
          selling_price_paise: 100,
          stock_physical: 10
        })
      ).rejects.toThrow(/Administrative authorization is required/);

      await expect(
        db.updateBusinessSettings({ business_name: 'Hacked Boutique' })
      ).rejects.toThrow(/Administrative authorization is required/);

      await expect(
        db.adjustStock('prod-1', 9999, 'Malicious increase')
      ).rejects.toThrow(/Administrative authorization is required/);

      await expect(
        db.getInventoryMovements()
      ).rejects.toThrow(/Administrative authorization is required/);

      await expect(
        db.getCustomers()
      ).rejects.toThrow(/Administrative authorization is required/);

      // Verify that getOrders without phone/customerId returns empty list
      const ordersRes = await db.getOrders({ limit: 10 });
      expect(ordersRes.data.length).toBe(0);
      expect(ordersRes.total).toBe(0);
    } finally {
      db.isAdminAuthorized = originalMethod;
    }
  });
});
