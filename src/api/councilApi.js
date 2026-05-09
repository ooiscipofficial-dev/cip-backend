export const API_BASE = "https://councilhub-backend.oois-cip-official.workers.dev/api";

export const councilApi = {
  async getCouncilData(councilId) {
      try {
        const res = await fetch(`${API_BASE}/council/data?id=${councilId}`);
        if (!res.ok) throw new Error("Network response was not ok");
        
        const raw = await res.json();
        let processed = raw;

        // --- THE FIX: Robust Unwrapping ---
        if (processed && processed.data) {
          if (typeof processed.data === 'string' && processed.data !== "[object Object]") {
            try {
              processed = JSON.parse(processed.data);
            } catch (e) {
              console.error("JSON parse error on internal data:", e);
            }
          } else if (typeof processed.data === 'object') {
            processed = processed.data;
          }
        }

        // Return a clean object with padlets included
        return {
          id: councilId,
          // Include the padlets here!
          padlets: processed.padlets || {}, 
          initiatives: processed.initiatives || [],
          pendingList: processed.pendingList || [],
          approvedList: processed.approvedList || [],
          rejectedList: processed.rejectedList || [],
          successfulInitiatives: processed.successfulInitiatives || [],
          info: processed.info || {},
          calendarEvents: processed.calendarEvents || [],
          // Spread any other dynamic data that might be in 'processed'
          ...processed 
        };
      } catch (error) {
        console.error("Fetch Error:", error);
        return {
            id: councilId,
            members: processed.members || [], // Force it to exist
            padlets: processed.padlets || {},
            initiatives: processed.initiatives || [],
            ...processed
          };
      }
    },
    async getMembers(councilId) {
          try {
            const data = await this.getCouncilData(councilId);
            
            // 1. Check if the 'credentials' field exists
            if (data.credentials && typeof data.credentials === 'object') {
              console.log(`[Member Debug] Converting credentials object for ${councilId}`);
              
              // 2. Convert the object values into an array
              // This turns { member_123: {name: 'Dhruv'}, ... } into [{name: 'Dhruv'}, ...]
              const membersArray = Object.entries(data.credentials)
                .filter(([key]) => key.startsWith('member_')) // Only get the members, skip 'username'/'password' root keys
                .map(([id, details]) => ({
                  id: id,
                  ...details
                }));

              // 3. Add the "Dhruv" root admin if he's not in the list
              if (data.credentials.username && data.credentials.username.name) {
                membersArray.unshift({
                  id: 'admin',
                  ...data.credentials.username,
                  role: 'Council Lead' // Or whatever his role is
                });
              }

              return membersArray;
            }

            return [];
          } catch (error) {
            console.error("Member Hunt Error:", error);
            return [];
          }
        },
  async saveCouncilData(councilId, fullData) {
    // We spread fullData so we don't create nested { data: { data: ... } }
    const res = await fetch(`${API_BASE}/council/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: councilId, ...fullData })
    });
    return res.ok;
  },

  async wipeRemoteDatabase() {
    const res = await fetch(`${API_BASE}/system/wipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error("Failed to wipe database");
    return await res.json();
  },

  // Auth and Members
  async loginMember(username, password, councilId) {
    const res = await fetch(`${API_BASE}/login/member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, councilId })
    });
    return await res.json();
  },

  async loginManager(credentials) {
    const res = await fetch(`${API_BASE}/login/manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials) 
    });
    return await res.json();
  }
};