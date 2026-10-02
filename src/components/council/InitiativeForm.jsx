import { useState, useEffect, useRef } from 'react';
import { INITIATIVE_TEMPLATE } from '../../lib/mockData';
import { generateInitiativeId, hasExecutionDateConflict } from '../../lib/dataStore';
import { X, Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin,
  markdownShortcutPlugin, linkPlugin, imagePlugin, tablePlugin, codeBlockPlugin,
  codeMirrorPlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles,
  CreateLink, InsertImage, InsertTable, ListsToggle, BlockTypeSelect, CodeToggle,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

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
  function normalizeLead(lead = {}) {
    const type = lead.type === 'council' ? 'council' : 'individual';
    return {
      ...INITIATIVE_TEMPLATE.lead,
      ...lead,
      type,
      mainStudents: Array.isArray(lead.mainStudents) ? lead.mainStudents : [],
    };
  }
  
  const [form, setForm] = useState(initial ? {
    ...INITIATIVE_TEMPLATE,
    ...initial,
    lead: normalizeLead(initial.lead),
    contributors: initial.contributors?.length ? initial.contributors : [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
    execution: initial.execution?.length ? initial.execution : INITIATIVE_TEMPLATE.execution,
  } : {
    ...INITIATIVE_TEMPLATE,
    lead: normalizeLead(INITIATIVE_TEMPLATE.lead),
    contributors: [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
    execution: INITIATIVE_TEMPLATE.execution.map(e => ({ ...e })),
  });

  const [dateConflict, setDateConflict] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsEditorOpen, setDetailsEditorOpen] = useState(false);
  const isSubmitting = useRef(false);
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
      lead: normalizeLead(initial.lead),
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
      lead: normalizeLead(INITIATIVE_TEMPLATE.lead),
      contributors: [{ name: '', role: '', class: '', section: '', imageUrl: '' }],
      execution: INITIATIVE_TEMPLATE.execution.map(e => ({ ...e })),
    });
  }
}, [initial]); // This triggers every time you click a different 'Edit' button

  useEffect(() => {
    if (form.executionDate) {
      handleDateChange(form.executionDate);
    }
  }, []);
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

  function setLeadType(type) {
    setForm(f => ({
      ...f,
      lead: {
        ...normalizeLead(f.lead),
        type,
        role: type === 'council' ? 'Council Initiative Lead' : (f.lead?.role || 'Student Initiative Lead'),
      },
    }));
  }

  function addLeadStudent() {
    setForm(f => ({
      ...f,
      lead: {
        ...normalizeLead(f.lead),
        mainStudents: [
          ...(f.lead?.mainStudents || []),
          { name: '', role: 'Main Student Lead', class: '', section: '', imageUrl: '' },
        ],
      },
    }));
  }

  function removeLeadStudent(idx) {
    setForm(f => ({
      ...f,
      lead: {
        ...normalizeLead(f.lead),
        mainStudents: (f.lead?.mainStudents || []).filter((_, i) => i !== idx),
      },
    }));
  }

  function updateLeadStudent(idx, field, value) {
    setForm(f => {
      const lead = normalizeLead(f.lead);
      const arr = [...lead.mainStudents];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, lead: { ...lead, mainStudents: arr } };
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
  async function handleSubmit(e) {
    e.preventDefault();
    if (dateConflict || isSubmitting.current) return;

    const registrationFormUrl = form.registrationFormUrl?.trim() || '';
    if (registrationFormUrl) {
      try {
        const formUrl = new URL(registrationFormUrl);
        if (formUrl.protocol !== 'https:' || !(/(^|\.)google\.com$/i.test(formUrl.hostname) || formUrl.hostname === 'forms.gle')) {
          throw new Error('not a Google URL');
        }
      } catch {
        alert('Please enter a valid HTTPS Google Forms link, or leave the registration form field empty.');
        return;
      }
    }
    
    const id = form.id || generateInitiativeId(councilId, form.title, Date.now());
    
    const lead = normalizeLead(form.lead);
    const normalizedLead = lead.type === 'council'
      ? {
          ...lead,
          name: '',
          class: '',
          section: '',
          imageUrl: '',
          role: lead.role || 'Council Initiative Lead',
          mainStudents: lead.mainStudents.filter(student => student?.name?.trim()),
        }
      : {
          ...lead,
          type: 'individual',
          councilName: '',
          mainStudents: [],
        };

    isSubmitting.current = true;
    setIsSaving(true);
    try {
      await onSave({ ...form, id, registrationFormUrl, lead: normalizedLead });
    } finally {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  }

  const showcasePadlet = council?.padlets?.showcase;

  return (
    <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold">{initial?.id ? 'Edit Initiative' : 'New Initiative'}</h2>
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
              <Textarea value={form.description} onChange={e => setField('description', e.target.value.slice(0, 120))} placeholder="A short overview of this initiative..." rows={2} maxLength={120} />
              <p className="mt-1 text-[11px] text-muted-foreground">{form.description.length}/120 characters</p>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Additional Information</Label>
                  <p className="text-xs text-muted-foreground">Add full details, links, images, tables, and rich Markdown content.</p>
                </div>
                <button type="button" onClick={() => setDetailsEditorOpen(true)} className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90">
                  {form.detailsMarkdown?.trim() ? 'Edit information' : 'Add information'}
                </button>
              </div>
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
            <div className="sm:col-span-2">
              <Label>Google Forms Registration Link (optional)</Label>
              <Input
                type="url"
                value={form.registrationFormUrl || ''}
                onChange={e => setField('registrationFormUrl', e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Visitors will see a View Form button on the public initiative page.</p>
            </div>
          </div>
        </Section>

        {/* Lead */}
        <Section title="Initiative Lead">
          <div className="space-y-4">
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setLeadType('individual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${form.lead?.type !== 'council' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setLeadType('council')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${form.lead?.type === 'council' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Council
              </button>
            </div>

            {form.lead?.type === 'council' ? (
              <div className="space-y-3">
                <Input value={form.lead?.councilName || ''} onChange={e => setField('lead.councilName', e.target.value)} placeholder="Council name" />
                <div className="space-y-3">
                  {(form.lead?.mainStudents || []).map((student, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Main Student {i + 1}</span>
                        <button type="button" onClick={() => removeLeadStudent(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={student.name || ''} onChange={e => updateLeadStudent(i, 'name', e.target.value)} placeholder="Full name" />
                        <Input value={student.role || ''} onChange={e => updateLeadStudent(i, 'role', e.target.value)} placeholder="Role" />
                        <Input value={student.class || ''} onChange={e => updateLeadStudent(i, 'class', e.target.value)} placeholder="Grade" />
                        <Input value={student.section || ''} onChange={e => updateLeadStudent(i, 'section', e.target.value)} placeholder="Section" />
                      </div>
                      <Input value={student.imageUrl || ''} onChange={e => updateLeadStudent(i, 'imageUrl', e.target.value)} placeholder="Profile image URL (optional)" />
                    </div>
                  ))}
                  <button type="button" onClick={addLeadStudent}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                    <Plus size={12} /> Add Main Student
                  </button>
                </div>
              </div>
            ) : (
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
            )}
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
          <button type="submit" disabled={dateConflict || isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? 'Saving…' : initial?.id ? 'Update Initiative' : 'Create Initiative'}
          </button>
        </div>
      </form>

      {detailsEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div><h3 className="font-semibold">Additional Information</h3><p className="mt-1 text-xs text-muted-foreground">Use Markdown for the full public-facing initiative story.</p></div>
              <button type="button" onClick={() => setDetailsEditorOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close editor"><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              <MDXEditor markdown={form.detailsMarkdown || ''} onChange={(markdown) => setField('detailsMarkdown', markdown)} contentEditableClassName="prose prose-sm dark:prose-invert max-w-none min-h-[420px] rounded-b-xl px-4 py-3 focus:outline-none" plugins={[
                headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin(), markdownShortcutPlugin(), linkPlugin(), imagePlugin(), tablePlugin(), codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }), codeMirrorPlugin(),
                toolbarPlugin({ toolbarContents: () => <><UndoRedo /><BlockTypeSelect /><BoldItalicUnderlineToggles /><CodeToggle /><ListsToggle /><CreateLink /><InsertImage /><InsertTable /></> }),
              ]} />
            </div>
            <div className="flex justify-end border-t border-border px-5 py-3"><button type="button" onClick={() => setDetailsEditorOpen(false)} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">Done</button></div>
          </div>
        </div>
      )}
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

function Textarea({ value, onChange, placeholder, rows = 3, maxLength }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} maxLength={maxLength}
      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
  );
}
