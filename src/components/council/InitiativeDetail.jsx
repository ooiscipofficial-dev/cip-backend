import { useState } from 'react';
import StatusPill from '../../components/ui/StatusPill';
import { Pencil, ArrowLeft, MessageSquare, Star, EyeOff, Calendar, Repeat, Clock, CheckSquare, AlertTriangle, ShieldCheck, XCircle, RotateCcw, Trash2 } from 'lucide-react';
export default function InitiativeDetail({
  initiative, onBack, onEdit, isManager, isPresident,
  onAddComment, onApprove, onReject, onMarkExecution, onRevert, onDeleteComment
}) {
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showExecutionBox, setShowExecutionBox] = useState(false);
  const [execNote, setExecNote] = useState(initiative.successNote || '');

  // NEW: State to trigger the review modal
  const [reviewType, setReviewType] = useState(null);
  const isApproved = String(initiative.status || '').toLowerCase() === 'approved';
  const isRejected = String(initiative.status || '').toLowerCase() === 'rejected';
  const isPending = String(initiative.status || '').toLowerCase() === 'pending';
  const isSuccessful = initiative.isSuccessful === true || Number(initiative.isSuccessful) === 1;
  const canMarkExecution = isPresident && isApproved && !isSuccessful;

  function submitComment(commentData) {
    if (commentData?.text) {
      if (!commentData.text.trim()) return;
      onAddComment?.({ text: commentData.text.trim(), author: commentData.author || 'Manager' });
    } else {
      if (!commentText.trim()) return;
      onAddComment?.(commentText.trim());
    }
    setCommentText('');
    setShowCommentBox(false);
  }

  function submitExecution(onTime) {
    if (!execNote.trim()) return;
    onMarkExecution?.(initiative.id, onTime, execNote.trim());
    setShowExecutionBox(false);
  }

  // Overdue calculation
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = initiative.executionDate && initiative.executionDate < today && !isSuccessful && initiative.executedOnTime == null;
  const daysOverdue = isOverdue
    ? Math.floor(
        (new Date(today).getTime() - new Date(initiative.executionDate).getTime()) / 86400000
      )
    : 0;

  return (
    <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">

      {/* REVIEW MODAL */}
      {reviewType && (
        <ReviewModal
          type={reviewType}
          onClose={() => setReviewType(null)}
          onConfirm={(data) => {
            if (reviewType === 'approve') onApprove?.(initiative.id, data);
            if (reviewType === 'reject') onReject?.(initiative.id, data);
            setReviewType(null);
          }}
        />
      )}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">{initiative.title}</h1>
          
          {/* Status Badges */}
          {isApproved && (
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider border border-green-200">
              Approved
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-200">
              Rejected
            </span>
          )}
          {isPending && (
            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider border border-yellow-200">
              Pending Review
            </span>
          )}
          
        </div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">

          {/* MANAGER APPROVE / REJECT BUTTONS */}
          {isManager && !isApproved && !isRejected && (
            <div className="flex gap-2 mr-2 border-r pr-2 border-border">
              <button
                onClick={() => setReviewType('approve')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                <ShieldCheck size={12} /> Approve
              </button>
              <button
                onClick={() => setReviewType('reject')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium">
                <XCircle size={12} /> Reject
              </button>
            </div>
          )}
          {/* Manager Actions Section */}
          {isManager && (
            <div className="">
              {/* Temporary Debug - you can remove this after it works */}
                           
              <div className="flex flex-wrap gap-3">
                {/* 1. Only show Approve/Reject if it's explicitly pending or missing a status */}
                

                {/* 2. Only show Reset if it's already been acted upon */}
                {(isApproved || isRejected) && (
                  <button 
                    onClick={async () => {
                      if(window.confirm("Are you sure you want to move this back to Pending?")) {
                        await onRevert(initiative.id);
                      }
                    }}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-medium"
                  >
                    <RotateCcw size={14} />
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          )}
          {canMarkExecution && (
            <button onClick={() => setShowExecutionBox(s => !s)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
              <CheckSquare size={12} /> Mark Completed
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(initiative)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors">
              <Pencil size={12} /> Edit
            </button>
          )}
          {isManager && (
            <button onClick={() => setShowCommentBox(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90">
              <MessageSquare size={12} /> Comment
            </button>
          )}
        </div>
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-center gap-2 mb-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle size={13} className="flex-shrink-0" />
          <span>Execution date was <strong>{initiative.executionDate}</strong> — <strong>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</strong>. Mark execution to clear this status.</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{initiative.title}</h2>
            {isSuccessful && (
              <span className="status-pill bg-amber-50 text-amber-700 border border-amber-200">
                <Star size={10} /> Successful
              </span>
            )}
            {initiative.executedOnTime === true && (
              <span className="status-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckSquare size={10} /> Executed on time
              </span>
            )}
            {initiative.executedOnTime === false && (
              <span className="status-pill bg-red-50 text-red-700 border border-red-200">
                <Clock size={10} /> Executed late
              </span>
            )}
            <span className="status-pill bg-muted text-muted-foreground border border-border">
              {initiative.initiativeType === 'continuous' ? <><Repeat size={10} /> Continuous</> : <><Clock size={10} /> One-Time</>}
            </span>
          </div>
          {initiative.description && <p className="text-sm text-muted-foreground mt-1">{initiative.description}</p>}
        </div>
      </div>

      {/* Execution date display */}
      {initiative.executionDate && (
        <div className="mb-4 flex items-center gap-2 text-xs">
          <Calendar size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground">Execution date:</span>
          <span className="font-medium">{initiative.executionDate}</span>
        </div>
      )}

      {/* President success note */}
      {initiative.successNote && (
        <div className="mb-4 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl px-3 py-2 text-xs">
          <span className="font-medium text-emerald-700">President's note: </span>
          <span>{initiative.successNote}</span>
        </div>
      )}

      {/* President: mark execution box */}
      {canMarkExecution && showExecutionBox && (
        <div className="mb-5 border border-border rounded-xl p-4 bg-background">
          <p className="text-xs font-semibold mb-2">Mark Approved Initiative Completed</p>
          <input
            type="text"
            value={execNote}
            onChange={e => setExecNote(e.target.value)}
            placeholder="One-line note on how it went..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring mb-3"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowExecutionBox(false)}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="button" onClick={() => submitExecution(false)}
              className="flex-1 px-3 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
              Executed Late
            </button>
            <button type="button" onClick={() => submitExecution(true)}
              className="flex-1 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Executed On Time
            </button>
          </div>
        </div>
      )}

      {/* Objectives & Outcomes */}
      {(initiative.objectives || initiative.expectedOutcomes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {initiative.objectives && <InfoBox title="Objectives">{initiative.objectives}</InfoBox>}
          {initiative.expectedOutcomes && <InfoBox title="Expected Outcomes">{initiative.expectedOutcomes}</InfoBox>}
        </div>
      )}

      {/* Lead */}
      {initiative.lead?.name && (
        <Section title="Initiative Lead">
          <div className="flex items-center gap-3">
            {initiative.lead.imageUrl ? (
              <img src={initiative.lead.imageUrl} alt={initiative.lead.name}
                className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initiative.lead.name[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{initiative.lead.name}</p>
              <p className="text-xs text-muted-foreground">
                {initiative.lead.role}
                {initiative.lead.class && ` · ${initiative.lead.class}`}
                {initiative.lead.section && ` · Section ${initiative.lead.section}`}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* Contributors */}
      {initiative.contributors?.filter(c => c.name).length > 0 && (
        <Section title="Contributors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {initiative.contributors.filter(c => c.name).map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">{c.name[0]}</div>
                )}
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}{c.class && ` · ${c.class}`}{c.section && ` Sec. ${c.section}`}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Execution Phases */}
      {initiative.execution?.length > 0 && (
        <Section title="Execution Phases">
          <div className="space-y-3">
            {initiative.execution.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0
                    ${phase.status === 'Completed' ? 'bg-emerald-500' : phase.status === 'In Progress' ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} />
                  {i < initiative.execution.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{phase.phase}</p>
                    <StatusPill status={phase.status} />
                  </div>
                  {phase.note && <p className="text-xs text-muted-foreground">{phase.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Progress Reports (continuous) */}
      {initiative.initiativeType === 'continuous' && initiative.progressReports?.length > 0 && (
        <Section title="Progress Reports">
          <div className="space-y-2">
            {initiative.progressReports.map((r, i) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-background">
                <p className="text-xs font-medium text-muted-foreground mb-1">{r.date}</p>
                <p className="text-sm">{r.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Calendar Events */}
      {initiative.calendarEvents?.length > 0 && (
        <Section title="Calendar Events">
          <div className="space-y-1.5">
            {initiative.calendarEvents.slice(0, 5).map((ev, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <Calendar size={12} className="text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{ev.date}</span>
                <span className="font-medium">{ev.title}</span>
                <span className="text-muted-foreground">· {ev.type}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Official Manager Decision Note */}
      {isApproved && initiative.managerNote && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Official Manager Approval</span>
            <span className="text-[10px] text-emerald-600">{initiative.dateReviewed}</span>
          </div>
          <p className="text-sm text-emerald-900 italic">"{initiative.managerNote}"</p>
          <p className="text-[10px] font-semibold text-emerald-700 mt-2">— Reviewed by {initiative.reviewedBy}</p>
        </div>
      )}

      {isRejected && initiative.managerNote && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Manager Feedback (Rejected)</span>
            <span className="text-[10px] text-rose-600">{initiative.dateReviewed}</span>
          </div>
          <p className="text-sm text-rose-900 italic">"{initiative.managerNote}"</p>
          <p className="text-[10px] font-semibold text-rose-700 mt-2">— Reviewed by {initiative.reviewedBy}</p>
        </div>
      )}

     
      {(initiative.managerComments || []).map((item, idx) => {
            const commentData = item.text || {}; 
            const displayAuthor = commentData.author || item.author || "Manager";
            const displayText = typeof commentData === 'string' ? commentData : (commentData.text || "");

            return (
              <div key={idx} className="group relative p-2 mb-2 bg-muted rounded-lg border border-border/50">
                
                {/* DELETE BUTTON - Only shows for managers */}
                {isManager && (
                  <button
                    onClick={() => onDeleteComment(initiative.id, item.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-600 transition-opacity"
                    title="Delete comment"
                  >
                    <Trash2 size={12} /> {/* Or just use '×' if you don't have Lucide icons */}
                  </button>
                )}

                <p className="text-sm pr-6">{displayText}</p> 
                <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                  <span>By {displayAuthor}</span>
                  {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })}

      {/* Manager Comment Box */}
      {isManager && showCommentBox && (
        <div className="mt-4 border border-border rounded-xl p-4 bg-background shadow-sm">
          <p className="text-xs font-semibold mb-3">Add Manager Comment</p>

          <input
            type="text"
            placeholder="Your Name (e.g., Director Smith)"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card mb-2 focus:ring-1 focus:ring-ring outline-none"
            id="commenter-name"
          />

          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            rows={3}
            placeholder="Write your feedback..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card resize-none outline-none focus:ring-1 focus:ring-ring mb-2"
          />

          <div className="flex gap-2">
            <button onClick={() => setShowCommentBox(false)} className="flex-1 px-4 py-2 text-xs border rounded-lg hover:bg-muted">Cancel</button>
            <button
              onClick={() => {
                const name = document.getElementById('commenter-name').value;
                submitComment({ text: commentText, author: name });
              }}
              className="flex-1 px-4 py-2 text-xs font-medium bg-foreground text-background rounded-lg"
            >
              Post Comment
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground font-mono mt-4">{initiative.id}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function InfoBox({ title, children }) {
  return (
    <div className="border border-border rounded-xl p-3 bg-background">
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function ReviewModal({ onClose, onConfirm, type }) {
  const [note, setNote] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-1">
          {type === 'approve' ? '✅ Approve Initiative' : '❌ Reject Initiative'}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Provide your official decision and feedback for the council.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Manager Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your official name..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rationale / Feedback</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder={type === 'approve' ? "Why is this being approved?" : "Why is this being rejected?"}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/30 h-24 resize-none outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button
            onClick={() => onConfirm({ name, note })}
            className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg ${type === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'}`}
          >
            Confirm {type === 'approve' ? 'Approval' : 'Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
