import { councilApi, API_BASE } from '../api/councilApi';

function stripSensitiveFields(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(stripSensitiveFields);

  return Object.fromEntries(
    Object.entries(data)
      .filter(([key]) => key !== 'credentials' && key !== 'password' && key !== 'username')
      .map(([key, value]) => [key, stripSensitiveFields(value)])
  );
}

// ─── Core store (Now Cloud-Synced) ───────────────────────────
const DATA_KEY = 'councilhub_data_v2';
const THEME_KEY = 'councilhub_theme';
const STORAGE_KEY = 'councilhub_session';
const FILES_KEY = 'councilhub_files_v1';

// Replace the old loadStore with a fetch

export async function getCouncilData(councilId) {
  // Use the sanitizer from councilApi
  return await councilApi.getCouncilData(councilId);
}

export async function getSystemSettings() {
  return await councilApi.getSystemSettings();
}

export async function saveSystemSettings(settings) {
  return await councilApi.saveSystemSettings(settings);
}

export async function syncCouncilToCloud(councilId, data) {
  try {
    const success = await councilApi.saveCouncilData(councilId, data);
    if (success) {
      // Clear the local aggregate cache so the dashboard refreshes with fresh data
      localStorage.removeItem('cip_manager_all_data');
      localStorage.removeItem('cip_manager_all_data_v2');
      localStorage.removeItem('cip_manager_all_data_v3');
      localStorage.removeItem('cip_manager_all_data_v4');
      localStorage.removeItem('cip_manager_all_data_v5');
      localStorage.removeItem('cip_manager_all_data_v6');
    }
    return { success };
  } catch (error) {
    console.error("Sync failed:", error);
    return { success: false };
  }
}

export async function saveInitiative(councilId, initiative) {
  return await councilApi.saveInitiativeAPI({ councilId, ...initiative });
}

// ... other logic functions (reject, approve, etc.) should follow the same 
// "Get Data -> Modify -> syncCouncilToCloud" pattern.

  // 3. Push back to Cloud
  



// ─── Theme (Stays in localStorage) ────────────────────────
export function getTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
/**
 * Builds a structured report object for PDF generation.
 * Merges static council info with dynamic cloud data.
 */
export function buildPDFReport(councils, storeData) {
  return councils.map(council => {
    // Get the dynamic data for this council from our store object
    const data = storeData[council.id] || {};
    
    // Fallback logic for an empty database
    const initiatives = data.initiatives || [];
    const approved = data.approvedList || [];
    const rejected = data.rejectedList || [];
    const successful = data.successfulInitiatives || [];

    return {
      councilName: council.name,
      academicYear: "2026-27",
      color: council.color,
      mission: data.info?.mission || "Mission statement pending update.",
      impactScore: council.impactScore || 0,
      achievement: data.info?.achievement || "No major achievements recorded yet.",
      
      // Categorized Stats for the report header
      stats: {
        totalInitiatives: initiatives.length,
        completionRate: initiatives.length > 0 
          ? Math.round((successful.length / initiatives.length) * 100) 
          : 0,
        approvedCount: approved.length,
      },

      // Detailed Initiative Breakdown
      initiatives: initiatives.map(ini => ({
        title: ini.title || "Untitled Project",
        summary: ini.summary || "No description provided.",
        lead: ini.lead?.name || "Unassigned",
        role: ini.lead?.role || "Member",
        type: ini.initiativeType || 'one-time',
        status: ini.isSuccessful ? "Completed Successfully" : "In Progress",
        managerComments: ini.managerComments || [],
      })),

      // History Logs
      approvedLog: approved,
      rejectedLog: rejected,
      successfulLog: successful,
      events: data.calendarEvents || []
    };
  });
}
/**
 * The "Nuclear Option": 
 * 1. Wipes the remote D1 database via the Worker API.
 * 2. Clears all local browser storage.
 */
