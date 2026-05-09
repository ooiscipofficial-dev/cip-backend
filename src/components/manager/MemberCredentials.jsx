import { useState, useEffect } from 'react';
import { COUNCILS_DATA, MEMBER_ROLES, getMemberCredentials, setMemberCredentials } from '../../lib/mockData';
import { Key, Save, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { saveMemberCredentials } from '../../lib/dataStore';
export default function MemberCredentials({ storeData, onClose, onRefresh }) {
  const [selectedId, setSelectedId] = useState(COUNCILS_DATA[0].id);
  const [expanded,   setExpanded]   = useState({});
  const [showPwd,    setShowPwd]    = useState({});
  const [saved,      setSaved]      = useState(false);
    // Inside MemberCredentials.jsx
  useEffect(() => {
    if (selectedId && storeData[selectedId]) {
      setCreds(storeData[selectedId].credentials || { username: '', password: '' });
    }
  }, [selectedId, storeData]);
  function loadCreds(id) {
    const ex = getMemberCredentials(id);
    if (Object.keys(ex).length > 0) return ex;
    const slots = {};
    MEMBER_ROLES.forEach((role, i) => {
      slots[`${role.toLowerCase().replace(/ /g,'_')}_${i+1}`] = { username: '', password: '', name: '', role };
    });
    return slots;
  }

  const [creds, setCreds] = useState(() => loadCreds(COUNCILS_DATA[0].id));

  function changeCouncil(id) { setSelectedId(id); setCreds(loadCreds(id)); setSaved(false); }
  function update(key, field, val) { setCreds(c => ({ ...c, [key]: { ...c[key], [field]: val } })); setSaved(false); }
  function addMember() { setCreds(c => ({ ...c, [`member_${Date.now()}`]: { username: '', password: '', name: '', role: 'Council Junior' } })); }
  function remove(key) { setCreds(c => { const n = {...c}; delete n[key]; return n; }); }
  async function save() {
    // 1. Send to backend
    const success = await saveMemberCredentials(selectedId, creds);
    
    if (success) {
      // 2. Update local state if needed
      setSaved(true);
      if (onRefresh) await onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert("Failed to save credentials to server.");
    }
  }
  const council = COUNCILS_DATA.find(c => c.id === selectedId);
  const entries = Object.entries(creds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><Key size={15} /><h2 className="text-base font-semibold">Member Credentials</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        <div className="flex overflow-hidden flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-44 border-r border-border bg-muted/20 flex-shrink-0 overflow-y-auto py-2">
            {COUNCILS_DATA.map(c => (
              <button key={c.id} onClick={() => changeCouncil(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors
                  ${selectedId === c.id ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{council?.name}</p>
                <p className="text-xs text-muted-foreground">{entries.length} members</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addMember}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded-lg hover:bg-muted">
                  <Plus size={11} /> Add
                </button>
                <button onClick={save}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors
                    ${saved ? 'bg-emerald-600 text-white' : 'bg-foreground text-background hover:opacity-90'}`}>
                  <Save size={11} /> {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {entries.map(([key, m]) => (
                <div key={key} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-background hover:bg-muted/40 text-left">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.name || <span className="text-muted-foreground italic">Unnamed</span>}</p>
                      <p className="text-xs text-muted-foreground">{m.role} · {m.username || 'no username'}</p>
                    </div>
                    {expanded[key] ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
                  </button>

                  {expanded[key] && (
                    <div className="px-3 pb-3 pt-2 border-t border-border bg-muted/10 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <input value={m.name} onChange={e => update(key,'name',e.target.value)} placeholder="Full name"
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                        <select value={m.role} onChange={e => update(key,'role',e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none">
                          {[...new Set(MEMBER_ROLES)].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Username</label>
                        <input value={m.username} onChange={e => update(key,'username',e.target.value)} placeholder="e.g. john.doe"
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Password</label>
                        <div className="relative mt-1">
                          <input type={showPwd[key] ? 'text' : 'password'} value={m.password}
                            onChange={e => update(key,'password',e.target.value)} placeholder="Set password"
                            className="w-full pr-8 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                          <button type="button" onClick={() => setShowPwd(s => ({...s,[key]:!s[key]}))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPwd[key] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => remove(key)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}