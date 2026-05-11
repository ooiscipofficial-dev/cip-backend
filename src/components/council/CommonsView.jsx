import { useState, useEffect } from 'react';
import { getSystemSettings } from '../../lib/dataStore';
import { Globe } from 'lucide-react';

export default function CommonsView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSystemSettings();
        setUrl(settings.commonsPadlet || '');
      } catch (err) {
        console.error("Failed to load commons:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold">Commons Padlet</h2>
      </div>

      <p className="text-xs text-muted-foreground">
        The shared point for all student councils. Access common resources, global initiatives, and school-wide announcements.
      </p>

      <div className="border border-border rounded-2xl overflow-hidden bg-card" style={{ height: 608 }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
        ) : !url ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8 bg-muted/30">
             <Globe size={32} className="text-muted-foreground/30" />
             <p className="text-sm font-medium text-foreground">Commons Board Not Linked</p>
             <p className="text-xs text-muted-foreground max-w-xs">
               The global commons board has not been configured by a manager yet.
             </p>
          </div>
        ) : (
          <div className="padlet-embed" style={{ width: '100%', height: '100%' }}>
            <iframe 
              src={url} 
              frameBorder="0" 
              allow="camera;microphone;geolocation;display-capture;clipboard-write" 
              style={{ width: '100%', height: '100%', padding: 0, margin: 0 }}
              title="Commons Padlet"
            />
          </div>
        )}
      </div>
    </div>
  );
}
