import { useState, useEffect } from 'react';
import { MessageSquare, User, Trophy, Settings } from 'lucide-react';
import { API_BASE } from '../../api/councilApi';

const TABS = [
  { id: 'internal', label: 'Internal Comms', icon: <MessageSquare size={12} />, desc: 'Council communication drafts — visible to all council members.' },
  { id: 'personal', label: 'Personal Space', icon: <User size={12} />, desc: 'Personal jot-down board — specific to your role group within the council.' },
  { id: 'showcase', label: 'Showcase', icon: <Trophy size={12} />, desc: 'Council initiative showcase with gallery and achievements.' },
];

export default function PadletTabs({ council, canManagePadlets, onPadletsUpdated }) {
  const [activeTab, setActiveTab] = useState('internal');
  const [editingUrls, setEditingUrls] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- DEBUGGING LOGS ---
  console.log("[Padlet Debug] Current Council Prop:", council);

  const getPadletData = (dataObject) => {
      if (!dataObject) return {};
      
      // 1. Log specifically what is inside 'padlets' to see the keys
      console.log("[Padlet Debug] Inspecting dataObject.padlets:", dataObject.padlets);

      // 2. Try the direct root first (Most likely based on your logs)
      if (dataObject.padlets) {
        // If it's a string (sometimes D1 returns it like this), parse it
        if (typeof dataObject.padlets === 'string') {
          try {
            const parsed = JSON.parse(dataObject.padlets);
            return parsed;
          } catch(e) { return {}; }
        }
        return dataObject.padlets;
      }

      // 3. Try the 'data' property (Fallback for D1 stringified rows)
      if (dataObject.data) {
        const d = typeof dataObject.data === 'string' ? JSON.parse(dataObject.data) : dataObject.data;
        if (d.padlets) return d.padlets;
      }

      return {};
    };
  const [urls, setUrls] = useState(getPadletData(council));

  useEffect(() => {
    const freshUrls = getPadletData(council);
    console.log("[Padlet Debug] Effect Syncing URL State:", freshUrls);
    setUrls(freshUrls);
  }, [council]);

  const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];
  const currentUrl = urls[activeTab];
  
  console.log(`[Padlet Debug] Active Tab: ${activeTab} | URL: ${currentUrl || 'EMPTY'}`);

  async function saveUrls() {
    setIsSaving(true);
    console.log("[Padlet Debug] Attempting Save with Payload:", { id: council.id, padlets: urls });
    
    try {
      const res = await fetch(`${API_BASE}/council/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: council.id,
          padlets: urls 
        })
      });

      const result = await res.json();
      console.log("[Padlet Debug] Server Response:", result);

      if (res.ok) {
        setEditingUrls(false);
        if (onPadletsUpdated) {
          console.log("[Padlet Debug] Triggering parent refresh...");
          await onPadletsUpdated();
        }
        alert("Saved to Database!");
      } else {
        alert("Error: " + result.msg);
      }
    } catch (error) {
      console.error("[Padlet Debug] Network Error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setActiveTab(tab.id); setEditingUrls(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
              ${activeTab === tab.id ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        
        {canManagePadlets && (
          <button 
            onClick={() => setEditingUrls(!editingUrls)}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5"
          >
            <Settings size={11} /> Manage
          </button>
        )}
      </div>

      {editingUrls && (
        <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">URL Editor</p>
          <div className="grid gap-3">
            {TABS.map(tab => (
              <div key={tab.id}>
                <label className="text-[11px] font-semibold">{tab.label}</label>
                <input
                  type="url"
                  value={urls[tab.id] || ''}
                  onChange={e => setUrls(u => ({ ...u, [tab.id]: e.target.value }))}
                  placeholder="https://padlet.com/..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                />
              </div>
            ))}
          </div>
          <button 
            disabled={isSaving}
            onClick={saveUrls}
            className="w-full bg-foreground text-background text-xs font-bold py-2 rounded-lg"
          >
            {isSaving ? 'Communicating with D1...' : 'Confirm & Save'}
          </button>
        </div>
      )}

      <div className="border border-border rounded-2xl overflow-hidden bg-muted/10" style={{ height: 608 }}>
        {currentUrl ? (
          <iframe
            key={currentUrl}
            src={currentUrl.includes('embed') ? currentUrl : currentUrl.replace('padlet.com/', 'padlet.com/embed/')}
            className="w-full h-full bg-white"
            title={currentTab.label}
            allow="camera;microphone;geolocation;display-capture;clipboard-write"
            frameBorder="0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-sm font-bold">{currentTab.label} Empty</h3>
            <p className="text-xs text-muted-foreground mt-2">{currentTab.desc}</p>
            {canManagePadlets && (
              <button onClick={() => setEditingUrls(true)} className="mt-6 px-4 py-2 bg-foreground text-background rounded-full text-[11px]">
                Add Padlet Link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}