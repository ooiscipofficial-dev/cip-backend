import { useEffect, useState } from 'react';
import { COUNCILS_DATA, MEMBER_ROLES } from '../../lib/mockData';
import { Key, Save, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { getMemberCredentials, saveMemberCredentials, getCouncils, createCouncil, deleteCouncil } from '../../lib/dataStore';

function normalizeCredentials(credentials) {
  if (!credentials || typeof credentials !== 'object') return {};

  if (Array.isArray(credentials)) {
    return Object.fromEntries(
      credentials.map((member, index) => [
        member.memberKey || member.id || `member_${index}`,
        {
          id: member.id,
          username: member.username || '',
          password: member.password || '',
          name: member.name || '',
          role: member.role || 'Council Junior',
        },
      ])
    );
  }

  return Object.fromEntries(
    Object.entries(credentials).map(([key, member]) => [
      key,
      {
        id: member?.id,
        username: member?.username || '',
        password: member?.password || '',
        name: member?.name || '',
        role: member?.role || 'Council Junior',
      },
    ])
  );
}

function emptyRoleSlots() {
  const slots = {};
  MEMBER_ROLES.forEach((role, index) => {
    slots[`${role.toLowerCase().replace(/ /g, '_')}_${index + 1}`] = {
      username: '',
      password: '',
      name: '',
      role,
    };
  });
  return slots;
}

function validCouncils(items) {
  return (Array.isArray(items) ? items : [])
    .filter(council => typeof council?.id === 'string' && council.id.trim() && typeof council?.name === 'string' && council.name.trim())
    .map(council => ({ ...council, id: council.id.trim(), name: council.name.trim(), color: council.color || '#6366f1' }));
}

function mergeCouncilsWithDefaults(items) {
  const liveCouncils = validCouncils(items);
  const byId = new Map(COUNCILS_DATA.map(council => [council.id, council]));

  liveCouncils.forEach(council => {
    byId.set(council.id, { ...(byId.get(council.id) || {}), ...council });
  });

  return Array.from(byId.values());
}

export default function MemberCredentials({ storeData, session, onClose, onRefresh }) {
  const [councils, setCouncils] = useState(COUNCILS_DATA);
  const [selectedId, setSelectedId] = useState(COUNCILS_DATA[0].id);
  const [creds, setCreds] = useState(emptyRoleSlots);
  const [savedCreds, setSavedCreds] = useState({});
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showPwd, setShowPwd] = useState({});
  const [saved, setSaved] = useState(false);
  const [newCouncil, setNewCouncil] = useState({ name: '', id: '', color: '#6366f1', googleEmail: '' });
  const [showCouncilForm, setShowCouncilForm] = useState(false);
  const [councilError, setCouncilError] = useState('');

  const hasSavedCredentials = Object.keys(savedCreds).length > 0;
  const council = councils.find(c => c.id === selectedId);
  const entries = Object.entries(creds);

  useEffect(() => {
    let cancelled = false;

    async function loadCredentials() {
      if (!selectedId) {
        setCreds(emptyRoleSlots());
        setSavedCreds({});
        setLoadingCreds(false);
        return;
      }
      setLoadingCreds(true);
      const loaded = normalizeCredentials(await getMemberCredentials(selectedId, session?.token));
      if (cancelled) return;

      const nextCreds = Object.keys(loaded).length > 0 ? loaded : emptyRoleSlots();
      const filledKeys = Object.entries(nextCreds)
        .filter(([, member]) => member.username || member.password || member.name)
        .map(([key]) => key);

      setSavedCreds(loaded);
      setCreds(nextCreds);
      setExpanded(filledKeys.length > 0 ? Object.fromEntries(filledKeys.map(key => [key, true])) : {});
      setLoadingCreds(false);
    }

    loadCredentials();

    return () => {
      cancelled = true;
    };
  }, [selectedId, session?.token]);

  useEffect(() => {
    let cancelled = false;
    getCouncils()
      .then(items => {
        const mergedCouncils = mergeCouncilsWithDefaults(items);
        if (!cancelled && mergedCouncils.length) {
          setCouncils(mergedCouncils);
          setSelectedId(current => mergedCouncils.some(c => c.id === current) ? current : mergedCouncils[0].id);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function refreshSelectedCredentials() {
    const loaded = normalizeCredentials(await getMemberCredentials(selectedId, session?.token));
    const nextCreds = Object.keys(loaded).length > 0 ? loaded : emptyRoleSlots();
    const filledKeys = Object.entries(nextCreds)
      .filter(([, member]) => member.username || member.password || member.name)
      .map(([key]) => key);

    setSavedCreds(loaded);
    setCreds(nextCreds);
    setExpanded(filledKeys.length > 0 ? Object.fromEntries(filledKeys.map(key => [key, true])) : {});
  }

  function changeCouncil(id) {
    setSelectedId(id);
    setSaved(false);
  }

  function update(key, field, val) {
    setCreds(current => ({ ...current, [key]: { ...current[key], [field]: val } }));
    setSaved(false);
  }

  function addMember() {
    setCreds(current => ({
      ...current,
      [`member_${Date.now()}`]: { username: '', password: '', name: '', role: 'Council Junior' },
    }));
  }

  function remove(key) {
    setCreds(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateNewCouncil(field, value) {
    setNewCouncil(current => ({ ...current, [field]: value }));
  }

  async function addCouncil() {
    const name = newCouncil.name.trim();
    const id = (newCouncil.id.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    if (!name || !id) {
      setCouncilError('Enter a council name and a valid ID.');
      return;
    }
    try {
      const created = await createCouncil({ ...newCouncil, name, id }, session?.token);
      setCouncils(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedId(created.id);
      setNewCouncil({ name: '', id: '', color: '#6366f1', googleEmail: '' });
      setCouncilError('');
      setShowCouncilForm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      setCouncilError(error.message || 'Unable to create the council.');
    }
  }

  async function removeCouncil() {
    if (!council) return;
    if (!window.confirm(`Delete ${council.name}? This permanently removes its credentials, initiatives, and council data.`)) return;
    try {
      await deleteCouncil(council.id, session?.token);
      const remaining = councils.filter(item => item.id !== council.id);
      setCouncils(remaining);
      setSelectedId(remaining[0]?.id || '');
      if (onRefresh) await onRefresh();
    } catch (error) {
      alert(error.message || 'Unable to delete the council.');
    }
  }

  async function save() {
    const validCreds = {};
    for (const [key, val] of Object.entries(creds)) {
      if (val.username && val.username.trim() !== '') {
        validCreds[key] = val;
      }
    }

    const success = await saveMemberCredentials(selectedId, validCreds, session?.token);

    if (success) {
      setSaved(true);
      await refreshSelectedCredentials();
      if (onRefresh) await onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert('Failed to save credentials to server.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Key size={15} />
            <h2 className="text-base font-semibold">Member Credentials</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">x</button>
        </div>

        <div className="flex overflow-hidden flex-1 min-h-0">
          <div className="w-44 border-r border-border bg-muted/20 flex-shrink-0 overflow-y-auto py-2">
            {councils.map(c => (
              <button
                key={c.id}
                onClick={() => changeCouncil(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                  selectedId === c.id ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 rounded-xl border border-border p-3 bg-muted/10">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">Council Management</p>
                <button onClick={() => { setShowCouncilForm(value => !value); setCouncilError(''); }} className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded-lg hover:bg-muted">
                  <Plus size={11} /> New Council
                </button>
              </div>
              {showCouncilForm && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input value={newCouncil.name} onChange={e => updateNewCouncil('name', e.target.value)} placeholder="Council name" className="col-span-2 w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background" />
                  <input value={newCouncil.id} onChange={e => updateNewCouncil('id', e.target.value.toLowerCase())} placeholder="ID (optional)" className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background" />
                  <input type="color" value={newCouncil.color} onChange={e => updateNewCouncil('color', e.target.value)} className="h-8 w-full rounded border border-border bg-background" aria-label="Council color" />
                  <input value={newCouncil.googleEmail} onChange={e => updateNewCouncil('googleEmail', e.target.value)} placeholder="Google email (optional)" className="col-span-2 w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background" />
                  {councilError && <p className="col-span-2 text-xs text-red-600">{councilError}</p>}
                  <button onClick={addCouncil} className="col-span-2 px-2.5 py-1.5 text-xs bg-foreground text-background rounded-lg">Create Council</button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{council?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hasSavedCredentials
                    ? `${entries.length} saved credential${entries.length === 1 ? '' : 's'} loaded from DB`
                    : loadingCreds
                      ? 'Loading saved credentials...'
                    : 'No saved credentials in dashboard data yet - showing editable role slots'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={removeCouncil} disabled={!council} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40">
                  <Trash2 size={11} /> Delete Council
                </button>
                <button onClick={addMember} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded-lg hover:bg-muted">
                  <Plus size={11} /> Add
                </button>
                <button
                  onClick={save}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    saved ? 'bg-emerald-600 text-white' : 'bg-foreground text-background hover:opacity-90'
                  }`}
                >
                  <Save size={11} /> {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {entries.map(([key, member]) => (
                <div key={key} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(current => ({ ...current, [key]: !current[key] }))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-background hover:bg-muted/40 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name || member.username || <span className="text-muted-foreground italic">Unnamed</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.role} - Username: {member.username || 'not set'} - Password: {member.password || 'not set'}
                      </p>
                    </div>
                    {expanded[key] ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
                  </button>

                  {expanded[key] && (
                    <div className="px-3 pb-3 pt-2 border-t border-border bg-muted/10 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <input
                          value={member.name || ''}
                          onChange={e => update(key, 'name', e.target.value)}
                          placeholder="Full name"
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                        <select
                          value={member.role}
                          onChange={e => update(key, 'role', e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        >
                          {[...new Set(MEMBER_ROLES)].map(role => <option key={role}>{role}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Username</label>
                        <input
                          value={member.username || ''}
                          onChange={e => update(key, 'username', e.target.value)}
                          placeholder="e.g. john.doe"
                          className="w-full mt-1 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Password</label>
                        <div className="relative mt-1">
                          <input
                            type={showPwd[key] ? 'text' : 'password'}
                            value={member.password || ''}
                            onChange={e => update(key, 'password', e.target.value)}
                            placeholder="Set password"
                            className="w-full pr-8 px-2.5 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(current => ({ ...current, [key]: !current[key] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
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
