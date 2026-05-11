import { useState, useEffect } from 'react';
import { getSystemSettings, saveSystemSettings } from '../../lib/dataStore';
import { X, Globe, Save, Loader2 } from 'lucide-react';

export default function CommonsManager({ onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const settings = await getSystemSettings();
      setUrl(settings.commonsPadlet || '');
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const success = await saveSystemSettings({ commonsPadlet: url });
      if (success) {
        onClose();
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Commons Configuration</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure the global Commons Padlet URL. This board will be visible to all student councils under their "Commons" tab.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Padlet URL</label>
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://padlet.com/..."
              disabled={loading || saving}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex gap-2">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
