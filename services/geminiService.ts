import { GoogleGenAI } from "@google/genai";
import { Student, Material, Flashcard, EssayFeedback } from "../types";
import { SYSTEM_CONFIG } from "../constants";

// --- MOTOR GOOGLE GEMINI ---
const getAI = () => {
    // Tenta pegar do ambiente (Vercel) ou do arquivo de constantes
    const key = process.env.API_KEY || SYSTEM_CONFIG.GEMINI_API_KEY;
    if (!key || key.length < 5) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- 1. Conselho Tático (Feedback Pós-Estudo) ---
export const getTacticalAdvice = async (
  studentName: string, 
  subject: string, 
  duration: number
): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Bom trabalho! Continue firme. (IA Offline)";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um instrutor militar rígido mas motivador do Instituto Hope. O aluno ${studentName} estudou ${subject} por ${duration} minutos. Dê um feedback curto e direto (máximo 1 frase) estilo militar.`
    });
    return response.text || "Mantenha a disciplina.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Mantenha a disciplina. (Erro de conexão)";
  }
};

// --- 2. Gerador de Plano de Estudos ---
export const generateStudyPlan = async (student: Student, materials: Material[]): Promise<string> => {
  const ai = getAI();
  // Retorna um fallback seguro se não tiver chave
  if (!ai) return JSON.stringify({ motto: "Disciplina é Liberdade (IA Offline)", weeklyGoal: "Cumprir o horário", days: [] });

  const routine = student.routine || { wakeUpTime: "06:00", sleepTime: "22:00", focusTimeMinutes: 50, commitments: [] };
  
  const prompt = `
    Crie um plano semanal JSON para um aluno militar.
    Acorda: ${routine.wakeUpTime}, Dorme: ${routine.sleepTime}.
    Foco: ${routine.focusTimeMinutes} min/sessão.
    Prioridade: ${student.weakSubjects?.join(", ") || "Matemática Básica"}.
    
    Responda APENAS com um JSON válido seguindo este esquema exato:
    {
        "motto": "uma frase curta militar motivacional",
        "weeklyGoal": "uma meta clara para a semana",
        "days": [
            { 
                "day": "Segunda", 
                "focus": "Foco do dia (ex: Matéria X)", 
                "activities": [
                    { "time": "08:00", "type": "study", "title": "Matéria", "description": "Tópico específico", "durationMinutes": 60 }
                ] 
            }
        ]
    }
    Gere atividades para a semana toda (Segunda a Domingo).
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    return response.text || "";
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return JSON.stringify({ motto: "Erro na IA", weeklyGoal: "Tente novamente", days: [] });
  }
};

// --- 3. Gerador de Conteúdo da Biblioteca ---
export const generateStudyMaterial = async (title: string, subject: string, exam: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return `# ${title}\nErro: Chave API não configurada. Configure no arquivo constants.ts`;

    const prompt = `Escreva uma aula completa sobre "${title}" (${subject}) para a prova ${exam}. 
    Use formatação Markdown rica: Títulos (##), Negrito (**), Listas.
    Inclua:
    1. Teoria Resumida e Direta
    2. O que a banca cobra (Bizus)
    3. Exemplo prático resolvido.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Erro ao gerar conteúdo.";
    } catch (error) {
        return "Erro de conexão com o QG de Inteligência.";
    }
};

// --- 4. Gerador de Flashcards ---
export const generateFlashcardsFromContent = async (topic: string): Promise<Flashcard[]> => {
    const ai = getAI();
    if (!ai) return [];

    const prompt = `Crie 5 flashcards de estudo sobre "${topic}".
    Retorne apenas JSON no formato: { "cards": [{ "front": "pergunta", "back": "resposta curta" }] }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || "{}");
        return json.cards || [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

// --- 5. Corretor de Redação ---
export const correctEssay = async (text: string, exam: string): Promise<EssayFeedback> => {
    const ai = getAI();
    if (!ai) return { score: 0, comments: ["IA Offline - Configure a chave API"], correctedText: text };

    const prompt = `Corrija esta redação para o concurso ${exam}. Seja rigoroso.
    Texto: "${text}".
    
    Retorne JSON:
    {
        "score": (nota de 0 a 1000),
        "comments": ["comentario crítico 1", "comentario crítico 2", "ponto positivo"],
        "correctedText": "versão melhorada do texto se necessário"
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { score: 0, comments: ["Erro ao processar correção."], correctedText: text };
    }
};

// --- 6. Recomendação de Materiais ---
export const getRecommendedLibrary = async (student: Student, materials: Material[]): Promise<string[]> => {
    // Simples filtro local por enquanto para economizar tokens
    return materials.slice(0, 3).map(m => m.id);
}

// --- 7. Atualização Diária ---
export const generateDailyContent = async (targetExam: string): Promise<Material[]> => {
    const ai = getAI();
    if (!ai) return [];

    const prompt = `Gere 3 tópicos de estudo essenciais para passar na ${targetExam} hoje.
    Retorne JSON: { "items": [{ "title": "Titulo do Tópico", "subject": "Materia", "difficulty": "Básico" }] }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || "{}");
        return json.items?.map((item: any) => ({
            id: `auto-${Date.now()}-${Math.random()}`,
            title: item.title,
            subject: item.subject,
            difficulty: item.difficulty,
            type: "PDF",
            url: "#",
            program: "Pré-Militar"
        })) || [];
    } catch (e) {
        return [];
    }
};