import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ScrollText, BookOpen, PenTool, Target, Clock, 
  Users, TrendingUp, Settings, Video, Upload, Bell, X, 
  ArrowRight, Globe, Database, User, MapPin, Mail, Lock, 
  RefreshCw, CheckCircle, Quote, BrainCircuit, Search, 
  ChevronLeft, RotateCw, StickyNote, Save, ThumbsUp, AlertOctagon, 
  Link2Off, LogOut, Download, Trash2, ChevronRight,
  Play, AlertCircle
} from 'lucide-react';

import { StudyTimer } from './components/StudyTimer';
import { 
    generateStudyPlan, 
    generateStudyMaterial, 
    generateFlashcardsFromContent,
    correctEssay,
    generateDailyContent
} from './services/geminiService';
import { firebaseService } from './services/firebase'; 
import { 
  MOCK_STUDENTS, 
  MOCK_MATERIALS, 
  MOCK_MISSIONS,
  DEFAULT_ROUTINE,
  SYSTEM_CONFIG
} from './constants';
import { Student, StudySession, Mission, Material, Patent, Flashcard, EssayFeedback, PersonalNote } from './types';

// --- CONSTANTS ---
const ADMIN_EMAIL = "institutohopemdr@gmail.com";

// --- STORAGE KEYS ---
const STORAGE_KEYS = {
    STUDENTS: 'hope_students_v1',
    SESSIONS: 'hope_sessions_v1',
    MISSIONS: 'hope_missions_v1',
    APP_LOGO: 'hope_app_logo_v1',
    MATERIALS: 'hope_materials_v1',
    PERSONAL_NOTES: 'hope_personal_notes_v1',
    LAST_DAILY_UPDATE: 'HOPE_LAST_UPDATE_DATE'
};

