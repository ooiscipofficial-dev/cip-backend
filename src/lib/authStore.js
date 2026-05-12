import { councilApi } from '../api/councilApi';

const STORAGE_KEY = 'councilhub_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isPresident(session) {
  return String(session?.role || '').toLowerCase() === 'president';
}

export function isManager(session) {
  const userType = session?.type || session?.role;
  return String(userType || '').toLowerCase() === 'manager';
}

export async function memberLogin(username, password, councilId) {
  try {
    const result = await councilApi.loginMember(username, password, councilId);

    if (result.success) {
      setSession(result.session);
      return { success: true, session: result.session };
    }

    return { success: false, error: result.error || 'Invalid credentials' };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, error: 'Connection failed' };
  }
}

export async function managerLogin(username, password) {
  try {
    const credentials = { username, password };
    const result = await councilApi.loginManager(credentials);

    if (result.success) {
      return {
        success: true,
        session: { role: 'manager', token: result.token },
      };
    }

    return { success: false, error: result.error };
  } catch {
    return { success: false, error: 'Server connection failed' };
  }
}
