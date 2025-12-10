import { Student, Patent, StudySession, Mission, Material, LiveClass } from './types';

// ==================================================================================
// ⚙️ CONFIGURAÇÃO DO SISTEMA
// ==================================================================================
export const SYSTEM_CONFIG = {
  // 1. INTELIGÊNCIA ARTIFICIAL (GOOGLE GEMINI) - ATIVADO
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY, 

  // 2. BANCO DE DADOS (FIREBASE)
  // Configuração automática baseada nos dados fornecidos
  FIREBASE_CONFIG: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  },

  INSTITUTION_NAME: "Instituto Hope",
  API_BASE_URL: ""
};

export const DEFAULT_ROUTINE = {
  wakeUpTime: "05:30",
  sleepTime: "22:00",
  focusTimeMinutes: 50,
  commitments: [
    { id: "c1", day: "Segunda", startTime: "07:00", endTime: "12:00", title: "Ensino Médio" },
    { id: "c2", day: "Quarta", startTime: "19:00", endTime: "21:00", title: "Treino Físico (TAF)" },
  ]
};

// DADOS DE EXEMPLO (Só aparecem se o Firebase estiver vazio ou desconectado)
export const MOCK_STUDENTS: Student[] = [
  {
    id: "mentor-01",
    name: "Comando Hope",
    email: "institutohopemdr@gmail.com", // Email oficial admin
    role: "mentor",
    status: "active",
    avatarUrl: "https://ui-avatars.com/api/?name=Comando+Hope&background=F59E0B&color=fff",
    targetExam: "Geral",
    polo: "QG Central",
    city: "Rio de Janeiro",
    program: "Pré-Militar",
    patent: Patent.GENERAL,
    totalMinutes: 0,
    streakDays: 999,
    missionsCompleted: 0,
    points: 99999,
    availableHoursPerDay: 24,
    weakSubjects: [],
    routine: DEFAULT_ROUTINE
  }
];

export const MOCK_MATERIALS: Material[] = [
  {
    id: "mat-001",
    title: "Logaritmos: Do Básico ao Avançado",
    type: "Video",
    subject: "Matemática",
    url: "https://youtube.com", 
    program: "Pré-Militar",
    difficulty: "Intermediário"
  },
  {
    id: "sim-001",
    title: "Simulado ESA 2024 - Gabaritado",
    type: "Simulado",
    subject: "Geral",
    url: "#",
    program: "Pré-Militar",
    difficulty: "Avançado"
  }
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: "m-01",
    title: "Operação Alvorada",
    description: "Realizar 50 minutos de estudo antes das 10:00 da manhã.",
    points: 100,
    isCompleted: false,
    studentId: "temp"
  }
];

export const MOCK_SESSIONS: StudySession[] = [];
export const MOCK_LIVE_CLASSES: LiveClass[] = [];