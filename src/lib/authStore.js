import { councilApi } from '../api/councilApi';

const STORAGE_KEY = 'councilhub_session';

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return normalizeSession(session);
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSession(session)));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function getSessionType(session) {
  const explicitType = normalizeRole(session?.type || session?.userType || session?.accountType);
  if (explicitType) return explicitType;

  const role = normalizeRole(session?.role);
  if (role === 'manager') return 'manager';
  if (role) return 'member';

  return '';
}

export function getSessionCouncilId(session) {
  return String(session?.councilId || session?.councilID || session?.council_id || session?.id || '').trim();
}

export function isMember(session) {
  return getSessionType(session) === 'member';
}

export function isOwnCouncilMember(session, councilId) {
  return isMember(session) && getSessionCouncilId(session) === String(councilId || '').trim();
}

export function isPresident(session) {
  const role = normalizeRole(session?.role);
  return role === 'president' || role === 'council president' || role.includes('president');
}

export function isManager(session) {
  return getSessionType(session) === 'manager';
}

function normalizeSession(session, fallbackCouncilId) {
  if (!session || typeof session !== 'object') return session;

  const type = getSessionType(session) || 'member';
  const councilId = getSessionCouncilId(session) || fallbackCouncilId;

  return {
    ...session,
    type,
    councilId,
  };
}

export async function memberLogin(username, password, councilId) {
  try {
    const result = await councilApi.loginMember(username, password, councilId);

    if (result.success) {
      const session = normalizeSession(result.session, councilId);
      setSession(session);
      return { success: true, session };
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
      const session = normalizeSession({ role: 'manager', token: result.token });
      return {
        success: true,
        session,
      };
    }

    return { success: false, error: result.error };
  } catch {
    return { success: false, error: 'Server connection failed' };
  }
}