export async function clearSystemData() {
  try {
    // 1. Tell the Worker to wipe the DB
    const response = await councilApi.wipeRemoteDatabase();
    
    if (!response.success) {
      throw new Error("Failed to clear remote database");
    }

    // 2. Clear all local browser data
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FILES_KEY);
    localStorage.removeItem('councilhub_credentials');

    // 3. Optional: Hard refresh to reset app state
    window.location.href = '/';
    
    return { success: true };
  } catch (error) {
    console.error("Critical error during system wipe:", error);
    return { success: false, error: error.message };
  }
}

// Added back for the component import
export async function clearAllCouncilData(councilId) {
  await councilApi.clearSingleCouncil(councilId);
}
// lib/dataStore.js
import { COUNCILS_DATA } from './mockData';

export async function getAllCouncilsData() {
  const CACHE_KEY = 'cip_manager_all_data_v7';
  [
    'cip_manager_all_data',
    'cip_manager_all_data_v2',
    'cip_manager_all_data_v3',
    'cip_manager_all_data_v4',
    'cip_manager_all_data_v5',
    'cip_manager_all_data_v6'
  ].forEach(key => localStorage.removeItem(key));

  const cached = localStorage.getItem(CACHE_KEY);
  
  let cachedParsed = null;
  if (cached) {
    try {
      cachedParsed = JSON.parse(cached);
    } catch (e) {
      console.warn("Manager cache corrupt");
    }
  }

  try {
    const response = await fetch(`${API_BASE}/councils/full?cb=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error("Failed to fetch aggregate data");
    
    const data = stripSensitiveFields(await response.json());
    
    // Save to local storage for instant next-load
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));

    return data;
  } catch (error) {
    console.error("Error fetching global council data:", error);
    // Fallback to cache if available even if stale
    return cachedParsed ? cachedParsed.data : {}; 
  }
}
export function calculateImpactScore(baseScore, data) {
  const initiatives = data?.initiatives || [];
  const approved = data?.approvedList || data?.approved || initiatives.filter(i => i.status === 'approved');
  const successful = data?.successfulInitiatives || initiatives.filter(i => i.isSuccessful === true || i.isSuccessful === 1 || i.isSuccessful === '1');
  const rejected = data?.rejectedList || data?.rejected || initiatives.filter(i => i.status === 'rejected');
  const rawBase = Number(baseScore ?? data?.baseScore ?? data?.info?.baseScore ?? 0);
  const base = Number.isFinite(rawBase) ? Math.min(50, Math.max(0, rawBase)) : 0;

  const activity = Math.min(initiatives.length * 0.5, 10);
  const approval = Math.min(approved.length * 1.0, 10);
  const execution = Math.min(successful.length * 3.0, 30);
  const rejectionPenalty = Math.min(rejected.length * 1.5, 15);

  const today = new Date().toISOString().split('T')[0];
  const overduePenalty = initiatives.filter(i =>
    i.executionDate &&
    i.executionDate < today &&
    !(i.isSuccessful === true || i.isSuccessful === 1 || i.isSuccessful === '1')
  ).length * 2;

  const inactivityPenalty = initiatives.length === 0 ? 5 : 0;
  const score = base + activity + approval + execution - rejectionPenalty - overduePenalty - inactivityPenalty;

  return Math.min(100, Math.max(0, Math.round(score)));
}
/**
 * Generates a clean, unique ID for initiatives.
 * Format: council-name-project-title-uniqueid
 */
export function generateInitiativeId(councilId, title) {
  // 1. Defend against undefined/null values
  // We use the nullish coalescing operator (??) to provide empty strings as fallbacks
  const safeCouncilId = councilId ?? '';
  const safeTitle = title ?? '';

  // 2. Clean the council ID
  const councilSlug = safeCouncilId
    .replace(/-council$/, '')
    .replace(/-/g, '-');
  
  // 3. Clean the project title
  const titleSlug = safeTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // Remove special characters
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .slice(0, 30);              // Keep it reasonably short

  // 4. Improved Uniqueness
  // Date.now().toString(36) is good, but adding a small random string 
  // prevents collisions if two IDs are generated in the exact same millisecond.
  const timeStamp = Date.now().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 5);

  // Fallback check: if title and council are both empty, return a random string
  if (!councilSlug && !titleSlug) {
    return `initiative-${timeStamp}-${randomPart}`;
  }

  return `${councilSlug || 'gen'}-${titleSlug || 'project'}-${timeStamp}${randomPart}`;
}
/**
 * Checks if another initiative in the same council is already 
 * scheduled for the given date.
 */
export async function hasExecutionDateConflict(councilId, date, excludeId = null) {
  // 1. If no date is provided, there is no conflict.
  if (!date || date.trim() === "") return false;

  try {
    const data = await getCouncilData(councilId);
    // Ensure initiatives is an array
    const initiatives = Array.isArray(data?.initiatives) ? data.initiatives : [];
    console.log("Checking conflict for date:", date, "against:", initiatives);
    return initiatives.some(i => {
      // 2. Skip deleted, cancelled, or successful initiatives
      if (!i || i.status === 'cancelled' || i.isSuccessful) return false;
      
      // 3. Skip the one we are currently editing
      if (excludeId && i.id === excludeId) return false;

      // 4. Strict Date Comparison
      // Ensure the stored date exists and matches the input date exactly
      return i.executionDate && String(i.executionDate) === String(date);
    });
  } catch (error) {
    console.error("Conflict check failed:", error);
    return false; 
  }
}
/**
 * Updates council-specific metadata (Padlets, Mission, Achievements).
 * Presidents use this to customize their council's presence.
 */
export async function saveCouncilInfo(councilId, info) {
  try {
    const success = await councilApi.saveCouncilData(councilId, { info });
    return { success };
  } catch (error) {
    console.error("Failed to save council info:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Adds a manager comment to a specific initiative.
 * This is used for feedback and oversight.
 */
export async function addManagerComment(councilId, initiativeId, commentText) {
  return await councilApi.addCommentAPI({ councilId, initiativeId, comment: commentText });
}
/**
 * Moves an initiative from pending to approved.
 * Adds approval metadata for the final report.
 */
// lib/dataStore.js



/**
 * Moves an initiative from pending to rejected.
 * Provides feedback to the President for revisions.
 */

/**
 * Permanently deletes an initiative and its metadata from the cloud.
 */
export async function deleteInitiative(councilId, initiativeId) {
  try {
    await councilApi.deleteInitiativeAPI({ councilId, initiativeId });
    return { success: true };
  } catch (error) {
    console.error("DELETION CRASH:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Retrieves specifically the council's metadata (mission, padlets, etc.)
 */
export async function getCouncilInfo(councilId) {
  try {
    const data = await getCouncilData(councilId);
    return data?.info || {};
  } catch (error) {
    console.error("Failed to fetch council info:", error);
    return {};
  }
}
/**
 * Marks an initiative as executed.
 * This triggers the success status and updates the council's impact score.
 */
export async function markInitiativeExecution(councilId, initiativeId, executedOnTime, successNote) {
  try {
    const data = await getCouncilData(councilId);
    const initiative = data.initiatives?.find(i => i.id === initiativeId);
    if (!initiative) return { success: false, error: "Initiative not found" };
    if (String(initiative.status || '').toLowerCase() !== 'approved') {
      return { success: false, error: "Only manager-approved initiatives can be marked completed" };
    }

    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const result = await councilApi.completeInitiativeAPI({
      councilId,
      initiativeId,
      executedOnTime,
      successNote: successNote || '',
      completedBy: session?.name || session?.username || 'President',
    });
    return { success: true, initiative: result.initiative };
  } catch (error) {
    console.error("Failed to mark execution:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Archives an initiative as successful.
 * This is the final state that contributes to the Council's legacy and score.
 */
export async function markInitiativeSuccessful(councilId, initiativeId, managerNote) {
  try {
    const data = await getCouncilData(councilId);
    const initiative = data.initiatives?.find(i => i.id === initiativeId);
    if (!initiative) return { success: false, error: "Initiative not found" };

    initiative.isSuccessful = true;
    initiative.successVisible = true;
    if (managerNote) initiative.successNote = managerNote;

    await councilApi.saveInitiativeAPI({ councilId, ...initiative });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark initiative as successful:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Toggles whether a successful initiative is visible on the public showcase.
 */
export async function toggleSuccessVisibility(councilId, initiativeId) {
  try {
    const data = await getCouncilData(councilId);
    const initiative = data.initiatives?.find(i => i.id === initiativeId);
    if (!initiative) return { success: false, error: "Initiative not found" };

    initiative.successVisible = !initiative.successVisible;

    await councilApi.saveInitiativeAPI({ councilId, ...initiative });
    return { success: true, newVisibility: initiative.successVisible };
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    return { success: false, error: error.message };
  }
}

export async function getMemberCredentials(councilId, token) {
  try {
    return await councilApi.getCredentialsAPI(councilId, token);
  } catch (error) {
    console.error("Load credentials error:", error);
    return {};
  }
}

export async function saveMemberCredentials(councilId, credentials, token) {
  try {
      await councilApi.saveCredentialsAPI(councilId, credentials, token);
      return true;
  } catch (error) {
      console.error("Save credentials error:", error);
      return false;
    }
  }

// Add this to your lib/dataStore.js
export async function wipeRemoteDatabase() {
  try {
    const response = await fetch(`${API_BASE}/system/wipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to wipe remote database');
    }

    return true;
  } catch (error) {
    console.error("Wipe API call failed:", error);
    throw error;
  }
  
}
// lib/dataStore.js

