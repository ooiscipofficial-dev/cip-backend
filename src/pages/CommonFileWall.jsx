import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { Globe, ExternalLink, FolderOpen, Loader2, Save } from 'lucide-react';
import { getDriveLink, saveDriveLink } from '../lib/dataStore';
import { isManager } from '../lib/authStore';
import { toEmbeddedDriveFolderUrl } from '../lib/googleDrive';

export default function CommonFileWall({ session }) {
  const [driveUrl, setDriveUrl] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const manager = isManager(session);

  useEffect(() => {
    getDriveLink('global').then(url => { setDriveUrl(url); setDraft(url); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const saved = await saveDriveLink({ scope: 'global', url: draft, token: session?.token });
      setDriveUrl(saved);
      setDraft(saved);
    } catch (error) { alert(error.message || 'Please paste a valid Google Drive folder link.'); }
    finally { setSaving(false); }
  }

  const embedUrl = toEmbeddedDriveFolderUrl(driveUrl);
  return <div className="min-h-screen bg-background">
    <Navbar session={session} />
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-6"><Globe size={16} /><h1 className="text-lg font-semibold">Common File Wall</h1><span className="text-xs text-muted-foreground">Shared across all councils</span></div>
      <div className="mb-5 border border-border rounded-xl p-3 bg-muted/20 text-xs text-muted-foreground"><p className="font-medium text-foreground mb-1">Shared school folder</p><p>This folder is for every council. It must be created with the school/council Google account, never a personal Gmail account.</p></div>
      {manager && <div className="mb-5 border border-border rounded-xl p-4 bg-muted/20 space-y-3"><div><p className="text-sm font-medium">Configure the Common File Wall</p><p className="mt-1 text-xs text-muted-foreground">Create a Drive folder with the school account. Set General access to “Anyone with the link” and choose Editor for collaboration or Viewer for read-only access.</p></div><input type="url" value={draft} onChange={event => setDraft(event.target.value)} placeholder="https://drive.google.com/drive/folders/..." className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background" /><button onClick={save} disabled={saving || !draft.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-foreground text-background disabled:opacity-50">{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{saving ? 'Saving…' : 'Save common Drive'}</button></div>}
      {loading ? <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div> : embedUrl ? <div className="border border-border rounded-2xl overflow-hidden bg-card"><div className="p-4 border-b border-border"><p className="text-sm font-medium">Shared Google Drive folder</p><p className="text-xs text-muted-foreground">Preview of files available to every council.</p></div><iframe src={embedUrl} title="Common File Wall" className="w-full h-[650px] bg-white" frameBorder="0" /><div className="p-4 border-t border-border bg-muted/20"><a href={driveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-foreground text-background"><ExternalLink size={13} /> Open folder in Google Drive to upload files ↗</a><p className="mt-2 text-[11px] text-muted-foreground">Upload and manage files in Google Drive’s normal interface.</p></div></div> : <div className="border border-dashed border-border rounded-2xl p-16 text-center"><FolderOpen size={32} className="mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm font-medium">Common File Wall not set up yet</p><p className="mt-1 text-xs text-muted-foreground">A manager can add the shared school Drive folder.</p></div>}
    </main>
  </div>;
}
