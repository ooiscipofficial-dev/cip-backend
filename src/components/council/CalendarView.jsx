import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const EVENT_COLORS = {
  Continuous: 'bg-blue-100 text-blue-700 border-blue-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Onetime: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  default: 'bg-blue-500 text-secondary-foreground border-input',
};

export default function CalendarView({ events = [] }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay = new Date(current.year, current.month, 1).getDay();

  const monthEvents = events.filter(ev => {
    const d = new Date(ev.date);
    return d.getFullYear() === current.year && d.getMonth() === current.month;
  });

  function eventsByDay(day) {
    return monthEvents.filter(ev => new Date(ev.date).getDate() === day);
  }

  const monthName = new Date(current.year, current.month).toLocaleString('default', { month: 'long' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{monthName} {current.year}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrent(c => {
            const d = new Date(c.year, c.month - 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })} className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={13} />
          </button>
          <button onClick={() => setCurrent(c => {
            const d = new Date(c.year, c.month + 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })} className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs text-muted-foreground text-center py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay(day);
          const isToday =
            day === today.getDate() &&
            current.month === today.getMonth() &&
            current.year === today.getFullYear();

          return (
            <div
              key={day}
              className={`min-h-[60px] rounded-lg border p-1 ${
                isToday ? 'border-foreground bg-muted/50' : 'border-border'
              }`}
            >
              <p className={`text-xs font-medium mb-0.5 ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                {day}
              </p>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev, idx) => {
                  // Normalize the type to handle case sensitivity (e.g., 'continuous' -> 'Continuous')
                  const typeKey = ev.type ? ev.type.charAt(0).toUpperCase() + ev.type.slice(1).toLowerCase() : 'default';
                  const colorClass = EVENT_COLORS[typeKey] || EVENT_COLORS.default;

                  return (
                    <div
                      key={idx}
                      className={`text-[10px] px-1 py-0.5 rounded border truncate ${colorClass}`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming events list */}
      {monthEvents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Events this month</p>
          <div className="space-y-1.5">
            {monthEvents.sort((a, b) => a.date.localeCompare(b.date)).map((ev, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border border-border rounded-lg p-2 bg-background">
                <Calendar size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-muted-foreground">{ev.date} · {ev.type}</p>
                  {ev.description && <p className="text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthEvents.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">No events this month.</p>
      )}
    </div>
  );
}