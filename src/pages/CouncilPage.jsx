/**
 * @typedef {{
 *   id: string | number,
 *   title?: string
 * }} Initiative
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import InitiativeList from '../components/council/InitiativeList';
import InitiativeDetail from '../components/council/InitiativeDetail';
import InitiativeForm from '../components/council/InitiativeForm';
import CalendarView from '../components/council/CalendarView';
import CouncilInfoEditor from '../components/council/CouncilInfoEditor';
import PadletTabs from '../components/council/PadletTabs';
import DriveSection from '../components/council/DriveSection';
import { COUNCILS_DATA } from '../lib/mockData';
import {
  getCouncilData, saveInitiative, deleteInitiative, saveCouncilInfo,
  rejectInitiative,
  addManagerComment, calculateImpactScore, markInitiativeExecution, approveInitiative, revertToPending, deleteManagerComment
} from '../lib/dataStore';
import { isPresident as checkPresident, isManager as checkManager, isOwnCouncilMember } from '../lib/authStore';
import { LayoutGrid, Calendar, Settings, Plus, Layout, HardDrive, Globe, TrendingUp } from 'lucide-react';
import CommonsView from '../components/council/CommonsView';
import StrategicManager from '../components/council/StrategicManager';

export default function CouncilPage({ session }) {
  const { councilId } = useParams();
  const council = COUNCILS_DATA.find(c => c.id === councilId);
  const [tab, setTab] = useState('initiatives');
  
  const [councilData, setCouncilData] = useState({ 
    initiatives: [], pendingList: [], approvedList: [], rejectedList: [] 
  });
  const [councilInfo, setCouncilInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true); 
    try {
      const data = await getCouncilData(councilId);
      if (data) {
        // 调试命令 (Debug Command)
        console.log(`--- Initiatives for ${councilId} ---`);
        if (data.initiatives && data.initiatives.length > 0) {
          console.table(data.initiatives, ["id", "title", "status", "executionDate"]);
        } else {
          console.warn("No initiatives found in the database for this council.");
        }

        setCouncilData(data);
        setCouncilInfo(data);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsLoading(false); 
    }
  }
  // 3. Load data on mount
  useEffect(() => {
      refresh();
    }, [councilId]);


  /**
   * @typedef {{
   *   id: string | number,
   *   title?: string
   * }} Initiative
   */

  const [selectedInitiative, setSelectedInitiative] = useState(
    /** @type {Initiative | null} */ (null)
  );

  const [showForm, setShowForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState(
    /** @type {Initiative | null} */ (null)
  );

  const isCouncilMember = isOwnCouncilMember(session, councilId);
  const isPresidentUser = checkPresident(session) && isCouncilMember;
  const managerView = checkManager(session);
  const canManageInitiatives = isCouncilMember || managerView;
  const canManageCouncilInfo = isPresidentUser || managerView;

  const handleSaveInitiative = async (formData) => {
      if (!canManageInitiatives) {
        alert("Only this council's members or a manager can edit initiatives.");
        return;
      }
      const success = await saveInitiative(councilId, formData);
      if (success) {
        await refresh();
        setShowForm(false);
        setEditingInitiative(null);
      }
    };

  async function handleDelete(initiativeId) {
    if (!canManageInitiatives) return;
    // 1. Confirm with the user (optional but recommended)
    if (!window.confirm("Are you sure you want to delete this initiative?")) return;

    try {
      // 2. Wait for the cloud to actually remove it
      const result = await deleteInitiative(councilId, initiativeId);
      
      if (result.success) {
        // 3. Clear the detail view if that initiative was open
        setSelectedInitiative(null);
        // 4. Trigger the UI refresh to show the updated list
        await refresh();
      } else {
        alert("Failed to delete: " + result.error);
      }
    } catch (err) {
      console.error("Delete handler failed:", err);
    }
  }


  async function handleApprove(initiativeId, reviewData) {
    if (!managerView) {
      alert("Only managers can approve initiatives.");
      return;
    }

    try {
      // 1. Run the backend logic
      await approveInitiative(councilId, initiativeId, reviewData);
      
      // 2. Clear the detail view first
      setSelectedInitiative(null);

      // 3. MANUAL CLEANUP: Force the local state to be unique
      // We filter the lists manually here to ensure that ID CANNOT exist in both places
      setCouncilData(prev => {
        const newInitiatives = [...(prev.initiatives || [])];
        // Only add if it's not already there
        if (!newInitiatives.some(i => i.id === initiativeId)) {
          const item = prev.pendingList.find(p => p.id === initiativeId);
          if (item) newInitiatives.push({ ...item, status: 'approved' });
        }

        return {
          ...prev,
          initiatives: newInitiatives,
          pendingList: (prev.pendingList || []).filter(p => p.id !== initiativeId)
        };
      });

      // 4. Wait for the server to catch up before refreshing
      setTimeout(() => refresh(), 1000);

    } catch (err) {
      console.error("Approval failed:", err);
    }
  }

  async function handleReject(initiativeId, feedbackData) {
    if (!managerView) {
      alert("Only managers can reject initiatives.");
      return;
    }

    try {
      // 1. Call the dataStore function
      await rejectInitiative(councilId, initiativeId, feedbackData);
      
      // 2. Refresh the UI data
      await refresh(); 
      
      // 3. Close the detail view (optional, but keeps things clean)
      setSelectedInitiative(null); 
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  }


  async function handleAddComment(comment) {
    if (!managerView) {
      alert("Only managers can comment on initiatives.");
      return;
    }

    if (!selectedInitiative) return;

    // 1. Wait for the comment to be saved to the database
    await addManagerComment(councilId, selectedInitiative.id, comment);
    
    // 2. Refresh the local state (this updates the list in the background)
    await refresh();

    // 3. Get the fresh data to update the "Selected Initiative" view
    const freshData = await getCouncilData(councilId);
    
    // Defensive check: Handle the D1 stringified data if necessary
    const parsed = freshData?.data && typeof freshData.data === 'string' 
      ? JSON.parse(freshData.data) 
      : freshData;

    const updated = (parsed?.initiatives || []).find(
      i => i.id === selectedInitiative.id
    );

    if (updated) {
      setSelectedInitiative(updated);
    }
  }

  async function handleMarkExecution(initiativeId, onTime, note) {
    try {
      if (!isPresidentUser) {
        alert("Only the council president can mark approved initiatives completed.");
        return;
      }

      const result = await markInitiativeExecution(councilId, initiativeId, onTime, note);
      if (!result.success) {
        alert(result.error || "Failed to mark initiative completed.");
        return;
      }
      await refresh();
      
      // Update the detail view to reflect the execution
      const freshData = await getCouncilData(councilId);
      const parsed = freshData?.data && typeof freshData.data === 'string' ? JSON.parse(freshData.data) : freshData;
      const updated = (parsed?.initiatives || []).find(i => i.id === initiativeId);
      if (updated) setSelectedInitiative(updated);
    } catch (err) {
      console.error("Failed to mark execution:", err);
    }
  }

// 1. Add deleteManagerComment to your imports
// 2. Add this function inside the CouncilPage component:

  async function handleDeleteComment(initiativeId, commentIndex) {
    if (!window.confirm("Delete this comment?")) return;
    
    try {
      const result = await deleteManagerComment(councilId, initiativeId, commentIndex);
      if (result.success) {
        // 1. Trigger the global refresh function you already use
        if (typeof refresh === 'function') {
          await refresh();
        }

        // 2. Fetch fresh data specifically to update the open detail modal
        const freshData = await getCouncilData(councilId);
        const updatedItem = freshData.initiatives.find(i => i.id === initiativeId);
        
        // Update the modal view
        setSelectedInitiative(updatedItem);
      }
    } catch (err) {
      console.error("UI Delete error:", err);
    }
  }

  async function handleSaveInfo(info) {
    if (!canManageCouncilInfo) return;

    const result = await saveCouncilInfo(councilId, {
      ...info,
      name: council.name,
      color: council.color,
      googleEmail: council.googleEmail,
    });
    if (!result.success) {
      alert(result.error || "Failed to save council information.");
      return;
    }
    await refresh();
  }
  async function handleRevert(initiativeId) {
        setIsLoading(true);
        try {
          const result = await revertToPending(councilId, initiativeId);
          if (result.success) {
            await refresh();
            setSelectedInitiative(null); // Close the detail view to refresh context
          }
        } catch (err) {
          console.error("Revert UI error:", err);
        } finally {
          setIsLoading(false);
        }
      }

  if (!council) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Council not found.</p>
    </div>
  );

  const impactScore = calculateImpactScore(councilData.info?.baseScore, councilData);
  const info = { ...council, ...councilInfo };

  // Merge padlets: store overrides static
  const mergedCouncil = { ...council, padlets: { ...council.padlets, ...(councilInfo?.padlets || {}) } };
  if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      );
    }
  return (
    <div className="min-h-screen bg-background">
      <Navbar session={session} />
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Council header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: council.color }}>
              {council.name[0]}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{council.name}</h1>
              <p className="text-xs text-muted-foreground line-clamp-1">{info.mission || council.mission}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              Impact Score: {impactScore}
            </span>
            {canManageInitiatives && !showForm && !selectedInitiative && tab === 'initiatives' && (
              <button
                onClick={() => { setEditingInitiative(null); setShowForm(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={12} /> New Initiative
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-border pb-0 flex-wrap">
          <TabBtn id="initiatives" active={tab} setTab={setTab} icon={<LayoutGrid size={12} />} label="Initiatives" />
          <TabBtn id="calendar" active={tab} setTab={setTab} icon={<Calendar size={12} />} label="Calendar" />
          <TabBtn id="padlet" active={tab} setTab={setTab} icon={<Layout size={12} />} label="Padlet" />
          <TabBtn id="drive" active={tab} setTab={setTab} icon={<HardDrive size={12} />} label="Drive" />
          <TabBtn id="info" active={tab} setTab={setTab} icon={<Settings size={12} />} label="Info" />
          {canManageCouncilInfo && <TabBtn id="strategy" active={tab} setTab={setTab} icon={<TrendingUp size={12} />} label="Strategy" />}
        </div>

        {tab === 'initiatives' && (
          <>
            {showForm ? (
              <InitiativeForm 
                initial={editingInitiative} 
                councilId={councilId} 
                council={mergedCouncil}
                onSave={handleSaveInitiative} 
                onCancel={() => {setShowForm(false);setEditingInitiative(null);}} 
              />
            ) : selectedInitiative ? (
              <InitiativeDetail 
                onRevert={handleRevert}
                initiative={selectedInitiative}
                onDeleteComment={handleDeleteComment}
                onReject={managerView ? handleReject : null} 
                onBack={() => setSelectedInitiative(null)}
                onEdit={canManageInitiatives ? (ini) => { setEditingInitiative(ini); setShowForm(true); setSelectedInitiative(null); } : null}
                isManager={managerView}
                isPresident={isPresidentUser}
                onAddComment={managerView ? handleAddComment : null}
                /* --- THESE MUST BE HERE FOR THE NETWORK CALLS TO WORK --- */
                onApprove={managerView ? handleApprove : null} 
                onMarkExecution={handleMarkExecution}
                /* -------------------------------------------------------- */
              />
            ) : (
              <InitiativeList
                initiatives={councilData.initiatives || []}
                pendingList={councilData.pendingList}
                onSelect={setSelectedInitiative}
                onDelete={canManageInitiatives ? handleDelete : null}
                
                /* List also needs these for the "Quick Approve" buttons */
                onApprove={managerView ? handleApprove : null}
                onReject={managerView ? handleReject : null}
                
                isManager={managerView}
                
              />
            )}
          </>
        )}

        {/* Calendar tab in CouncilPage.jsx */}
        {tab === 'calendar' && (
          <CalendarView 
            events={(councilData.initiatives || []).map(ini => ({
              id: ini.id,
              title: ini.title,
              date: ini.executionDate,
              // Pass the raw type; we will handle capitalization in the component
              type: ini.type 
            }))} 
            onAddInitiative={canManageInitiatives ? (dateStr) => {
              setEditingInitiative({ executionDate: dateStr });
              setShowForm(true);
              setTab('initiatives'); // optional: switch to initiatives tab to see the form
            } : null}
            onEventClick={(eventId) => {
              // Open the initiative detail view
              const initiative = (councilData.initiatives || []).find(i => i.id === eventId);
              if (initiative) {
                setSelectedInitiative(initiative);
                setTab('initiatives'); // Switch to initiatives tab to see details
              }
            }}
          />
        )}

        {/* Padlet tab */}
        {tab === 'padlet' && (
          <PadletTabs
            council={mergedCouncil}
            councilInfo={councilInfo}
            canManagePadlets={canManageCouncilInfo}
            onPadletsUpdated={refresh}
          />
        )}

        {/* Drive tab */}
        {tab === 'drive' && (
          <DriveSection councilId={councilId} councilName={council.name} session={session} />
        )}

        {/* Commons tab */}
        {/* Info tab */}
        {tab === 'info' && (
          <CouncilInfoEditor
            council={council}
            info={councilInfo}
            onSave={handleSaveInfo}
            canEdit={canManageCouncilInfo}
            isPresident={isPresidentUser}
            isManager={managerView}
          />
        )}

        {canManageCouncilInfo && tab === 'strategy' && (
          <StrategicManager 
            councilId={councilId} 
            data={councilData} 
            onRefresh={refresh} 
          />
        )}
      </div>
    </div>
  );
}

function TabBtn({ id, active, setTab, icon, label }) {
  return (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px
        ${active === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {icon} {label}
    </button>
  );
}
