import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import CalendarView from '../components/council/CalendarView';
import { getAllCouncilsData } from '../lib/dataStore';
import { COUNCILS_DATA } from '../lib/mockData';
import { Calendar } from 'lucide-react';

export default function GlobalCalendarPage({ session }) {
  const [storeData, setStoreData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await getAllCouncilsData();
      setStoreData(all);
      setIsLoading(false);
    }
    load();
  }, []);

  const allEvents = Object.entries(storeData).flatMap(([id, data]) => {
    const cInfo = COUNCILS_DATA.find(c => c.id === id) || { name: id };
    return (data.initiatives || []).map(ini => ({
      ...ini,
      councilName: cInfo.name,
      date: ini.executionDate
    }));
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar session={session} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="text-theme" /> Strategic Execution Calendar
            </h1>
            <p className="text-sm text-muted-foreground">Unified delivery timeline across all councils.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme"></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <CalendarView events={allEvents} />
          </div>
        )}
      </main>
    </div>
  );
}
