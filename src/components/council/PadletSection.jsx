import { useState, useEffect } from 'react';

const PADLET_TABS = [
  { key: 'internal1', label: 'Internal Comms', desc: 'Council communication and coordination' },
  { key: 'internal2', label: 'Internal Board 2', desc: 'Planning and task management' },
  { key: 'achievements', label: 'Achievements Board', desc: 'Showcase council achievements' },
];

export default function PadletSection({ council, isManager }) {
  const [active, setActive] = useState('internal1');
  const [padlets, setPadlets] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  console.log("PadletSection Loaded. Is Manager:", isManager);
  const currentTab = PADLET_TABS.find(t => t.key === active);

  useEffect(() => {
    async function fetchPadlets() {
      try {
        setLoading(true);
        const res = await fetch(`/api/councils/${council.id}/padlets`);
        if (!res.ok) throw new Error('Failed to load padlets');
        const data = await res.json();
        setPadlets(data.padlets || {});
      } catch (err) {
        console.error('Padlet fetch error:', err);
        setPadlets({});
      } finally {
        setLoading(false);
      }
    }
    if (council?.id) fetchPadlets();
  }, [council?.id]);

  const padletUrl = padlets?.[active];

  // ─── SAVE HANDLER ──────────────────────────────────────────
  const handleSave = async () => {
    if (!newUrl.trim()) return;

    try {
      const updatedPadlets = { ...padlets, [active]: newUrl.trim() };
      
      // 1. OPTIMISTIC UPDATE: Update local state immediately
      setPadlets(updatedPadlets);
      
      const res = await fetch(`/api/councils/${council.id}/padlets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ padlets: updatedPadlets })
      });

      if (res.ok) {
        setEditing(false);
        // 2. Add a tiny delay or force a refresh to ensure the iframe picks up the change
        console.log("Padlet URL saved successfully:", newUrl);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  return (
    <div>
      {/* Header with Edit Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1">
          {PADLET_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActive(tab.key); setEditing(false); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${active === tab.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isManager && (
          <button 
            onClick={() => { setEditing(!editing); setNewUrl(padletUrl || ''); }}
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground"
          >
            {editing ? 'Cancel' : 'Edit URL'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mb-4 flex gap-2">
          <input 
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs"
            placeholder="Paste Padlet URL here (e.g., https://padlet.com/embed/...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button 
            onClick={handleSave}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold"
          >
            Save
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">{currentTab?.desc}</p>
      )}

      {/* Content Area - Styled as requested */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card" style={{ height: 608 }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
        ) : !padletUrl ? (
          <PadletPlaceholder label={currentTab?.label} councilName={council.name} />
        ) : (
          <div className="padlet-embed" style={{ width: '100%', height: '100%' }}>
            <p style={{ padding: 0, margin: 0, height: '100%' }}>
              <iframe 
                src={padletUrl} 
                frameBorder="0" 
                allow="camera;microphone;geolocation;display-capture;clipboard-write" 
                style={{ width: '100%', height: '100%', padding: 0, margin: 0 }}
                title={currentTab?.label}
              />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PadletPlaceholder({ label, councilName }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8 bg-muted/30">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        No Padlet linked yet for <strong>{councilName}</strong>.
      </p>
    </div>
  );
}