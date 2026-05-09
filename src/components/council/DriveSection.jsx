import { useState, useRef } from 'react';
import { Upload, File, Trash2, Share2, ExternalLink, HardDrive, Check } from 'lucide-react';
import {getCouncilFiles, addCouncilFile, unshareFileFromCommon, shareFileToCommon, deleteCouncilFile} from '../../lib/driveStore'
export default function DriveSection({ councilId, councilName, session }) {
  const [files,     setFiles]     = useState(() => getCouncilFiles(councilId));
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  /** @type {import('react').RefObject<HTMLInputElement | null>} */
  const fileInputRef = useRef(null);

  function refresh() { setFiles(getCouncilFiles(councilId)); }

  async function handleFiles(fileList) {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const url = URL.createObjectURL(file);
      // TODO: replace with Drive API upload → store driveViewUrl on the record
      addCouncilFile(councilId, {
        name: file.name, size: file.size, type: file.type, url,
        councilName, uploadedBy: session?.name || session?.username || 'Unknown',
      }, false);
    }
    setUploading(false);
    refresh();
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleShare(fileId, currentlyShared) {
    if (currentlyShared) unshareFileFromCommon(councilId, fileId);
    else shareFileToCommon(councilId, fileId);
    refresh();
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={15} />
        <h3 className="text-sm font-semibold">Council Drive</h3>
        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
          Local · Connect Drive in config.js
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-foreground bg-muted/60' : 'border-border hover:border-muted-foreground hover:bg-muted/30'}`}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading
          ? <p className="text-xs text-muted-foreground">Uploading...</p>
          : <>
              <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-0.5">Drop files or click to upload</p>
              <p className="text-xs text-muted-foreground">Click Share to push to Common File Wall</p>
            </>
        }
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">No files uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5 bg-card">
              <FileIcon type={file.type} />
              <div className="flex-1 min-w-0">
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate block">{file.name}</a>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} · {file.uploadedBy} · {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleShare(file.id, file.sharedToCommon)} title={file.sharedToCommon ? 'Remove from Common Wall' : 'Share to Common Wall'}
                  className={`p-1.5 rounded-lg transition-colors ${file.sharedToCommon ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'text-muted-foreground hover:bg-muted'}`}>
                  {file.sharedToCommon ? <Check size={13} /> : <Share2 size={13} />}
                </button>
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => { deleteCouncilFile(councilId, file.id); refresh(); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FileIcon({ type }) {
  const isImage = type?.startsWith('image/');
  const isPDF   = type === 'application/pdf';
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
      ${isImage ? 'bg-blue-100 text-blue-700' : isPDF ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
      {isImage ? 'IMG' : isPDF ? 'PDF' : <File size={14} />}
    </div>
  );
}