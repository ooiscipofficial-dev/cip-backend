import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PDFReport from '../components/manager/PDFReport';
import YearEndClear from '../components/manager/YearEndClear';
import MemberCredentials from '../components/manager/MemberCredentials';
import { COUNCILS_DATA } from '../lib/mockData';
import { getAllCouncilsData, calculateImpactScore } from '../lib/dataStore';
import { LayoutGrid, FileText, Trash2, ChevronRight, CheckCircle, XCircle, Clock, Download, Key, Loader2Icon } from 'lucide-react';

export default function ManagerDashboard({ session }) {
  const [showPDF,   setShowPDF]   = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [storeData, setStoreData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  async function loadData() {
      try {
        const data = await getAllCouncilsData();
        setStoreData(data || {});
      } catch (error) {
        console.error("Failed to refresh data:", error);
      } finally {
        setIsLoading(false);
      }
    }
// 2. Call it once when the component mounts
  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }
  const councils = COUNCILS_DATA.map(c => {
    const data = storeData[c.id] || {};
    return {
      ...c,
      impactScore: calculateImpactScore(c.impactScore, data),
      pendingCount: (data.pendingList || []).length,
      approvedCount: (data.approvedList || []).length,
      rejectedCount: (data.rejectedList || []).length,
      initiativeCount: (data.initiatives || []).length,
      successfulCount: (data.successfulInitiatives || []).length,
    };
  });

  const totalInitiatives = councils.reduce((s, c) => s + c.initiativeCount, 0);
  const totalPending = councils.reduce((s, c) => s + c.pendingCount, 0);
  const totalApproved = councils.reduce((s, c) => s + c.approvedCount, 0);
  const avgScore = Math.round(councils.reduce((s, c) => s + c.impactScore, 0) / councils.length);

  return (
    <div className="min-h-screen bg-background">
      <Navbar session={session} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Manager Overview</h1>
            <p className="text-xs text-muted-foreground">9 student councils + 4 houses — 2026–27</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreds(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Key size={12} /> Member Credentials
            </button>
            
            <button
              onClick={() => setShowPDF(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <FileText size={12} /> Export PDF
            </button>
            <button
              onClick={() => setShowClear(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Year-End Clear
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Initiatives" value={totalInitiatives} />
          <StatCard label="Pending Review" value={totalPending} highlight />
          <StatCard label="Approved" value={totalApproved} />
          <StatCard label="Avg Impact Score" value={avgScore} />
        </div>

        {/* Council grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {councils.map(council => (
            <Link
              key={council.id}
              to={`/council/${council.id}`}
              className="border border-border rounded-xl p-4 bg-card hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: council.color }}>
                    {council.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{council.name}</p>
                    <p className="text-xs text-muted-foreground">Score: {council.impactScore}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>

              {/* Progress bar */}
              <div className="progress-bar mb-3">
                <div className="progress-bar-fill" style={{ width: `${Math.min(council.impactScore, 100)}%` }} />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><LayoutGrid size={10} /> {council.initiativeCount}</span>
                {council.pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600"><Clock size={10} /> {council.pendingCount} pending</span>
                )}
                {council.approvedCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={10} /> {council.approvedCount}</span>
                )}
                {council.rejectedCount > 0 && (
                  <span className="flex items-center gap-1 text-red-500"><XCircle size={10} /> {council.rejectedCount}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showPDF   && <PDFReport councils={councils} storeData={storeData} onClose={() => setShowPDF(false)} />}
      {showClear && <YearEndClear onClose={() => setShowClear(false)} />}
      {showCreds && <MemberCredentials storeData={storeData} onClose={() => setShowCreds(false)} onRefresh={loadData} />}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800' : 'border-border bg-card'}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}