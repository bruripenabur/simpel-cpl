/**
 * Utility for Administrator Password Management in OBE Assessment System
 * Default Password: AdminIT1122
 */

const STORAGE_KEY_ADMIN_PWD = 'obe_admin_supabase_pwd_v1';
export const DEFAULT_ADMIN_PASSWORD = 'AdminIT1122';

export function getStoredAdminPassword(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_PWD);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch (err) {
    console.warn('Failed to read admin password from localStorage:', err);
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(input: string): boolean {
  if (!input) return false;
  const current = getStoredAdminPassword();
  return input.trim() === current;
}

export function updateAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 4) {
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PWD, newPassword.trim());
    return true;
  } catch (err) {
    console.error('Failed to save new admin password:', err);
    return false;
  }
}

export function resetAdminPassword(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ADMIN_PWD);
  } catch (err) {
    console.error('Failed to reset admin password:', err);
  }
}
