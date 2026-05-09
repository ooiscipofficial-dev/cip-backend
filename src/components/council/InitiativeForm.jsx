import { useState, useEffect  } from 'react';
import { INITIATIVE_TEMPLATE } from '../../lib/mockData';
import { generateInitiativeId, hasExecutionDateConflict } from '../../lib/dataStore';
import { X, Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
/**
 * @param {{ 
 * councilId: string, 
 * form: object,
 * onSave: function,
 * }} props 
 */
// Inside InitiativeForm.jsx


export default function InitiativeForm({ councilId, council, initial, onSave, onCancel, isManager }) {
  
  const [form, setForm] = useState(initial ? {
    ...INITIATIVE_TEMPLATE,
    ...initial,
    contributors: initial.contributors?.length ? initial.contributors : [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
    execution: initial.execution?.length ? initial.execution : INITIATIVE_TEMPLATE.execution,
  } : {
    ...INITIATIVE_TEMPLATE,
    contributors: [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
    execution: INITIATIVE_TEMPLATE.execution.map(e => ({ ...e })),
  });

  const [dateConflict, setDateConflict] = useState(false);
  console.log("PROPS RECEIVED:", { councilId, onSave, form });
  function setField(path, value) {
    setForm(f => {
      const copy = JSON.parse(JSON.stringify(f));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  }
  useEffect(() => {
  if (initial) {
    // If we are editing, overwrite the form state with the initiative's data
    setForm({
      ...INITIATIVE_TEMPLATE,
      ...initial,
      contributors: initial.contributors?.length 
        ? initial.contributors 
        : [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
      execution: initial.execution?.length 
        ? initial.execution 
        : INITIATIVE_TEMPLATE.execution,
    });
  } else {
    // If initial is null (New Initiative), reset to blank template
    setForm({
      ...INITIATIVE_TEMPLATE,
      contributors: [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
      execution: INITIATIVE_TEMPLATE.execution.map(e => ({ ...e })),
    });
  }
}, [initial]); // This triggers every time you click a different 'Edit' button
  async function handleDateChange(date) { // 1. Added async
    setField('executionDate', date);
    
    if (date) {
      // 2. Added await here to get the actual boolean result
      const conflict = await hasExecutionDateConflict(councilId, date, initial?.id || null);
      setDateConflict(conflict);
    } else {
      setDateConflict(false);
    }
  }

  function addContributor() {
    setForm(f => ({ ...f, contributors: [...f.contributors, { name: '', role: '', class: '', section: '', imageUrl: '' }] }));
  }

  function removeContributor(idx) {
    setForm(f => ({ ...f, contributors: f.contributors.filter((_, i) => i !== idx) }));
  }

  function updateContributor(idx, field, value) {
    setForm(f => {
      const arr = [...f.contributors];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, contributors: arr };
    });
  }

  function updatePhase(idx, field, value) {
    setForm(f => {
      const arr = [...f.execution];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, execution: arr };
    });
  }

  function addProgressReport() {
    setForm(f => ({
      ...f,
      progressReports: [...(f.progressReports || []), { date: new Date().toISOString().split('T')[0], text: '' }]
    }));
  }

  function updateProgressReport(idx, field, value) {
    setForm(f => {
      const arr = [...(f.progressReports || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, progressReports: arr };
    });
  }



// To this:
  function handleSubmit(e) {
    e.preventDefault();
    if (dateConflict) return;
    
    const id = form.id || generateInitiativeId(councilId, form.title, Date.now());
    
    // This will now look for 'onSave' in the outer scope (the component props)
    onSave({ ...form, id });
  }

  const showcasePadlet = council?.padlets?.showcase;

  return (
    <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold">{initial ? 'Edit Initiative' : 'New Initiative'}</h2>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
      </div>

      {/* Padlet showcase reminder */}
      <div className="mb-5 border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2">
        <ExternalLink size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-semibold">Before submitting,</span> please add this initiative to your council's Showcase Padlet.
          {showcasePadlet ? (
            <a href={showcasePadlet} target="_blank" rel="noopener noreferrer"
              className="ml-1 underline font-medium">Open Showcase Padlet →</a>
          ) : (
            <span className="ml-1 text-blue-500">(No showcase Padlet configured yet — ask your manager to set it up in Settings)</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Initiative Title *</Label>
              <Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Peer Tutoring Timetable" required />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe this initiative in detail..." rows={3} />
            </div>
            <div>
              <Label>Objectives</Label>
              <Textarea value={form.objectives} onChange={e => setField('objectives', e.target.value)} placeholder="What are the key objectives?" rows={2} />
            </div>
            <div>
              <Label>Expected Outcomes</Label>
              <Textarea value={form.expectedOutcomes} onChange={e => setField('expectedOutcomes', e.target.value)} placeholder="What outcomes are expected?" rows={2} />
            </div>
            <div>
              <Label>Initiative Type *</Label>
              <select
                value={form.initiativeType}
                onChange={e => setField('initiativeType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="one-time">One-Time</option>
                <option value="continuous">Continuous</option>
              </select>
            </div>
            <div>
              <Label>Execution Date *</Label>
              <input
                type="date"
                value={form.executionDate}
                onChange={e => handleDateChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {dateConflict && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
                  <AlertTriangle size={12} />
                  Another initiative is already scheduled on this date. Please choose a different date.
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Lead */}
        <Section title="Initiative Lead">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={form.lead?.name || ''} onChange={e => setField('lead.name', e.target.value)} placeholder="Full name" />
            <Input value={form.lead?.role || ''} onChange={e => setField('lead.role', e.target.value)} placeholder="Role (e.g. Student Initiative Lead)" />
            <Input value={form.lead?.class || ''} onChange={e => setField('lead.class', e.target.value)} placeholder="Grade / Class" />
            <Input value={form.lead?.section || ''} onChange={e => setField('lead.section', e.target.value)} placeholder="Section (e.g. A, B)" />
            <div className="sm:col-span-2">
              <Label>Profile Image URL (optional)</Label>
              <Input value={form.lead?.imageUrl || ''} onChange={e => setField('lead.imageUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </Section>

        {/* Contributors */}
        <Section title="Contributors">
          <div className="space-y-3">
            {form.contributors?.map((c, i) => (
              <div key={i} className="border border-border rounded-xl p-3 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Contributor {i + 1}</span>
                  <button type="button" onClick={() => removeContributor(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={c.name} onChange={e => updateContributor(i, 'name', e.target.value)} placeholder="Full name" />
                  <Input value={c.role} onChange={e => updateContributor(i, 'role', e.target.value)} placeholder="Role" />
                  <Input value={c.class || ''} onChange={e => updateContributor(i, 'class', e.target.value)} placeholder="Grade" />
                  <Input value={c.section || ''} onChange={e => updateContributor(i, 'section', e.target.value)} placeholder="Section" />
                </div>
                <Input value={c.imageUrl || ''} onChange={e => updateContributor(i, 'imageUrl', e.target.value)} placeholder="Profile image URL (optional)" />
              </div>
            ))}
            <button type="button" onClick={addContributor}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <Plus size={12} /> Add Contributor
            </button>
          </div>
        </Section>

        {/* Execution phases */}
        <Section title="Execution Phases">
          <div className="space-y-3">
            {form.execution?.map((phase, i) => (
              <div key={i} className="border border-border rounded-xl p-3 bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium flex-1">{phase.phase}</span>
                  <select
                    value={phase.status}
                    onChange={e => updatePhase(i, 'status', e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Textarea value={phase.note} onChange={e => updatePhase(i, 'note', e.target.value)} placeholder="Notes for this phase..." rows={2} />
              </div>
            ))}
          </div>
        </Section>

        {/* Progress reports (continuous only) */}
        {form.initiativeType === 'continuous' && (
          <Section title="Progress Reports">
            <div className="space-y-3">
              {(form.progressReports || []).map((report, i) => (
                <div key={i} className="border border-border rounded-xl p-3 bg-background space-y-2">
                  <Input value={report.date} onChange={e => updateProgressReport(i, 'date', e.target.value)} placeholder="Date (YYYY-MM-DD)" />
                  <Textarea value={report.text} onChange={e => updateProgressReport(i, 'text', e.target.value)} placeholder="Progress update..." rows={2} />
                </div>
              ))}
              <button type="button" onClick={addProgressReport}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                <Plus size={12} /> Add Progress Report
              </button>
            </div>
          </Section>
        )}

        {/* Manager comments (read-only display) */}
        {initial?.managerComments?.length > 0 && (
          <Section title="Manager Comments">
            <div className="space-y-2">
              {initial.managerComments.map((c, i) => (
                <div key={i} className="text-xs bg-muted rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">{new Date(c.date).toLocaleDateString()} · </span>
                  {c.text}
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={dateConflict}
            className="flex-1 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            {initial ? 'Update Initiative' : 'Create Initiative'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1">{children}</p>;
}

function Input({ value, onChange, placeholder, required, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
  );
}