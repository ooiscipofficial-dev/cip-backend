import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { getActivity } from '../../lib/dataStore';

export default function ActivityAudit({ session, onClose }) {
  const [items, setItems] = useState([]);
  useEffect(() => { getActivity(session?.token).then(setItems).catch(() => setItems([])); }, [session?.token]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-card border border-border rounded-2xl shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border"><div className="flex gap-2 items-center"><Clock size={15}/><h2 className="text-base font-semibold">Account Activity Audit</h2></div><button onClick={onClose}><X size={18}/></button></div>
      <div className="overflow-y-auto max-h-[70vh] p-4 space-y-2">{items.length ? items.map(item => <div key={item.id} className="border border-border rounded-xl p-3 text-xs"><div className="flex justify-between gap-3"><strong>{item.actorName || item.actorUsername || 'Unknown account'}</strong><span className="text-muted-foreground">{item.createdAt}</span></div><p className="mt-1">{item.action}</p><p className="mt-1 text-muted-foreground">{item.councilId || 'System'}{item.activeSeconds ? ` · ${item.activeSeconds}s active time` : ''}</p></div>) : <p className="text-sm text-muted-foreground text-center py-10">No audited activity yet.</p>}</div>
    </div>
  </div>;
}
