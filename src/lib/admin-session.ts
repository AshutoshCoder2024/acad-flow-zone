const STORAGE_KEY = "deptportal_admin_session";

export type AdminSession = {
  token: string;
  username: string;
  expiresAt: number;
};

export function saveAdminSession(session: AdminSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.token || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
      clearAdminSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAdminToken(): string | null {
  return getAdminSession()?.token ?? null;
}
