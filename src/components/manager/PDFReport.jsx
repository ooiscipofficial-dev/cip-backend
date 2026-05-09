// PDF Report generator — renders a print-friendly report with NO raw data exposed
import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { buildPDFReport } from '../../lib/dataStore';
import { COUNCILS_DATA, CURRENT_ACADEMIC_YEAR } from '../../lib/mockData';

export default function PDFReport({ onClose, storeData }) {
  const reportRef = useRef();
  const report = buildPDFReport(COUNCILS_DATA, storeData);

  function handlePrint() {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>CouncilHub Report ${CURRENT_ACADEMIC_YEAR}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; padding: 32px; }
        h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        h2 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        h3 { font-size: 13px; font-weight: 600; margin: 16px 0 4px; color: #374151; }
        p { font-size: 12px; color: #6b7280; margin: 2px 0 8px; line-height: 1.5; }
        .council-block { page-break-inside: avoid; margin-bottom: 40px; }
        .score-badge { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .initiative { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        .phase { display: flex; gap: 8px; font-size: 11px; color: #6b7280; margin: 3px 0; }
        .contributor { font-size: 11px; color: #374151; margin: 2px 0; }
        .comment { background: #fef9c3; border-left: 3px solid #fbbf24; padding: 6px 10px; font-size: 11px; margin: 4px 0; border-radius: 0 4px 4px 0; }
        .approved { color: #065f46; font-size: 11px; margin: 3px 0; }
        .rejected { color: #991b1b; font-size: 11px; margin: 3px 0; }
        .header { background: #111; color: white; padding: 20px 32px; margin: -32px -32px 32px; }
        .meta { font-size: 11px; color: #9ca3af; margin-top: 4px; }
        .success-badge { background: #d1fae5; color: #065f46; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; }
        @media print { .header { -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <div class="header">
        <h1 style="color:white;margin:0;">CouncilHub — Annual Report</h1>
        <p class="meta">Academic Year ${CURRENT_ACADEMIC_YEAR} · Generated ${new Date().toLocaleDateString()}</p>
      </div>

      ${report.map(council => {
        // Defensive fallbacks to ensure arrays exist
        const initiatives = council.initiatives || [];
        const approved = council.approved || [];
        const rejected = council.rejected || [];

        return `
          <div class="council-block">
            <h2>${council.councilName}</h2>
            <p>${council.mission || 'No mission statement provided.'}</p>
            <p>Impact Score: <span class="score-badge">${council.impactScore || 0}/100</span> &nbsp; Achievement: ${council.achievement || 'N/A'}</p>

            ${initiatives.length > 0 ? `
              <h3>Initiatives (${initiatives.length})</h3>
              ${initiatives.map(ini => `
                <div class="initiative">
                  <strong>${ini.title}</strong>
                  ${ini.isSuccessful ? '<span class="success-badge" style="margin-left:8px;">✓ Successful</span>' : ''}
                  <br/><span style="font-size:11px;color:#6b7280;">${ini.type === 'continuous' ? 'Continuous' : 'One-Time'}</span>
                  ${ini.summary ? `<p>${ini.summary}</p>` : ''}
                  
                  ${(ini.contributors || []).length > 0 ? `
                    <p style="margin-bottom:2px;font-weight:600;font-size:11px;">Contributors:</p>
                    ${ini.contributors.filter(c => c && c.name).map(c => `<div class="contributor">· ${c.name} — ${c.role}</div>`).join('')}
                  ` : ''}

                  ${(ini.managerComments || []).length > 0 ? `
                    <p style="margin-top:8px;margin-bottom:2px;font-weight:600;font-size:11px;">Manager Comments:</p>
                    ${ini.managerComments.map(c => `<div class="comment">${new Date(c.date).toLocaleDateString()} · ${c.text}</div>`).join('')}
                  ` : ''}
                </div>
              `).join('')}
            ` : '<p style="color:#9ca3af; font-size:11px;">No initiatives recorded.</p>'}

            ${approved.length > 0 ? `
              <h3>Approved Initiatives</h3>
              ${approved.map(a => `<div class="approved">✓ ${a.title}</div>`).join('')}
            ` : ''}

            ${rejected.length > 0 ? `
              <h3>Rejected Proposals</h3>
              ${rejected.map(r => `<div class="rejected">✗ ${r.title}</div>`).join('')}
            ` : ''}
          </div>
        `;
      }).join('')}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-semibold mb-2">Export PDF Report</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a clean, professional report for Academic Year {CURRENT_ACADEMIC_YEAR}. 
          This includes all initiatives, contributions, impact scores, manager comments, and approved/rejected decisions.
        </p>
        <div className="bg-muted rounded-xl p-4 mb-5 text-xs text-muted-foreground space-y-1">
          <p>✓ All council initiatives and contributors</p>
          <p>✓ Impact scores and achievements</p>
          <p>✓ Manager comments and decisions</p>
          <p>✓ Approved and rejected proposals</p>
          <p className="text-amber-600 font-medium mt-2">⚠ This export is required before year-end data clearing.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}