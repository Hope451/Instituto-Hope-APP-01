
export enum Patent {
  RECRUTA = "Recruta",
  SOLDADO = "Soldado",
  CABO = "Cabo",
  SARGENTO = "Sargento",
  SUBTENENTE = "Subtenente",
  ASPIRANTE = "Aspirante",
  TENENTE = "Tenente",
  CAPITAO = "Capitão",
  GENERAL = "General" // Added for Mentor
}

export interface Commitment {
  id: string;
  day: string; // "Segunda", "Terça", etc. or "Todos"
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  title: string; // "Escola", "Trabalho"
}

export interface StudentRoutine {
  wakeUpTime: string;
  sleepTime: string;
  focusTimeMinutes: number; // e.g. 50
  commitments: Commitment[];
}

// --- New AI Plan Structures ---
export interface PlanActivity {
  time: string;
  type: 'study' | 'break' | 'mission' | 'routine';
  title: string;
  description: string;
  durationMinutes: number;
}

export interface PlanDay {
  day: string; // "Segunda", "Terça"
  focus: string; // e.g. "Matemática e Foco"
  activities: PlanActivity[];
}

export interface AIStudyPlanStructured {
  motto: string;
  weeklyGoal: string;
  days: PlanDay[];
}

// --- New AI Content Structures ---
export interface Flashcard {
  front: string;
  back: string;
}

export interface EssayFeedback {
  score: number;
  comments: string[];
  correctedText?: string;
}

export interface GeneratedContent {
  title: string;
  markdownContent: string;
}

export interface MaterialFeedback {
    id: string;
    studentId: string;
    materialId: string;
    type: 'useful' | 'hard' | 'broken';
    timestamp: string;
}

export interface PersonalNote {
    id: string;
    studentId: string;
    materialId: string;
    content: string;
    updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string; // Added for login
  role: 'student' | 'mentor' | 'teacher'; // Added teacher role
  status: 'active' | 'pending'; // Added for teacher approval flow
  avatarUrl: string;
  targetExam: string; // e.g., "ESA", "EsPCEx"
  polo: string; // e.g., "RJ - Madureira"
  city: string; // Added City field
  program: "Pré-Militar" | "Outro";
  patent: Patent;
  totalMinutes: number;
  streakDays: number;
  missionsCompleted: number;
  points: number; // Calculated from minutes + missions
  
  // AI Integration Fields
  aiStudyPlan?: string; // Storing the JSON string here
  recommendedMaterialIds?: string[]; // IDs of materials picked by IA
  availableHoursPerDay: number;
  weakSubjects: string[];
  lastPlanUpdate?: string; // ISO Date
  
  // New Routine Field
  routine?: StudentRoutine;
}

export interface StudySession {
  id: string;
  studentId: string;
  program: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string or null if active
  subject: string;
  minutesLogged: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  isCompleted: boolean;
  studentId: string;
}

export interface Material {
  id: string;
  title: string;
  type: "PDF" | "Video" | "Simulado";
  subject: string;
  url: string; // Used as context prompt for AI now
  program: "Pré-Militar" | "Outro";
  difficulty: "Básico" | "Intermediário" | "Avançado";
}

export interface LiveClass {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  status: "Scheduled" | "Live" | "Ended";
  videoUrl: string;
  viewers?: number;
}

export interface StudyRoom {
    id: string;
    name: string;
    creatorId: string;
    participants: string[]; // student IDs
}
