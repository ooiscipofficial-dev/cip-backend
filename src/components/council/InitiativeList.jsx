import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

const TABS = ['active', 'successful', 'history'];

export default function InitiativeList({ 
  initiatives = [], // Data passed from parent
  pendingList = [],
  onSelect, 
  onDelete, 
  onApprove, 
  onReject, 
  isManager 
}) {
  const [tab, setTab] = useState('active');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const cleanPending = pendingList.filter(
    pendingItem => !initiatives.some(approvedItem => approvedItem.id === pendingItem.id)
  );
  const today = new Date().toISOString().split('T')[0];

  // ─── 1. DATA CATEGORIZATION ─────────────────────────────────────────────
  // useMemo ensures we only re-filter when the initiatives list actually changes
  const categorizedData = useMemo(() => {
    return {
      active: initiatives.filter(i => 
        i.status !== 'Approved' && 
        i.status !== 'Rejected' && 
        Number(i.isSuccessful) !== 1
      ),
      approved: initiatives.filter(i => i.status === 'Approved'),
      rejected: initiatives.filter(i => i.status === 'Rejected'),
      successful: initiatives.filter(i => 
        i.isSuccessful === true || Number(i.isSuccessful) === 1
      )
    };
  }, [initiatives]);

  // ─── 2. HELPERS ─────────────────────────────────────────────────────────
  function getDaysOverdue(executionDate, executedOnTime) {
    if (!executionDate || executedOnTime !== null) return 0;
    const diff = new Date(today) - new Date(executionDate);
    return diff > 0 ? Math.floor(diff / 86400000) : 0;
  }

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    const { initiative, action } = reviewModal;
    
    // Call the parent functions passed via props
    if (action === 'approve') {
      await onApprove?.(initiative.id, reviewNote);
    } else {
      await onReject?.(initiative.id, reviewNote);
    }
    
    setReviewModal(null);
    setReviewNote('');
  };

  // ─── 3. RENDER LOGIC ─────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {TABS.map(t => {
          let count = 0;
          if (t === 'active') count = categorizedData.active.length;
          if (t === 'successful') count = categorizedData.successful.length;
          if (t === 'history') count = categorizedData.approved.length + categorizedData.rejected.length;

          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize
                ${tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}>
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Active Tab */}
      {tab === 'active' && (
        <div className="space-y-2">
          {categorizedData.active.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No active initiatives found.</div>
          )}
          {categorizedData.active.map(ini => {
            const daysOverdue = getDaysOverdue(ini.executionDate, ini.executedOnTime);
            return (
              <div key={ini.id} onClick={() => onSelect?.(ini)}
                className={`border rounded-xl p-4 bg-card hover:bg-muted/30 transition-all cursor-pointer group
                ${daysOverdue > 0 ? 'border-red-200 bg-red-50/10' : 'border-border'}`}>
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold">{ini.title}</p>
                      {ini.status === 'Pending' || ini.status === 'Not Started' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={10} /> {ini.status}
                        </span>
                      ) : null}
                    </div>
                    {ini.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{ini.description}</p>}
                    {daysOverdue > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase">
                        <AlertTriangle size={10} /> {daysOverdue}d overdue
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {isManager && (ini.status === 'Pending' || ini.status === 'Not Started') && (
                      <div className="flex gap-1">
                        <button onClick={() => setReviewModal({ initiative: ini, action: 'approve' })}
                          className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Approve</button>
                        <button onClick={() => setReviewModal({ initiative: ini, action: 'reject' })}
                          className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Reject</button>
                      </div>
                    )}
                    <button onClick={() => onDelete?.(ini.id)} className="p-1 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Successful Tab */}
      {tab === 'successful' && (
        <div className="space-y-2">
          {categorizedData.successful.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No successful initiatives yet.</div>}
          {categorizedData.successful.map(s => (
            <div key={s.id} onClick={() => onSelect?.(s)} className="border border-amber-100 rounded-xl p-3 bg-amber-50/20 cursor-pointer">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{s.title}</p>
                <CheckCircle size={14} className="text-amber-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-2">Approved</p>
            {categorizedData.approved.length === 0 && <p className="text-xs text-muted-foreground px-1 italic">None</p>}
            {categorizedData.approved.map(a => (
              <div key={a.id} onClick={() => onSelect?.(a)} className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/10 cursor-pointer mb-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{a.title}</p>
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-dashed">
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-2">Rejected</p>
            {categorizedData.rejected.length === 0 && <p className="text-xs text-muted-foreground px-1 italic">None</p>}
            {categorizedData.rejected.map(r => (
              <div key={r.id} onClick={() => onSelect?.(r)} className="border border-red-100 rounded-xl p-3 bg-red-50/10 cursor-pointer mb-2 opacity-70">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{r.title}</p>
                  <span className="text-[10px] text-red-600 font-bold">REJECTED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold mb-4 capitalize">{reviewModal.action} Initiative</h3>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full p-2 text-sm border rounded-lg bg-background mb-4 h-24 resize-none focus:ring-2 focus:ring-primary outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2 text-sm border rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={handleReviewSubmit} 
                className={`flex-1 py-2 text-sm text-white rounded-lg ${reviewModal.action === 'approve' ? 'bg-emerald-600' : 'bg-red-500'}`}>
                Confirm {reviewModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}