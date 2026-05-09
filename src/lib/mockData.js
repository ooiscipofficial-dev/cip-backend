import { councilApi } from '../api/councilApi';

export const CURRENT_ACADEMIC_YEAR = "2026-27";

// ─── Council Definitions (Required for UI Dropdowns/Colors) ──────────────────
export const COUNCILS_DATA = [
  { id:"academic-council",         name:"Academic Council",           color:"#6366f1", googleEmail:"oois.academic@gmail.com" },
  { id:"literary-council",         name:"Literary Council",           color:"#f59e0b", googleEmail:"oois.literary@gmail.com" },
  { id:"discipline-council",       name:"Discipline Council",         color:"#ef4444", googleEmail:"oois.discipline@gmail.com" },
  { id:"innovation-tech-council",  name:"Innovation & Tech Council",  color:"#10b981", googleEmail:"oois.innotech@gmail.com" },
  { id:"media-pr-council",         name:"Media & PR Council",         color:"#8b5cf6", googleEmail:"oois.media@gmail.com" },
  { id:"wellbeing-council",        name:"Wellbeing Council",          color:"#ec4899", googleEmail:"oois.wellbeing@gmail.com" },
  { id:"environment-council",      name:"Environment Council",        color:"#16a34a", googleEmail:"oois.environment@gmail.com" },
  { id:"sports-council",           name:"Sports Council",             color:"#f97316", googleEmail:"oois.sports@gmail.com" },
  { id:"cultural-council",         name:"Cultural Council",           color:"#c026d3", googleEmail:"oois.cultural@gmail.com" },
  { id:"aries-house",              name:"Aries House",                color:"#f43f5e", type:"house", googleEmail:"oois.aries@gmail.com" },
  { id:"aquarius-house",           name:"Aquarius House",             color:"#0ea5e9", type:"house", googleEmail:"oois.aquarius@gmail.com" },
  { id:"leo-house",                name:"Leo House",                  color:"#eab308", type:"house", googleEmail:"oois.leo@gmail.com" },
  { id:"taurus-house",             name:"Taurus House",               color:"#84cc16", type:"house", googleEmail:"oois.taurus@gmail.com" },
];

export const MEMBER_ROLES = ["President", "Secretary", "Deputy Secretary", "Council Junior"];

// ─── Member Credentials API (Synced with Worker) ──────────────────────────────

export async function getMemberCredentials(councilId) {
  const data = await councilApi.getMembers(councilId);
  return data || {};
}

export async function setMemberCredentials(councilId, creds) {
  // Pass to worker to save in D1
  await councilApi.syncMembers(councilId, creds);
}

// Keep this template for the UI when creating new initiatives
export const INITIATIVE_TEMPLATE = {
  id: "", title: "", description: "", objectives: "", expectedOutcomes: "", summary: "",
  initiativeType: "one-time", executionDate: "", executedOnTime: null, successNote: "",
  lead: { name: "", role: "Student Initiative Lead", class: "", section: "", imageUrl: "" },
  contributors: [],
  execution: [
    { phase: "Planning",            note: "", status: "Not Started" },
    { phase: "Execution",           note: "", status: "Not Started" },
    { phase: "Feedback Collection", note: "", status: "Not Started" },
  ],
  progressReports: [], managerComments: [], calendarEvents: [], isSuccessful: false,
};
export const GLOBAL_PADLET = "https://padlet.com/your-school-link"; // Replace with your actual URL