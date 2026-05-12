import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

// Presidents can edit: mission, homepage, achievement, mainProject
// Managers can edit everything
export default function CouncilInfoEditor({ council, info, onSave, canEdit }) {
  const [editing, setEditing] = useState(false);
  const storedInfo = info?.info || {};
  const storedProject = info?.mainProject || {};

  const [form, setForm] = useState({
    mission: storedInfo.mission || council.mission || '',
    homepage: storedInfo.homepage || council.homepage || '',
    achievement: storedInfo.achievement || council.achievement || '',
    mainProjectTitle: storedProject.title || council.mainProject?.title || '',
    mainProjectProgress: storedProject.progress ?? council.mainProject?.progress ?? 0,
    mainProjectStatus: storedProject.status || council.mainProject?.status || 'In Progress',
  });

  useEffect(() => {
    if (!editing) {
      const nextInfo = info?.info || {};
      const nextProject = info?.mainProject || {};
      setForm({
        mission: nextInfo.mission || council.mission || '',
        homepage: nextInfo.homepage || council.homepage || '',
        achievement: nextInfo.achievement || council.achievement || '',
        mainProjectTitle: nextProject.title || council.mainProject?.title || '',
        mainProjectProgress: nextProject.progress ?? council.mainProject?.progress ?? 0,
        mainProjectStatus: nextProject.status || council.mainProject?.status || 'In Progress',
      });
    }
  }, [info, council, editing]);

  function handleSave() {
    onSave(form);
    setEditing(false);
  }

  const display = {
    mission: storedInfo.mission || council.mission,
    homepage: storedInfo.homepage || council.homepage,
    achievement: storedInfo.achievement || council.achievement,
    mainProjectTitle: storedProject.title || council.mainProject?.title,
    mainProjectProgress: storedProject.progress ?? council.mainProject?.progress ?? 0,
    mainProjectStatus: storedProject.status || council.mainProject?.status,
  };

  return (
    <div className="border border-border rounded-2xl p-5 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold">Council Information</h2>

        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Pencil size={11} /> Edit
          </button>
        )}

        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <X size={11} /> Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              <Check size={11} /> Save
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <Field label="Mission" editing={editing}>
          {editing ? (
            <textarea
              value={form.mission}
              onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="text-sm">{display.mission}</p>
          )}
        </Field>

        <Field label="Homepage URL" editing={editing}>
          {editing ? (
            <input
              value={form.homepage}
              onChange={e => setForm(f => ({ ...f, homepage: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : display.homepage ? (
            <a
              href={display.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {display.homepage}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Not set</p>
          )}
        </Field>

        <Field label="Key Achievement" editing={editing}>
          {editing ? (
            <input
              value={form.achievement}
              onChange={e => setForm(f => ({ ...f, achievement: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="text-sm">
              {display.achievement || (
                <span className="text-muted-foreground">Not set</span>
              )}
            </p>
          )}
        </Field>

        <Field label="Main Project" editing={editing}>
          {editing ? (
            <div className="space-y-2">
              <input
                value={form.mainProjectTitle}
                onChange={e =>
                  setForm(f => ({ ...f, mainProjectTitle: e.target.value }))
                }
                placeholder="Project title"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.mainProjectProgress}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      mainProjectProgress: Number(e.target.value),
                    }))
                  }
                  className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <select
                  value={form.mainProjectStatus}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      mainProjectStatus: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">
                {display.mainProjectTitle || (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </p>

              {display.mainProjectTitle && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{display.mainProjectStatus}</span>
                    <span>{display.mainProjectProgress}%</span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${display.mainProjectProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Field>
      </div>
    </div>
  );
}

/**
 * @param {{ label: string, children: any, editing?: boolean }} props
 */
function Field({ label, children, editing }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
        {editing && (
          <span className="ml-2 text-[10px] text-blue-500">(editing)</span>
        )}
      </p>
      {children}
    </div>
  );
}
