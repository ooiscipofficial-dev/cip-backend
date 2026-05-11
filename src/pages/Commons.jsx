import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { getSystemSettings } from '../lib/dataStore';
import { Globe } from 'lucide-react';

export default function Commons({ session }) {
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
    <div className="min-h-screen bg-background">
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe size={16} />
          <h1 className="text-lg font-semibold">Commons</h1>
          <span className="text-xs text-muted-foreground">· Cross-council collaboration</span>
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card" style={{ height: '75vh' }}>
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
    </div>
  );
}
