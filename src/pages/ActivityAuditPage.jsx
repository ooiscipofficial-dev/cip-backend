import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { getMonthlyActivity } from '../lib/dataStore';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function ActivityAuditPage({ session }) {
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await getMonthlyActivity(session?.token, month));
    } catch (err) {
      setItems([]);
      setError(err.message || 'Could not load the activity audit.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [month, session?.token]);

  const rows = useMemo(() => {
    const members = new Map();
    for (const item of items) {
      if (String(item.actorType || '').toLowerCase() === 'manager') continue;
      const name = item.actorName || item.actorUsername || 'Unknown member';
      const key = `${item.councilId || ''}|${item.actorUsername || name}`;
      const row = members.get(key) || {
        key, name, username: item.actorUsername || '', councilId: item.councilId || '—',
        logins: [], initiatives: [], activeSeconds: 0, activityCount: 0
      };
      row.activityCount += 1;
      if (item.action === 'Logged in') row.logins.push(item.createdAt);
      if (String(item.action || '').startsWith('Created initiative:')) {
        row.initiatives.push(item.action.replace('Created initiative:', '').trim());
      }
      row.activeSeconds += Number(item.activeSeconds) || 0;
      members.set(key, row);
    }
    return [...members.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  function exportCsv() {
    const headers = ['Member', 'Username', 'Council', 'Login count', 'Login dates', 'Initiatives created', 'Time logged in', 'Recorded activities'];
    const values = rows.map(row => [
      row.name, row.username, row.councilId, row.logins.length,
      row.logins.map(date => new Date(date).toLocaleString()).join(' | '),
      [...new Set(row.initiatives)].join(' | '), formatDuration(row.activeSeconds), row.activityCount
    ]);
    const csv = [headers, ...values].map(line => line.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `member-activity-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="min-h-screen bg-background">
    <Navbar session={session} />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/manager" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"><ArrowLeft size={12} /> Manager dashboard</Link>
          <h1 className="text-lg font-semibold">Monthly Member Activity</h1>
          <p className="text-xs text-muted-foreground">Login history, initiatives created, and recorded time in each council workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="Activity month" type="month" value={month} onChange={event => setMonth(event.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-lg bg-background" />
          <button onClick={load} className="p-2 border border-border rounded-lg hover:bg-muted" title="Refresh"><RefreshCw size={14} /></button>
          <button onClick={exportCsv} disabled={!rows.length} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-foreground text-background disabled:opacity-50"><Download size={13} /> Export CSV</button>
        </div>
      </div>
      <div className="border border-border rounded-xl bg-card overflow-x-auto">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div> : error ? <p className="p-8 text-sm text-red-600">{error}</p> : rows.length ? <table className="w-full min-w-[900px] text-xs">
          <thead className="bg-muted/60 text-left text-muted-foreground"><tr><th className="p-3 font-medium">Member</th><th className="p-3 font-medium">Council</th><th className="p-3 font-medium">Logins</th><th className="p-3 font-medium">When logged in</th><th className="p-3 font-medium">Initiatives created</th><th className="p-3 font-medium">Time logged in</th><th className="p-3 font-medium">Activities</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.key} className="border-t border-border align-top"><td className="p-3 font-medium">{row.name}{row.username && <span className="block mt-0.5 font-normal text-muted-foreground">@{row.username}</span>}</td><td className="p-3">{row.councilId}</td><td className="p-3">{row.logins.length}</td><td className="p-3 max-w-56 text-muted-foreground">{row.logins.length ? row.logins.map(date => new Date(date).toLocaleString()).join(', ') : 'No sign-in recorded'}</td><td className="p-3 max-w-64">{[...new Set(row.initiatives)].join(', ') || '—'}</td><td className="p-3 whitespace-nowrap">{formatDuration(row.activeSeconds)}</td><td className="p-3">{row.activityCount}</td></tr>)}</tbody>
        </table> : <p className="py-16 text-center text-sm text-muted-foreground">No member activity recorded for this month.</p>}
      </div>
    </main>
  </div>;
}