// --- Logo Component ---
const HopeLogo = ({ size = 48, color = "#059669", customSrc = null }: { size?: number, color?: string, customSrc?: string | null }) => {
  if (customSrc) {
      return (
          <img 
            src={customSrc} 
            alt="Instituto Hope Logo" 
            style={{ width: size, height: size }} 
            className="object-contain drop-shadow-md rounded-lg"
          />
      );
  }
  const isGold = color === '#f59e0b';
  const isBlue = color === '#3b82f6';
  const primaryStart = isGold ? '#FCD34D' : isBlue ? '#60A5FA' : '#34D399';
  const primaryEnd = isGold ? '#B45309' : isBlue ? '#1E40AF' : '#065F46';
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
      <defs>
        <linearGradient id={`gradMain-${color}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryStart} />
          <stop offset="100%" stopColor={primaryEnd} />
        </linearGradient>
      </defs>
      <path d="M50 2L92 18V48C92 74 50 98 50 98C50 98 8 74 8 48V18L50 2Z" fill="#0F172A" stroke={`url(#gradMain-${color})`} strokeWidth="2"/>
      <path d="M50 6L88 20V48C88 71 50 94 50 94C50 94 12 71 12 48V20L50 6Z" fill={`url(#gradMain-${color})`} opacity="0.9"/>
      <path d="M50 30C50 30 65 20 75 25C80 27.5 75 35 70 40C70 40 85 45 80 60C75 75 60 65 50 80C40 65 25 75 20 60C15 45 30 40 30 40C25 35 20 27.5 25 25C35 20 50 30 50 30Z" fill="white"/>
    </svg>
  );
};

// --- Navigation Config ---
const NAV_ITEMS = [
    { path: '/', label: 'Base', icon: LayoutDashboard },
    { path: '/plan', label: 'Plano', icon: ScrollText },
    { path: '/library', label: 'Arsenal', icon: BookOpen }, 
    { path: '/essay', label: 'Redação', icon: PenTool }, 
    { path: '/missions', label: 'Missões', icon: Target }, 
    { path: '/study', label: 'Estudar', icon: Clock },
];

const MENTOR_NAV_ITEMS = [
    { path: '/', label: 'Comando', icon: LayoutDashboard },
    { path: '/students', label: 'Efetivo', icon: Users },
    { path: '/analytics', label: 'Inteligência', icon: TrendingUp },
    { path: '/settings', label: 'Config', icon: Settings },
];

const TEACHER_NAV_ITEMS = [
    { path: '/', label: 'Painel', icon: LayoutDashboard },
    { path: '/classes', label: 'Sala de Guerra', icon: Video },
    { path: '/upload', label: 'Arsenal', icon: Upload },
];

// --- Components ---
const NotificationToast = ({ message, onClose, link }: { message: string, onClose: () => void, link?: string }) => (
    <div className="fixed top-4 right-4 z-[150] animate-fadeInLeft max-w-sm w-full">
        <div className="bg-slate-800 border-l-4 border-red-600 rounded-lg shadow-2xl p-4 flex items-start gap-3 relative">
            <div className="bg-red-900/30 p-2 rounded-full">
                <Bell className="text-red-500 animate-pulse" size={20} />
            </div>
            <div className="flex-1">
                <h4 className="text-white font-bold uppercase text-sm mb-1">Atenção, Combatente!</h4>
                <p className="text-slate-300 text-xs mb-2">{message}</p>
                {link && (
                    <Link to={link} onClick={onClose} className="text-red-400 text-xs font-bold uppercase hover:text-white flex items-center gap-1">
                        Ir para Sala de Guerra <ArrowRight size={12}/>
                    </Link>
                )}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
    </div>
);

const NavItem = ({ to, icon: Icon, label }: any) => {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
            <Icon size={20} className={active ? 'text-emerald-500' : ''} />
            <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
        </Link>
    );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin, onRegister, onResetData, appLogo }: any) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", name: "", city: "", targetExam: "ESA", customTargetExam: "", role: "student" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Updated to check Gemini Key
    const hasSystemKey = (SYSTEM_CONFIG.GEMINI_API_KEY && SYSTEM_CONFIG.GEMINI_API_KEY.length > 5) || (typeof process !== 'undefined' && process.env?.API_KEY);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!formData.email.includes("@")) throw new Error("Insira um email válido.");
            if (isRegister) {
                if (!formData.name || !formData.password || !formData.city) throw new Error("Preencha todos os campos.");
                const finalExam = formData.targetExam === "Outro" ? formData.customTargetExam : formData.targetExam;
                await onRegister({ ...formData, targetExam: finalExam });
            } else {
                await onLogin(formData.email, formData.password);
            }
        } catch (err: any) {
            console.error(err);
            let msg = err.message || "Erro na autenticação.";
            if (msg.includes("auth/invalid-credential")) msg = "Email ou senha incorretos.";
            if (msg.includes("auth/email-already-in-use")) msg = "Email já cadastrado.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[100px] rounded-full"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[100px] rounded-full"></div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
                
                <div className="flex flex-col items-center mb-8">
                    <HopeLogo size={100} customSrc={appLogo} />
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest mt-4">Instituto Hope</h1>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Plataforma de Elite</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div className="flex gap-2 mb-4 p-1 bg-slate-900 rounded-xl">
                            <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${formData.role === 'student' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Aluno</button>
                            <button type="button" onClick={() => setFormData({...formData, role: 'mentor'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${formData.role === 'mentor' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Mentor</button>
                            <button type="button" onClick={() => setFormData({...formData, role: 'teacher'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${formData.role === 'teacher' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Professor</button>
                        </div>
                    )}
                    
                    {isRegister && (
                        <>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Nome de Guerra" />
                            <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Cidade" />
                        </>
                    )}
                    
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Email (Ex: aluno@hope.com)" />
                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Senha" />

                    {isRegister && formData.role === 'student' && (
                        <>
                            <select value={formData.targetExam} onChange={(e) => setFormData({...formData, targetExam: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none">
                                <option>ESA</option><option>EsPCEx</option><option>AFA</option><option>EAM</option><option>Outro</option>
                            </select>
                        </>
                    )}

                    {error && <div className="text-red-400 text-xs text-center font-bold bg-red-900/20 p-2 rounded-lg">{error}</div>}
                    
                    <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${formData.role === 'mentor' && isRegister ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        {loading ? <RefreshCw className="animate-spin" size={20}/> : isRegister ? 'Criar Conta' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-slate-400 hover:text-white text-xs font-bold uppercase underline decoration-slate-600 hover:decoration-white underline-offset-4 transition-all">
                        {isRegister ? 'Já tenho conta? Entrar' : 'Criar nova conta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SCREENS AND APP ---

const MentorDashboard = ({ students }: any) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase text-amber-500">Painel do General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="text-slate-400 text-xs uppercase font-bold">Total Alunos</h3>
                <p className="text-3xl font-black text-white">{students.length}</p>
            </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="text-slate-400 text-xs uppercase font-bold">Online Hoje</h3>
                <p className="text-3xl font-black text-emerald-500">{students.filter((s:any) => s.role === 'student').length}</p>
            </div>
        </div>
    </div>
);

const MentorStudentsList = ({ students }: any) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase text-amber-500">Efetivo do Batalhão</h2>
        <div className="grid gap-3">
            {students.filter((s:any) => s.role === 'student').map((s: Student) => (
                <div key={s.id} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700 hover:border-amber-500 transition-all">
                    <div className="flex items-center gap-3">
                        <img src={s.avatarUrl} className="w-10 h-10 rounded-full bg-slate-700" alt="" />
                        <div>
                            <p className="font-bold text-white">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.targetExam} • {s.patent}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-emerald-400 font-bold text-sm">{s.points} XP</p>
                        <p className="text-xs text-slate-500">{s.city}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const HomeScreen = ({ user }: { user: Student }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold uppercase text-white">Base Operacional</h2>
                <p className="text-slate-400 text-sm">Bem-vindo, {user.patent} {user.name}.</p>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-xs text-slate-500 font-bold uppercase">Meta Semanal</p>
                <p className="text-emerald-400 font-bold">{user.totalMinutes / 60} / {user.availableHoursPerDay * 7} horas</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-emerald-500 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-900/30 rounded-lg text-emerald-500"><Target size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Missões Cumpridas</p>
                        <p className="text-2xl font-black text-white">{user.missionsCompleted}</p>
                    </div>
                </div>
            </div>
             <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-amber-500 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-900/30 rounded-lg text-amber-500"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">XP Acumulado</p>
                        <p className="text-2xl font-black text-white">{user.points}</p>
                    </div>
                </div>
            </div>
             <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-900/30 rounded-lg text-blue-500"><BrainCircuit size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Dias em Sequência</p>
                        <p className="text-2xl font-black text-white">{user.streakDays}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Banner de Ação Rápida */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">Continuar Treinamento</h3>
                <p className="text-slate-300 text-sm mb-4 max-w-md">Sua próxima sessão está aguardando. Mantenha a disciplina para alcançar a aprovação.</p>
                <Link to="/study" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm transition-all shadow-lg hover:shadow-emerald-500/20">
                    <Play size={16} fill="currentColor" /> Iniciar Sessão
                </Link>
            </div>
        </div>
    </div>
);

const PlanScreen = ({ user, onUpdateUser }: { user: Student, onUpdateUser: (u: Student) => void }) => {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(user.aiStudyPlan ? JSON.parse(user.aiStudyPlan) : null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const jsonStr = await generateStudyPlan(user, []);
            const parsedPlan = JSON.parse(jsonStr);
            setPlan(parsedPlan);
            onUpdateUser({ ...user, aiStudyPlan: jsonStr, lastPlanUpdate: new Date().toISOString() });
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar plano. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold uppercase text-white">Plano de Campanha</h2>
                <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 text-emerald-400 hover:text-white text-sm font-bold uppercase border border-emerald-500/30 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-all">
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <RotateCw size={16} />}
                    {plan ? 'Regerar Estratégia' : 'Gerar Estratégia'}
                </button>
            </div>

            {!plan ? (
                <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                    <ScrollText size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-slate-300 font-bold mb-2">Nenhum plano ativo</h3>
                    <p className="text-slate-500 text-sm mb-6">A Inteligência Artificial pode criar um cronograma tático para você.</p>
                    <button onClick={handleGenerate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm transition-all shadow-lg">
                        Gerar Plano Agora
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                     <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-amber-500">
                        <p className="text-amber-500 text-xs font-bold uppercase mb-2">Lema da Semana</p>
                        <p className="text-xl font-serif italic text-white">"{plan.motto}"</p>
                    </div>
                    <div className="grid gap-4">
                        {plan.days?.map((day: any, idx: number) => (
                            <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                                    <h3 className="font-bold text-white text-lg">{day.day}</h3>
                                    <span className="text-xs text-emerald-400 font-bold uppercase bg-emerald-900/20 px-2 py-1 rounded">{day.focus}</span>
                                </div>
                                <div className="space-y-3">
                                    {day.activities?.map((act: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="min-w-[60px] text-slate-500 text-xs font-mono pt-1">{act.time}</div>
                                            <div className="flex-1 bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {act.type === 'study' ? <BookOpen size={14} className="text-blue-400"/> : 
                                                     act.type === 'break' ? <Clock size={14} className="text-slate-400"/> : 
                                                     <Target size={14} className="text-amber-400"/>}
                                                    <span className="font-bold text-slate-200 text-sm">{act.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">{act.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LibraryScreen = ({ user, materials, notes, onSaveNote }: any) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase text-white">Arsenal de Estudo</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {materials.map((mat: Material) => (
                    <div key={mat.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${mat.type === 'Video' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                {mat.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{mat.difficulty}</span>
                        </div>
                        <h3 className="font-bold text-white mb-2 line-clamp-2">{mat.title}</h3>
                        <p className="text-xs text-slate-400 mb-4">{mat.subject}</p>
                        <a href={mat.url} target="_blank" rel="noreferrer" className="w-full block text-center bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 py-2 rounded-lg text-xs font-bold uppercase transition-all">
                            Acessar Material
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EssayScreen = ({ user }: { user: Student }) => {
    const [text, setText] = useState("");
    const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCorrect = async () => {
        if (!text.trim()) return;
        setLoading(true);
        const result = await correctEssay(text, user.targetExam);
        setFeedback(result);
        setLoading(false);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold uppercase text-white">Redação Tática</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <textarea 
                        className="w-full h-[500px] bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 font-serif leading-relaxed resize-none"
                        placeholder="Escreva sua redação aqui..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={handleCorrect} 
                        disabled={loading || !text}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? <RefreshCw className="animate-spin"/> : <PenTool size={20} />}
                        Solicitar Correção
                    </button>
                </div>

                <div className="space-y-4">
                    {feedback ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full animate-fadeIn">
                             <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                                <h3 className="text-slate-400 text-sm font-bold uppercase">Nota Estimada</h3>
                                <div className="text-4xl font-black text-white">{feedback.score} <span className="text-base text-slate-500 font-normal">/ 1000</span></div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-amber-500 font-bold uppercase text-xs flex items-center gap-2"><AlertOctagon size={14}/> Pontos de Atenção</h4>
                                <ul className="space-y-2">
                                    {feedback.comments.map((comment, i) => (
                                        <li key={i} className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded border-l-2 border-amber-500/50">
                                            {comment}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                            <BrainCircuit size={48} className="mb-4 opacity-50"/>
                            <p className="font-bold">Aguardando texto</p>
                            <p className="text-sm mt-2 max-w-xs">A IA analisará gramática, coesão e estrutura conforme a banca {user.targetExam}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MissionsScreen = ({ user, missions }: { user: Student, missions: Mission[] }) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase text-white">Quadro de Missões</h2>
        <div className="grid gap-4">
            {missions.map(mission => (
                <div key={mission.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${mission.isCompleted ? 'bg-emerald-900/20 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}>
                            {mission.isCompleted ? <CheckCircle size={24} /> : <Target size={24} />}
                        </div>
                        <div>
                            <h3 className={`font-bold ${mission.isCompleted ? 'text-emerald-500 line-through' : 'text-white'}`}>{mission.title}</h3>
                            <p className="text-xs text-slate-400">{mission.description}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-amber-400 font-black text-lg">+{mission.points} XP</span>
                    </div>
                </div>
            ))}
             {missions.length === 0 && (
                <p className="text-slate-500 text-center py-8">Nenhuma missão ativa no momento, soldado.</p>
            )}
        </div>
    </div>
);

const StudyScreen = ({ user }: { user: Student }) => {
    const handleSessionComplete = (session: StudySession) => {
        // Here we would save the session
        console.log("Session saved:", session);
        // Maybe trigger a toast or context update
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-black uppercase text-white mb-2">Modo de Combate</h2>
                <p className="text-slate-400">Foco total. Desative as distrações.</p>
            </div>
            <StudyTimer 
                studentId={user.id} 
                studentName={user.name} 
                onSessionComplete={handleSessionComplete} 
            />
        </div>
    );
};

const MentorAnalytics = () => (
    <div className="flex items-center justify-center h-64 text-slate-500 flex-col gap-4">
        <TrendingUp size={48} />
        <p>Módulo de Inteligência em Desenvolvimento</p>
    </div>
);

const MentorSettings = ({ appLogo, onUpdateLogo, onResetData }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                localStorage.setItem(STORAGE_KEYS.APP_LOGO, base64);
                onUpdateLogo(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <h2 className="text-2xl font-bold uppercase text-white">Configurações do Comando</h2>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Settings size={18}/> Personalização</h3>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 overflow-hidden">
                        <HopeLogo size={64} customSrc={appLogo} color="#f59e0b" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 mb-2">Logo da Instituição</p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleLogoUpload}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                        >
                            Alterar Logo
                        </button>
                         {appLogo && (
                            <button 
                                onClick={() => {
                                    localStorage.removeItem(STORAGE_KEYS.APP_LOGO);
                                    onUpdateLogo(null);
                                }}
                                className="ml-2 text-red-400 hover:text-red-300 text-xs font-bold uppercase px-2"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 border-red-900/30">
                <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2"><AlertCircle size={18}/> Zona de Perigo</h3>
                <p className="text-slate-400 text-sm mb-4">Ações irreversíveis que afetam o armazenamento local.</p>
                <button 
                    onClick={onResetData}
                    className="border border-red-500/50 hover:bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2"
                >
                    <Trash2 size={16} /> Resetar Dados Locais
                </button>
            </div>
        </div>
    );
};

const TeacherDashboard = () => (
    <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Painel do Instrutor</h2>
        <p className="text-slate-400">Bem-vindo à sala dos professores.</p>
    </div>
);

const TeacherClasses = () => (
     <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Gerenciar Aulas</h2>
        <p className="text-slate-400">Funcionalidade de transmissão em breve.</p>
    </div>
);

const TeacherUpload = () => (
     <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Upload de Materiais</h2>
        <p className="text-slate-400">Adicione PDFs e Vídeos para a tropa.</p>
    </div>
);

export default function App() {
    const [user, setUser] = useState<Student | null>(null);
    const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
    const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
    const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
    const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
    const [appLogo, setAppLogo] = useState<string | null>(null);

    // Initial Loading
    useEffect(() => {
        const storedLogo = localStorage.getItem(STORAGE_KEYS.APP_LOGO);
        if (storedLogo) setAppLogo(storedLogo);
        
        // Se NÃO estiver configurado o Firebase, carrega do LocalStorage
        if (!firebaseService.isConfigured()) {
            const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
            if (storedStudents) setStudents(JSON.parse(storedStudents));
        } else {
            // Se estiver configurado e o usuário for MENTOR, inscreve para receber atualizações de alunos
            if (user?.role === 'mentor') {
                const unsub = firebaseService.subscribeToUsers((liveUsers) => {
                    setStudents(liveUsers);
                });
                return () => unsub();
            }
        }
    }, [user]);

    const handleLogin = async (email: string, pass: string) => {
        if (firebaseService.isConfigured()) {
            try {
                const firebaseUser = await firebaseService.login(email, pass);
                // Busca dados adicionais do usuário no Firestore
                // Nota: Em um app real, precisaria de um 'getDoc' aqui, mas o subscribe do mentor resolve a visualização
                // Vamos simular a criação do objeto usuário local
                const localProfile = students.find(s => s.email === email);
                
                if (localProfile) {
                     setUser(localProfile);
                } else {
                    // Fallback se o perfil ainda não carregou
                    const tempUser: Student = {
                        id: firebaseUser.uid,
                        name: firebaseUser.email?.split('@')[0] || "Usuário",
                        email: firebaseUser.email || "",
                        role: "student", status: "active", avatarUrl: "", targetExam: "ESA", 
                        polo: "Online", city: "Brasil", program: "Pré-Militar", patent: Patent.RECRUTA,
                        totalMinutes: 0, streakDays: 0, missionsCompleted: 0, points: 0, availableHoursPerDay: 4, weakSubjects: [], routine: DEFAULT_ROUTINE
                    };
                    setUser(tempUser);
                }
            } catch (e) {
                throw e;
            }
        } else {
            // LOGIN LOCAL (OFFLINE)
            const found = students.find(s => s.email === email);
            if (found) {
                setUser(found);
            } else {
                throw new Error("Usuário não encontrado (Modo Offline).");
            }
        }
    };

    const handleRegister = async (data: any) => {
        // --- SECURITY CHECK ---
        if (data.role === 'mentor' && data.email !== ADMIN_EMAIL) {
            throw new Error("Acesso negado: Apenas o email oficial pode criar conta de Mentor.");
        }

        if (firebaseService.isConfigured()) {
            const firebaseUser = await firebaseService.register(data.email, data.password);
            const newUser: Student = {
                id: firebaseUser.uid,
                ...data,
                status: 'active',
                avatarUrl: `https://ui-avatars.com/api/?name=${data.name}&background=059669&color=fff`,
                totalMinutes: 0, streakDays: 0, missionsCompleted: 0, points: 0,
                availableHoursPerDay: 4, weakSubjects: [], patent: Patent.RECRUTA, routine: DEFAULT_ROUTINE
            };
            
            // Salva no Firestore para o Mentor ver
            await firebaseService.saveDocument("users", newUser.id, newUser);
            setUser(newUser);
        } else {
            // REGISTRO LOCAL
            const newUser: Student = {
                id: `student-${Date.now()}`,
                ...data,
                status: 'active',
                avatarUrl: `https://ui-avatars.com/api/?name=${data.name}&background=059669&color=fff`,
                totalMinutes: 0, streakDays: 0, missionsCompleted: 0, points: 0,
                availableHoursPerDay: 4, weakSubjects: [], patent: Patent.RECRUTA, routine: DEFAULT_ROUTINE
            };
            const updated = [...students, newUser];
            setStudents(updated);
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
            setUser(newUser);
        }
    };

    const handleLogout = async () => {
        if (firebaseService.isConfigured()) await firebaseService.logout();
        setUser(null);
    }
    
    // ATUALIZAR DADOS DO USUÁRIO (Sincronizar com Firebase)
    const handleUpdateUser = async (updatedUser: Student) => {
        setUser(updatedUser);
        if (firebaseService.isConfigured()) {
            await firebaseService.saveDocument("users", updatedUser.id, updatedUser);
        } else {
            const updatedStudents = students.map(s => s.id === updatedUser.id ? updatedUser : s);
            setStudents(updatedStudents);
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
        }
    };

    const handleResetData = () => { if(window.confirm("Apagar dados locais?")) { localStorage.clear(); window.location.reload(); } };

    if (!user) return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} onResetData={handleResetData} appLogo={appLogo} />;
    
    // ... (rest of the render is same, just passing handleUpdateUser)
    
    return (
        <Router>
            <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HopeLogo size={32} color={user.role === 'mentor' ? '#f59e0b' : '#059669'} customSrc={appLogo} />
                        <div><h1 className="text-sm font-bold text-white uppercase">Instituto Hope</h1><p className="text-[10px] text-slate-400 font-mono">{user.role === 'mentor' ? 'COMANDO' : 'PLATAFORMA'}</p></div>
                    </div>
                    <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-slate-600" alt="Profile" />
                </header>

                <div className="flex pt-16 md:pt-0">
                    <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 bg-slate-800 border-r border-slate-700 flex-col z-40">
                         <div className="p-6 flex flex-col items-center border-b border-slate-700 relative group">
                             <HopeLogo size={64} color={user.role === 'mentor' ? '#f59e0b' : '#059669'} customSrc={appLogo} />
                             <h1 className="mt-4 font-black text-xl uppercase tracking-widest text-white text-center">Instituto Hope</h1>
                             <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">v2.4.0 • {user.role === 'mentor' ? 'General' : user.role === 'teacher' ? 'Instrutor' : 'Recruta'}</div>
                         </div>
                         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                             {(user.role === 'mentor' ? MENTOR_NAV_ITEMS : user.role === 'teacher' ? TEACHER_NAV_ITEMS : NAV_ITEMS).map((item) => <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />)}
                         </nav>
                         <div className="p-4 border-t border-slate-700">
                             <div className="flex items-center gap-3 mb-4 px-2"><img src={user.avatarUrl} className="w-10 h-10 rounded-lg border border-slate-600" alt="" /><div className="flex-1 overflow-hidden"><p className="text-sm font-bold text-white truncate">{user.name}</p><p className="text-xs text-slate-500 truncate capitalize">{user.role}</p></div></div>
                             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2 rounded-lg transition-colors text-xs font-bold uppercase"><LogOut size={14} /> Sair</button>
                         </div>
                    </aside>

                    <main className="flex-1 md:ml-64 min-h-screen p-4 md:p-8 overflow-x-hidden pb-24 md:pb-8">
                        <Routes>
                             {user.role === 'student' ? (
                                 <>
                                     <Route path="/" element={<HomeScreen user={user} />} />
                                     <Route path="/plan" element={<PlanScreen user={user} onUpdateUser={handleUpdateUser} />} />
                                     <Route path="/library" element={<LibraryScreen user={user} materials={materials} notes={personalNotes} onSaveNote={(note:any) => setPersonalNotes([...personalNotes, note])} />} />
                                     <Route path="/essay" element={<EssayScreen user={user} />} />
                                     <Route path="/missions" element={<MissionsScreen user={user} missions={missions} />} />
                                     <Route path="/study" element={<StudyScreen user={user} />} />
                                 </>
                             ) : user.role === 'mentor' ? (
                                 <>
                                     <Route path="/" element={<MentorDashboard students={students} />} />
                                     <Route path="/students" element={<MentorStudentsList students={students} />} />
                                     <Route path="/analytics" element={<MentorAnalytics />} />
                                     <Route path="/settings" element={<MentorSettings appLogo={appLogo} onUpdateLogo={setAppLogo} onResetData={handleResetData} />} />
                                 </>
                             ) : (
                                 <>
                                     <Route path="/" element={<TeacherDashboard />} />
                                     <Route path="/classes" element={<TeacherClasses />} />
                                     <Route path="/upload" element={<TeacherUpload />} />
                                 </>
                             )}
                        </Routes>
                    </main>

                    <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around p-2 z-50 pb-safe">
                        {(user.role === 'mentor' ? MENTOR_NAV_ITEMS : user.role === 'teacher' ? TEACHER_NAV_ITEMS : NAV_ITEMS).slice(0, 5).map((item) => <Link key={item.path} to={item.path} className="flex flex-col items-center p-2 text-slate-500 hover:text-emerald-500"><item.icon size={20} /><span className="text-[9px] font-bold uppercase mt-1">{item.label}</span></Link>)}
                    </nav>
                </div>
            </div>
        </Router>
    );
}