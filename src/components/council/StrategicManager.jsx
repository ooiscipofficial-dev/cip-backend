import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2, Target, AlertTriangle, Lightbulb, History } from 'lucide-react';
import { saveStrategicAnalysis, saveTimelineEvents } from '../../lib/dataStore';

export default function StrategicManager({ councilId, data, onRefresh }) {
  const [analysis, setAnalysis] = useState({
    summary: '',
    strengths: [],
    risks: [],
    focus: []
  });
  const [timeline, setTimeline] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const sa = data.strategicAnalysis || {};
      setAnalysis({
        summary: sa.summary || '',
        strengths: typeof sa.strengths === 'string' ? JSON.parse(sa.strengths || '[]') : (sa.strengths || []),
        risks: typeof sa.risks === 'string' ? JSON.parse(sa.risks || '[]') : (sa.risks || []),
        focus: typeof sa.focus === 'string' ? JSON.parse(sa.focus || '[]') : (sa.focus || [])
      });
      setTimeline(data.timelineEvents || []);
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const s1 = await saveStrategicAnalysis(councilId, analysis);
      const s2 = await saveTimelineEvents(councilId, timeline);
      if (s1 && s2) {
        onRefresh();
      } else {
        alert("Failed to save some details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving strategic data.");
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (listKey) => {
    setAnalysis(prev => ({
      ...prev,
      [listKey]: [...prev[listKey], '']
    }));
  };

  const updateItem = (listKey, index, value) => {
    const newList = [...analysis[listKey]];
    newList[index] = value;
    setAnalysis(prev => ({ ...prev, [listKey]: newList }));
  };

  const removeItem = (listKey, index) => {
    setAnalysis(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== index)
    }));
  };

  const addTimelineEvent = () => {
    setTimeline(prev => [...prev, { date: new Date().toISOString().split('T')[0], title: '', note: '' }]);
  };

  const updateTimelineEvent = (index, field, value) => {
    const newTimeline = [...timeline];
    newTimeline[index] = { ...newTimeline[index], [field]: value };
    setTimeline(newTimeline);
  };

  const removeTimelineEvent = (index) => {
    setTimeline(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Strategic Management</h2>
            <p className="text-xs text-muted-foreground">Customize the deep analysis and execution timeline for this council.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Strategy'}
          </button>
        </div>

        {/* Summary */}
        <div className="space-y-2 mb-8">
          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
            <Target size={12} className="text-theme" /> Strategic Overview Summary
          </label>
          <textarea
            value={analysis.summary}
            onChange={(e) => setAnalysis(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Describe the council's current strategic position..."
            className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ListEditor 
            title="Strength Signals" 
            items={analysis.strengths} 
            listKey="strengths" 
            icon={<CheckCircleIcon />}
            onAdd={addItem} 
            onUpdate={updateItem} 
            onRemove={removeItem} 
          />
          <ListEditor 
            title="Risk Watch" 
            items={analysis.risks} 
            listKey="risks" 
            icon={<AlertTriangle size={12} />}
            onAdd={addItem} 
            onUpdate={updateItem} 
            onRemove={removeItem} 
          />
          <ListEditor 
            title="90-Day Focus" 
            items={analysis.focus} 
            listKey="focus" 
            icon={<Lightbulb size={12} />}
            onAdd={addItem} 
            onUpdate={updateItem} 
            onRemove={removeItem} 
          />
        </div>

        <hr className="border-border my-8" />

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
              <History size={12} className="text-theme" /> Execution Timeline Checkpoints
            </label>
            <button
              onClick={addTimelineEvent}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-theme hover:underline"
            >
              <Plus size={12} /> Add Checkpoint
            </button>
          </div>

          <div className="space-y-3">
            {timeline.map((event, index) => (
              <div key={index} className="flex gap-3 items-start bg-muted/30 p-3 rounded-xl border border-border/50">
                <input 
                  type="date"
                  value={event.date}
                  onChange={(e) => updateTimelineEvent(index, 'date', e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"
                />
                <div className="flex-1 space-y-2">
                  <input 
                    type="text"
                    value={event.title}
                    onChange={(e) => updateTimelineEvent(index, 'title', e.target.value)}
                    placeholder="Event Title (e.g. Cycle Kickoff)"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1 text-xs font-semibold focus:outline-none"
                  />
                  <textarea 
                    value={event.note}
                    onChange={(e) => updateTimelineEvent(index, 'note', e.target.value)}
                    placeholder="Brief description of this milestone..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1 text-xs focus:outline-none resize-none"
                  />
                </div>
                <button 
                  onClick={() => removeTimelineEvent(index)}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-center py-8 text-xs text-muted-foreground italic border-2 border-dashed border-border rounded-2xl">
                No custom timeline events. Using auto-generated milestones.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ title, items, listKey, icon, onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
          {icon} {title}
        </label>
        <button
          onClick={() => onAdd(listKey)}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          <Plus size={12} className="text-theme" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="group flex items-center gap-2">
            <input 
              value={item}
              onChange={(e) => onUpdate(listKey, idx, e.target.value)}
              className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={`Add ${title.toLowerCase()}...`}
            />
            <button 
              onClick={() => onRemove(listKey, idx)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[10px] text-muted-foreground italic">No items added.</p>
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
