export default function ProgressBar({ value = 0, className = '' }) {
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}