// CouncilHub — lib/driveStore.js
// File metadata store (localStorage). Wire Google Drive API here when ready.

const FILES_KEY = 'councilhub_files_v1';

function loadFiles() {
  try { return JSON.parse(localStorage.getItem(FILES_KEY) || '{}'); }
  catch { return {}; }
}
function saveFiles(data) { localStorage.setItem(FILES_KEY, JSON.stringify(data)); }

export function getCouncilFiles(councilId) {
  return loadFiles()[councilId] || [];
}

export function addCouncilFile(councilId, fileRecord, shareToCommon = false) {
  const store = loadFiles();
  if (!store[councilId]) store[councilId] = [];
  const record = {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    ...fileRecord,
    councilId,
    uploadedAt: new Date().toISOString(),
    sharedToCommon: shareToCommon,
    driveFileId: null,
    driveViewUrl: null,
  };
  store[councilId].push(record);
  saveFiles(store);
  return record;
}

export function deleteCouncilFile(councilId, fileId) {
  const store = loadFiles();
  if (!store[councilId]) return;
  store[councilId] = store[councilId].filter(f => f.id !== fileId);
  saveFiles(store);
}

export function getCommonFiles() {
  const store = loadFiles();
  const all = [];
  Object.values(store).forEach(files => files.forEach(f => { if (f.sharedToCommon) all.push(f); }));
  return all.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function shareFileToCommon(councilId, fileId) {
  const store = loadFiles();
  const file = store[councilId]?.find(f => f.id === fileId);
  if (file) { file.sharedToCommon = true; saveFiles(store); }
}

export function unshareFileFromCommon(councilId, fileId) {
  const store = loadFiles();
  const file = store[councilId]?.find(f => f.id === fileId);
  if (file) { file.sharedToCommon = false; saveFiles(store); }
}

export function getAllCouncilFiles() { return loadFiles(); }