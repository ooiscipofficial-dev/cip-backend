const STATUS_STYLES = {
  'Completed':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Not Started': 'bg-muted text-muted-foreground border border-border',
  'Pending':     'bg-amber-50 text-amber-700 border border-amber-200',
  'Approved':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Rejected':    'bg-red-50 text-red-700 border border-red-200',
  'Healthy':     'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return (
    <span className={`status-pill ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}