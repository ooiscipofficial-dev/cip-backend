import { councilApi } from '../api/councilApi';

const STORAGE_KEY = 'councilhub_session';
// ─── Google Logic ──────────────────────────────────────────

const COUNCIL_EMAIL_MAP = {
  "oois.academic@gmail.com":    "academic-council",
  "oois.literary@gmail.com":    "literary-council",
  "oois.discipline@gmail.com":  "discipline-council",
  "oois.innotech@gmail.com":    "innovation-tech-council",
  "oois.media@gmail.com":       "media-pr-council",
  "oois.wellbeing@gmail.com":   "wellbeing-council",
  "oois.environment@gmail.com": "environment-council",
  "oois.sports@gmail.com":      "sports-council",
  "oois.cultural@gmail.com":    "cultural-council",
  "oois.aries.house@gmail.com": "aries-house",
  "oois.aquarius.house@gmail.com": "aquarius-house",
  "oois.leo.house@gmail.com":   "leo-house",
  "oois.taurus.house@gmail.com":"taurus-house",
};

// Resolve email → councilId (used after real Google OAuth callback)
export function resolveGoogleEmail(email) {
  const councilId = COUNCIL_EMAIL_MAP[email?.toLowerCase().trim()];
  if (!councilId) return { success: false, error: `No council mapped to ${email}` };
  return { success: true, councilId };
}

// Simulated Google OAuth delay for the UI
export function simulateGoogleLogin(councilId) {
  return new Promise(resolve => setTimeout(() => resolve({ success: true, councilId }), 600));
}
// ─── Session Helpers ──────────────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

export function setSession(s) { 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); 
}

export function clearSession() { 
  localStorage.removeItem(STORAGE_KEY); 
}

export function isPresident(s) { return s?.role === 'President'; }
export function isManager(s)   { return s?.role === 'manager'; }

// ─── Login Logic ──────────────────────────────────────────

/**
 * Member Login via Worker
 */
// src/lib/authStore.js

export async function memberLogin(username, password, councilId) {
  try {
    // Make sure councilApi is imported in this file too!
    const result = await councilApi.loginMember(username, password, councilId);
    
    if (result.success) {
      // Your session handling logic
      setSession(result.session); 
      return { success: true, session: result.session };
    }
    
    return { success: false, error: result.error || 'Invalid credentials' };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: "Connection failed" };
  }
}
/**
 * Manager Login via Worker
 */
// lib/authStore.js

export async function managerLogin(username, password) {
  try {
    // Package them into the object the Worker is looking for
    const credentials = { username, password };
    
    const result = await councilApi.loginManager(credentials);
    
    if (result.success) {
      return { 
        success: true, 
        session: { role: 'manager', token: result.token } 
      };
    }
    return { success: false, error: result.error };
  } catch (err) {
    return { success: false, error: "Server connection failed" };
  }
}
