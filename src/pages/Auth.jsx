import { useState } from 'react';
import { COUNCILS_DATA } from '../lib/mockData';
import { memberLogin, managerLogin, setSession } from '../lib/authStore';
import ThemeToggle from '../components/layout/ThemeToggle';
import { Loader2, ChevronRight, Shield } from 'lucide-react';

export default function Auth() {
  const [step, setStep] = useState('select');
  const [selectedCouncil, setSelectedCouncil] = useState(null);
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentCouncils = COUNCILS_DATA.filter(c => !c.type);
  const houseCouncils = COUNCILS_DATA.filter(c => c.type === 'house');

  function handleCouncilTileClick(council) {
    setSelectedCouncil(council);
    setError('');
    setForm({ username: '', password: '' });
    setStep('member');
  }

  async function handleMemberLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await memberLogin(form.username, form.password, selectedCouncil.id);

    setLoading(false);
    if (res.success) {
      setSession(res.session);
      window.location.href = `/council/${selectedCouncil.id}`;
    } else {
      setError(res.error);
    }
  }

  async function handleManagerLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await managerLogin(form.username, form.password);

    setLoading(false);
    if (res.success) {
      setSession(res.session);
      window.location.href = '/manager';
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="min-h-screen bg-background auth-glow grid-bg flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded bg-background" />
          </div>
          <span className="text-lg font-semibold tracking-tight">CouncilHub</span>
        </div>

        {step === 'select' && (
          <div>
            <h1 className="text-xl font-semibold text-center mb-1">Sign in to your council</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Select your council to continue</p>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">Student Councils</p>
              {studentCouncils.map(council => (
                <CouncilButton key={council.id} council={council} onClick={() => handleCouncilTileClick(council)} />
              ))}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1 mt-3">House Councils</p>
              {houseCouncils.map(council => (
                <CouncilButton key={council.id} council={council} onClick={() => handleCouncilTileClick(council)} />
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-border">
              <button
                onClick={() => { setStep('manager'); setError(''); setForm({ username: '', password: '' }); }}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield size={13} /> Manager access
              </button>
            </div>
          </div>
        )}

        {step === 'member' && (
          <div>
            <CouncilBadge council={selectedCouncil} />
            <h1 className="text-xl font-semibold mb-1">Member sign-in</h1>
            <p className="text-sm text-muted-foreground mb-5">Use the credentials set by your manager.</p>
            <form onSubmit={handleMemberLogin} className="space-y-3">
              <FormField
                label="Username"
                type="text"
                value={form.username}
                placeholder="e.g. president.aarav"
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
              <FormField
                label="Password"
                type="password"
                value={form.password}
                placeholder="Password"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <SubmitButton loading={loading}>Sign in</SubmitButton>
            </form>
            <button
              onClick={() => { setStep('select'); setError(''); }}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground block mx-auto"
            >
              Back
            </button>
          </div>
        )}

        {step === 'manager' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Shield size={14} className="text-background" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Manager access - 9 councils + 4 houses</p>
                <p className="text-sm font-semibold">Full system control</p>
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-1">Manager sign-in</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Credentials configured in <code className="bg-muted px-1 rounded text-xs">lib/authStore.js</code>
            </p>
            <form onSubmit={handleManagerLogin} className="space-y-3">
              <FormField
                label="Username"
                type="text"
                value={form.username}
                placeholder="manager"
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
              <FormField
                label="Password"
                type="password"
                value={form.password}
                placeholder="Password"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <SubmitButton loading={loading}>Sign in as Manager</SubmitButton>
            </form>
            <button
              onClick={() => { setStep('select'); setError(''); }}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground block mx-auto"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CouncilButton({ council, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group"
    >
      <div
        className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: council.color }}
      >
        {council.name[0]}
      </div>
      <span className="text-sm font-medium flex-1">{council.name}</span>
      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function CouncilBadge({ council }) {
  if (!council) return null;
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: council.color }}
      >
        {council.name[0]}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Selected council</p>
        <p className="text-sm font-semibold">{council.name}</p>
      </div>
    </div>
  );
}

function FormField({ label, type, value, placeholder, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