// lib/dataStore.js

export async function wipeInitiativeCompletely(councilId, initiativeId) {
  try {
    await councilApi.deleteInitiativeAPI({ councilId, initiativeId });
    return { success: true };
  } catch (error) {
    console.error("Wipe completely failed", error);
    return { success: false };
  }
}
export async function approveInitiative(councilId, initiativeId, reviewData) {
  try {
    await councilApi.approveInitiativeAPI({ councilId, initiativeId, reviewData });
    return { success: true };
  } catch (error) {
    console.error("Approval logic failed:", error);
    throw error;
  }
}
export async function revertToPending(councilId, initiativeId) {
  try {
    const data = await getCouncilData(councilId);
    const initiative = data.initiatives?.find(i => i.id === initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    initiative.status = 'pending';
    initiative.isSuccessful = false;
    initiative.successVisible = false;
    initiative.executedOnTime = null;
    initiative.successNote = '';
    await councilApi.saveInitiativeAPI({ councilId, ...initiative });
    
    return { success: true };
  } catch (error) {
    console.error("Revert failed:", error);
    return { success: false, error: error.message };
  }
}
export async function rejectInitiative(councilId, initiativeId, reason) {
  try {
    await councilApi.rejectInitiativeAPI({ councilId, initiativeId, reason });
    return { success: true };
  } catch (error) {
    console.error("Reject failed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteManagerComment(councilId, initiativeId, commentId) {
  try {
    await councilApi.deleteCommentAPI(commentId);
    return { success: true };
  } catch (error) {
    console.error("Delete comment failed:", error);
    return { success: false, error: error.message };
  }
}

export async function saveStrategicAnalysis(councilId, analysis) {
  try {
    const response = await fetch(`${API_BASE}/council/analysis/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ councilId, ...analysis })
    });
    return response.ok;
  } catch (err) {
    console.error("Save analysis failed:", err);
    return false;
  }
}

export async function saveTimelineEvents(councilId, events) {
  try {
    const response = await fetch(`${API_BASE}/council/timeline/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ councilId, events })
    });
    return response.ok;
  } catch (err) {
    console.error("Save timeline failed:", err);
    return false;
  }
}
