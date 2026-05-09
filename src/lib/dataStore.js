import { councilApi, API_BASE } from '../api/councilApi';

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

export async function syncCouncilToCloud(councilId, data) {
  try {
    // We send a flat object to the worker
    const response = await fetch(`${API_BASE}/council/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: councilId,
        ...data // This ensures data is stored flat
      })
    });
    
    if (!response.ok) throw new Error("Cloud sync failed");
    return await response.json(); 
  } catch (error) {
    console.error("Sync failed:", error);
    return { success: false };
  }
}

export async function saveInitiative(councilId, initiative) {
  const data = await getCouncilData(councilId);
  if (!data) return;

  const idx = data.initiatives.findIndex(i => i.id === initiative.id);
  if (idx > -1) {
    data.initiatives[idx] = initiative;
  } else {
    data.initiatives.push(initiative);
    data.pendingList.push({
      id: initiative.id,
      title: initiative.title,
      owner: initiative.lead?.name || 'Unknown',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });
  }
  return await syncCouncilToCloud(councilId, data);
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
export async function getAllCouncilsData() {
  try {
    const response = await fetch(`${API_BASE}/councils/all`);
    if (!response.ok) throw new Error("Failed to fetch all council data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching global council data:", error);
    return {}; // Return empty object so dashboard doesn't crash
  }
}
/**
 * A strict, performance-based Impact Score calculator.
 * Rewards successful execution, penalizes rejections and overdue tasks.
 */
export function calculateImpactScore(baseScore, councilData) {
  let score = baseScore || 0; // Start at 50 if no base provided

  const initiatives = councilData.initiatives || [];
  const approved = councilData.approvedList || [];
  const successful = councilData.successfulInitiatives || [];
  const rejected = councilData.rejectedList || [];

  // 1. RAW ACTIVITY (Weight: 20%)
  // Encourages proposing ideas. Max +10 points.
  score += Math.min(initiatives.length * 0.5, 10);

  // 2. APPROVAL QUALITY (Weight: 20%)
  // High quality proposals that get approved. Max +10 points.
  score += Math.min(approved.length * 1.0, 10);

  // 3. SUCCESSFUL EXECUTION (The "Strict" Multiplier - Weight: 40%)
  // Actually finishing what you started. Max +30 points.
  score += Math.min(successful.length * 3.0, 30);

  // 4. THE "STRICT" PENALTIES (Negative Impact)
  // Penalize rejected proposals (poor planning).
  score -= Math.min(rejected.length * 1.5, 15);

  // 5. DEADLINE DISCIPLINE
  // Penalize overdue initiatives (executionDate passed, but not marked success).
  const today = new Date().toISOString().split('T')[0];
  const overdue = initiatives.filter(i => 
    i.executionDate && 
    i.executionDate < today && 
    !i.isSuccessful
  );

  // Deduct 2 points for every overdue initiative
  score -= (overdue.length * 2);

  // 6. INACTIVITY PENALTY
  // If a council has 0 initiatives, they slowly drift towards 0.
  if (initiatives.length === 0) score -= 5;

  // Final Clamping: Score must be between 0 and 100
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
    // 1. Fetch current full state to ensure we don't overwrite initiatives
    const currentState = await getCouncilData(councilId);
    
    // 2. Merge the new info into the existing state
    const updatedData = {
      ...currentState,
      info: { ...currentState.info, ...info }
    };

    // 3. Sync the whole object back to the Worker
    await syncCouncilToCloud(councilId, updatedData);
    
    return { success: true };
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
  const data = await getCouncilData(councilId);
  const idx = data.initiatives.findIndex(i => i.id === initiativeId);
  
  if (idx > -1) {
    if (!data.initiatives[idx].managerComments) {
      data.initiatives[idx].managerComments = [];
    }

    // Create the object
    const newComment = {
      text: commentText,
      author: "Council Manager",
      date: new Date().toISOString()
    };

    data.initiatives[idx].managerComments.push(newComment);
    await syncCouncilToCloud(councilId, data);
  }
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
export async function deleteManagerComment(councilId, initiativeId, commentIndex) {
  try {
    const data = await getCouncilData(councilId);
    const initiativeIdx = data.initiatives.findIndex(i => i.id === initiativeId);

    if (initiativeIdx > -1) {
      const initiative = data.initiatives[initiativeIdx];
      
      // Remove the comment at the specific index
      if (initiative.managerComments) {
        initiative.managerComments.splice(commentIndex, 1);
        
        await syncCouncilToCloud(councilId, data);
        return { success: true };
      }
    }
    return { success: false, error: "Comment not found" };
  } catch (error) {
    console.error("Delete comment failed:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Permanently deletes an initiative and its metadata from the cloud.
 */
export async function deleteInitiative(councilId, initiativeId) {
  console.group("🚀 DELETION TRACE: " + initiativeId);
  
  try {
    const rawResult = await getCouncilData(councilId);
    if (!rawResult) throw new Error("No council data found");

    // --- STEP 1: THE UNWRAP ---
    // We need to find where the actual initiatives live.
    // Based on your trace, they are likely inside a nested 'data' string.
    let parsedData = rawResult;
    
    // If 'data' is a string, we must parse it (possibly multiple times)
    while (typeof parsedData.data === 'string') {
      try {
        parsedData = JSON.parse(parsedData.data);
      } catch (e) {
        break; // Stop if it's no longer valid JSON
      }
    }

    // Now check if initiatives exist in this unwrapped version
    console.log("Unwrapped Data:", parsedData);

    // --- STEP 2: THE FILTER ---
    const filterFn = (item) => String(item.id || item.initiativeId) !== String(initiativeId);

    const updatedData = {
      ...parsedData,
      initiatives: (parsedData.initiatives || []).filter(filterFn),
      pendingList: (parsedData.pendingList || []).filter(filterFn),
      approvedList: (parsedData.approvedList || []).filter(filterFn),
      calendarEvents: (parsedData.calendarEvents || []).filter(filterFn)
    };

    // --- STEP 3: THE SYNC (CLEANED) ---
    // We send the CLEAN object, not the nested string mess
    const response = await syncCouncilToCloud(councilId, updatedData);
    
    console.log("Clean Sync Response:", response);
    console.groupEnd();
    return { success: true };

  } catch (error) {
    console.error("💥 DELETION CRASH:", error);
    console.groupEnd();
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
    // 1. Fetch latest data
    const data = await getCouncilData(councilId);
    const initiatives = data.initiatives || [];

    // 2. Find and update the specific initiative
    const idx = initiatives.findIndex(i => i.id === initiativeId);
    if (idx === -1) return { success: false, error: "Initiative not found" };

    initiatives[idx].executedOnTime = executedOnTime;
    initiatives[idx].successNote = successNote || '';
    
    // If it was executed on time, it's officially a success
    if (executedOnTime) {
      initiatives[idx].isSuccessful = true;
    }

    // 3. Update the successfulInitiatives archive for the report
    data.successfulInitiatives = data.successfulInitiatives || [];
    const record = { 
      ...initiatives[idx], 
      archivedAt: new Date().toISOString() 
    };
    
    const existingIdx = data.successfulInitiatives.findIndex(s => s.id === initiativeId);
    if (existingIdx > -1) {
      data.successfulInitiatives[existingIdx] = record;
    } else {
      data.successfulInitiatives.push(record);
    }

    // 4. Sync back to D1
    await syncCouncilToCloud(councilId, data);
    
    return { success: true };
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
    const initiatives = data.initiatives || [];

    const idx = initiatives.findIndex(i => i.id === initiativeId);
    if (idx === -1) return { success: false, error: "Initiative not found" };

    // Update the initiative's internal status
    initiatives[idx].isSuccessful = true;
    initiatives[idx].successNote = managerNote || initiatives[idx].successNote || '';

    // Add to the dedicated successful initiatives archive
    data.successfulInitiatives = data.successfulInitiatives || [];
    const record = { 
      ...initiatives[idx], 
      archivedAt: new Date().toISOString(), 
      isSuccessVisible: true 
    };

    const existingIdx = data.successfulInitiatives.findIndex(s => s.id === initiativeId);
    if (existingIdx > -1) {
      data.successfulInitiatives[existingIdx] = record;
    } else {
      data.successfulInitiatives.push(record);
    }

    // Sync to Cloud
    await syncCouncilToCloud(councilId, data);
    
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
    const successful = data.successfulInitiatives || [];

    const idx = successful.findIndex(s => s.id === initiativeId);
    if (idx === -1) return { success: false, error: "Archived initiative not found" };

    // Flip the visibility boolean
    successful[idx].isSuccessVisible = !successful[idx].isSuccessVisible;

    // Sync back to Cloud
    await syncCouncilToCloud(councilId, data);
    
    return { success: true, newVisibility: successful[idx].isSuccessVisible };
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    return { success: false, error: error.message };
  }
}

  export async function saveMemberCredentials(councilId, credentials) {
    // 1. Change endpoint to the working /council/save
    const response = await fetch(`${API_BASE}/council/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 2. Change 'councilId' to 'id' so the Worker's SQL find the row
      body: JSON.stringify({ 
        id: councilId,
        padlets: processed.padlets || councilId.padlets || {}, 
        credentials 
      })
    });
    
    if (!response.ok) {
      console.error("Save failed with status:", response.status);
    }
    
    return response.ok;
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
  const response = await getCouncilData(councilId);
  let data = response?.data && typeof response.data === 'string' ? JSON.parse(response.data) : response;

  const targetId = String(initiativeId);

  // 1. FILTER EVERYTHING
  // This creates new arrays that are guaranteed NOT to have that ID
  data.initiatives = (data.initiatives || []).filter(i => String(i.id) !== targetId);
  data.pendingList = (data.pendingList || []).filter(i => String(i.id) !== targetId);
  data.approvedList = (data.approvedList || []).filter(i => String(i.id) !== targetId);
  data.rejectedList = (data.rejectedList || []).filter(i => String(i.id) !== targetId);

  console.log(`Wiped ${targetId} from all lists. Saving...`);

  // 2. SAVE the empty/cleaned state
  return await councilApi.saveCouncilData(councilId, data);

}
export async function approveInitiative(councilId, initiativeId, reviewData) {
  try {
    const data = await getCouncilData(councilId);
    if (!data) throw new Error("No council data found");

    const initiative = data.initiatives?.find(i => i.id === initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    // 1. Move to Approved List
    data.approvedList = data.approvedList || [];
    data.approvedList.push({
      id: initiativeId,
      title: initiative.title,
      approvedAt: new Date().toISOString(),
      ...reviewData
    });

    // 2. Remove from Pending List
    data.pendingList = (data.pendingList || []).filter(p => p.id !== initiativeId);

    // 3. Update the initiative status itself
    const idx = data.initiatives.findIndex(i => i.id === initiativeId);
    data.initiatives[idx].status = 'approved';

    // 4. Sync back to Cloud
    await syncCouncilToCloud(councilId, data);
    return { success: true };
  } catch (error) {
    console.error("Approval logic failed:", error);
    throw error;
  }
}
export async function revertToPending(councilId, initiativeId) {
  try {
    const data = await getCouncilData(councilId);
    if (!data) throw new Error("No council data found");

    // 1. Update the main initiative status
    const idx = data.initiatives.findIndex(i => i.id === initiativeId);
    if (idx === -1) throw new Error("Initiative not found");
    
    const initiative = data.initiatives[idx];
    initiative.status = 'pending';

    // 2. Remove from Approved/Rejected lists
    data.approvedList = (data.approvedList || []).filter(item => item.id !== initiativeId);
    data.rejectedList = (data.rejectedList || []).filter(item => item.id !== initiativeId);

    // 3. Ensure it's back in the Pending list
    const isAlreadyInPending = data.pendingList?.some(p => p.id === initiativeId);
    if (!isAlreadyInPending) {
      data.pendingList = data.pendingList || [];
      data.pendingList.push({
        id: initiative.id,
        title: initiative.title,
        owner: initiative.lead?.name || 'Unknown',
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
    }

    await syncCouncilToCloud(councilId, data);
    return { success: true };
  } catch (error) {
    console.error("Revert failed:", error);
    return { success: false, error: error.message };
  }
}
export async function rejectInitiative(councilId, initiativeId) {
  const data = await getCouncilData(councilId);
  const idx = data.initiatives.findIndex(i => i.id === initiativeId);

  if (idx > -1) {
    // Update status
    data.initiatives[idx].status = 'rejected';

    // Move from pending to rejected list
    const initiative = data.initiatives[idx];
    data.rejectedList = data.rejectedList || [];
    data.rejectedList.push({
      id: initiativeId,
      title: initiative.title,
      rejectedAt: new Date().toISOString()
    });

    data.pendingList = (data.pendingList || []).filter(p => p.id !== initiativeId);

    await syncCouncilToCloud(councilId, data);
    return { success: true };
  }
}