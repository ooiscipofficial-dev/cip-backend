import { useEffect, useState } from 'react';
import { ExternalLink, FolderOpen, Loader2, Save } from 'lucide-react';
import { getDriveLink, saveDriveLink } from '../../lib/dataStore';
import { toEmbeddedDriveFolderUrl } from '../../lib/googleDrive';

export default function DriveSection({ councilId, councilName, session, isPresident }) {
  const [url, setUrl] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getDriveLink('council', councilId).then(link => {
      if (active) { setUrl(link); setDraft(link); }
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [councilId]);

  async function save() {
    setSaving(true);
    try {
      const saved = await saveDriveLink({ scope: 'council', councilId, url: draft, token: session?.token });
      setUrl(saved);
      setDraft(saved);
    } catch (error) {
      alert(error.message || 'Please paste a valid Google Drive folder link.');
    } finally { setSaving(false); }
  }

  const embedUrl = toEmbeddedDriveFolderUrl(url);
  return <div className="space-y-4">
    <div className="flex items-center gap-2"><FolderOpen size={16} /><h3 className="text-sm font-semibold">{councilName} Drive</h3></div>
    {isPresident && <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
      <div><p className="text-sm font-medium">Set up the council folder</p><p className="mt-1 text-xs text-muted-foreground">Create a folder using the council-provided Google account — never a personal Gmail. In Google Drive, set General access to “Anyone with the link” and choose Editor for collaboration (or Viewer when changes should be blocked).</p></div>
      <label className="block text-xs font-medium">Google Drive folder link</label>
      <input type="url" value={draft} onChange={event => setDraft(event.target.value)} placeholder="https://drive.google.com/drive/folders/..." className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background" />
      <button onClick={save} disabled={saving || !draft.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-foreground text-background disabled:opacity-50">{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{saving ? 'Saving…' : 'Save council Drive'}</button>
    </div>}
    {loading ? <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div> : embedUrl ? <div className="border border-border rounded-2xl overflow-hidden bg-card"><div className="p-4 border-b border-border"><p className="text-sm font-medium">Council Drive</p><p className="text-xs text-muted-foreground">Preview of files in the shared council folder.</p></div><iframe src={embedUrl} title={`${councilName} Drive`} className="w-full h-[620px] bg-white" frameBorder="0" /><div className="p-4 border-t border-border bg-muted/20"><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-foreground text-background"><ExternalLink size={13} /> Open folder in Google Drive to upload files ↗</a><p className="mt-2 text-[11px] text-muted-foreground">Upload and manage files in Google Drive’s normal interface.</p></div></div> : <div className="border border-dashed border-border rounded-2xl p-12 text-center"><FolderOpen size={30} className="mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm font-medium">Council Drive not set up yet</p><p className="mt-1 text-xs text-muted-foreground">Only the council president can add the shared Google Drive folder.</p></div>}
  </div>;
}
