import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { COUNCILS_DATA } from '../lib/mockData';
import { Globe, File, ExternalLink, Search, Filter } from 'lucide-react';
import {getCommonFiles} from '../../src/lib/driveStore';
export default function CommonFileWall({ session }) {
  const [search,        setSearch]        = useState('');
  const [filterCouncil, setFilterCouncil] = useState('all');
  const [files,         setFiles]         = useState(() => getCommonFiles());

  const filtered = files.filter(f => {
    const matchSearch  = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.councilName?.toLowerCase().includes(search.toLowerCase());
    const matchCouncil = filterCouncil === 'all' || f.councilId === filterCouncil;
    return matchSearch && matchCouncil;
  });

  const councilMap = {};
  COUNCILS_DATA.forEach(c => { councilMap[c.id] = c; });

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <h1 className="text-lg font-semibold">Common File Wall</h1>
            <span className="text-xs text-muted-foreground">· Shared across all councils</span>
          </div>
          <button onClick={() => setFiles(getCommonFiles())} className="text-xs text-muted-foreground hover:text-foreground">Refresh</button>
        </div>

        <div className="mb-5 border border-border rounded-xl p-3 bg-muted/20 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How files appear here</p>
          <p>Go to your council page → <strong>Drive</strong> tab → upload a file → click the <strong>Share</strong> icon. The file will appear here, visible to all councils.</p>
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-muted-foreground" />
            <select value={filterCouncil} onChange={e => setFilterCouncil(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-2 bg-background focus:outline-none">
              <option value="all">All Councils</option>
              {COUNCILS_DATA.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-16 text-center">
            <Globe size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No shared files yet</p>
            <p className="text-xs text-muted-foreground">Council members can share files from their Drive tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(file => {
              const council = councilMap[file.councilId];
              return (
                <div key={file.id} className="border border-border rounded-xl p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <FileTypeIcon type={file.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <a href={file.driveViewUrl || file.url} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {council && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: council.color }} />
                        <span className="text-xs text-muted-foreground truncate">{council.name}</span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FileTypeIcon({ type }) {
  const isImage = type?.startsWith('image/');
  const isPDF   = type === 'application/pdf';
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
      ${isImage ? 'bg-blue-100 text-blue-700' : isPDF ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
      {isImage ? 'IMG' : isPDF ? 'PDF' : <File size={14} />}
    </div>
  );
}
