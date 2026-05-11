// export const API_BASE = "http://127.0.0.1:8787/api"; // For local dev
export const API_BASE = "https://councilhub-backend.oois-cip-official.workers.dev/api"; // For production

export const councilApi = {
  async getCouncilData(councilId) {
    try {
      const res = await fetch(`${API_BASE}/council/data?id=${councilId}`);
      if (!res.ok) throw new Error("Network response was not ok");
      
      const processed = await res.json();

      // Return a clean object natively returned by the D1 backend
      return {
        id: councilId,
        padlets: processed.padlets || {}, 
        initiatives: processed.initiatives || [],
        pendingList: processed.pendingList || [],
        approvedList: processed.approvedList || [],
        rejectedList: processed.rejectedList || [],
        successfulInitiatives: processed.successfulInitiatives || [],
        info: processed.info || {},
        calendarEvents: processed.calendarEvents || [],
        credentials: processed.credentials || {},
        ...processed 
      };
    } catch (error) {
      console.error("Fetch Error:", error);
      return {
        id: councilId,
        members: [],
        padlets: {},
        initiatives: [],
        pendingList: [],
        approvedList: [],
        rejectedList: [],
        info: {}
      };
    }
  },

  async getMembers(councilId) {
    try {
      const data = await this.getCouncilData(councilId);
      
      if (data.credentials && typeof data.credentials === 'object') {
        const membersArray = Object.entries(data.credentials)
          .filter(([key]) => key.startsWith('member_'))
          .map(([id, details]) => ({
            id: id,
            ...details
          }));

        if (data.credentials.username && data.credentials.username.name) {
          membersArray.unshift({
            id: 'admin',
            ...data.credentials.username,
            role: data.credentials.username.role || 'Council Lead'
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
    // This now only saves basic council info per the new backend design
    const res = await fetch(`${API_BASE}/council/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: councilId, ...fullData })
    });
    return res.ok;
  },

  // --- NEW TARGETED D1 API ENDPOINTS ---

  async saveInitiativeAPI(data) {
    const res = await fetch(`${API_BASE}/initiatives/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async approveInitiativeAPI(data) {
    const res = await fetch(`${API_BASE}/initiatives/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async rejectInitiativeAPI(data) {
    const res = await fetch(`${API_BASE}/initiatives/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async deleteInitiativeAPI(data) {
    const res = await fetch(`${API_BASE}/initiatives/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async addCommentAPI(data) {
    const res = await fetch(`${API_BASE}/initiatives/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async deleteCommentAPI(commentId) {
    const res = await fetch(`${API_BASE}/initiatives/comment/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId })
    });
    return res.ok;
  },

  async saveCredentialsAPI(councilId, credentials) {
    const res = await fetch(`${API_BASE}/credentials/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ councilId, credentials })
    });
    return res.ok;
  },

  async getSystemSettings() {
    const res = await fetch(`${API_BASE}/system/settings`);
    if (!res.ok) return { commonsPadlet: "" };
    const data = await res.json();
    return data.settings || { commonsPadlet: "" };
  },

  async saveSystemSettings(settings) {
    const res = await fetch(`${API_BASE}/system/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.ok;
  },

  // ------------------------------------

  async wipeRemoteDatabase() {
    const res = await fetch(`${API_BASE}/system/wipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error("Failed to wipe database");
    return await res.json();
  },

  // Auth
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