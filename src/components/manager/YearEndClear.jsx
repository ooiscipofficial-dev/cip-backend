import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { clearSystemData, getAllCouncilsData } from '../../lib/dataStore';
import { CURRENT_ACADEMIC_YEAR } from '../../lib/mockData';

export default function YearEndClear({ onClose, onShowPDF }) {
  const [step, setStep] = useState(1); // 1=confirm, 2=done
  const [confirm, setConfirm] = useState('');

  const storeData = getAllCouncilsData();
  const hasData = Object.keys(storeData).length > 0;

  function handleClear() {
    clearSystemData();
    setStep(2);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle size={18} />
              <h2 className="text-base font-semibold">Year-End Data Clear</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently clear <strong>all council data</strong> for Academic Year {CURRENT_ACADEMIC_YEAR}, 
              including all initiatives, padlets, reports, approvals, and calendar events.
            </p>
            {hasData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-amber-800 mb-2">⚠ Export Required First</p>
                <p className="text-xs text-amber-700 mb-3">You must export the PDF report before clearing data.</p>
                <button onClick={() => { onClose(); onShowPDF(); }}
                  className="text-xs font-medium text-amber-800 underline">
                  Export PDF Report →
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">Type <strong>CLEAR {CURRENT_ACADEMIC_YEAR}</strong> to confirm:</p>
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={`CLEAR ${CURRENT_ACADEMIC_YEAR}`}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-4"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                disabled={confirm !== `CLEAR ${CURRENT_ACADEMIC_YEAR}`}
                onClick={handleClear}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Clear All Data
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-base font-semibold mb-2">Data Cleared</h2>
            <p className="text-sm text-muted-foreground mb-5">
              All council data for {CURRENT_ACADEMIC_YEAR} has been cleared. The system is ready for the next academic year.
            </p>
            <button onClick={() => { onClose(); window.location.reload(); }}
              className="w-full px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}