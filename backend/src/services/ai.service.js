import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== 'your_google_gemini_key_here') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('[Gemini SDK Init Error]', err.message);
  }
} else {
  console.warn('⚠️  GEMINI_API_KEY is not set. AI tasks will use intelligent heuristic simulation until a key is added in .env.');
}

const SYSTEM_INSTRUCTION = 
  "You are an expert productivity coach and project manager. " +
  "Your job is to take raw user intentions and turn them into highly structured, actionable, and categorized project plans. " +
  "Be extremely concise. Base your time estimates on realistic human pacing. Always return valid JSON.";

const taskSchema = {
  type: "OBJECT",
  properties: {
    clean_title: { 
      type: "STRING", 
      description: "A concise, action-oriented title for the task." 
    },
    category: { 
      type: "STRING", 
      enum: ["Deep Work", "Admin/Shallow Work", "Errands/Chores", "Learning/Growth", "Personal/Health"] 
    },
    estimated_minutes: { 
      type: "INTEGER", 
      description: "Realistic time to complete everything in minutes." 
    },
    advisory_note: { 
      type: "STRING", 
      description: "Max 2 sentences of productivity advice." 
    },
    subtasks: {
      type: "ARRAY",
      items: { type: "STRING", description: "Actionable, clear subtask." },
      description: "3 to 5 logical subtasks to complete the main goal."
    }
  },
  required: ["clean_title", "category", "estimated_minutes", "advisory_note", "subtasks"]
};

/**
 * Intelligent local fallback when Gemini API key is omitted in development
 */
const generateHeuristicBreakdown = (rawInput, needsBreakdown) => {
  const lower = rawInput.toLowerCase();
  let category = 'Deep Work';
  let estimated_minutes = 45;
  let advisory_note = 'Break this into focused 25-minute sprints with 5-minute pauses for peak mental clarity.';

  if (lower.includes('email') || lower.includes('schedule') || lower.includes('call') || lower.includes('invoice') || lower.includes('paperwork') || lower.includes('admin')) {
    category = 'Admin/Shallow Work';
    estimated_minutes = 20;
    advisory_note = 'Batch similar administrative items together to minimize context switching.';
  } else if (lower.includes('clean') || lower.includes('grocery') || lower.includes('buy') || lower.includes('errand') || lower.includes('garage') || lower.includes('shop') || lower.includes('dinner') || lower.includes('party')) {
    category = 'Errands/Chores';
    estimated_minutes = 60;
    advisory_note = 'Gather all necessary supplies and route your locations before beginning.';
  } else if (lower.includes('read') || lower.includes('course') || lower.includes('learn') || lower.includes('study') || lower.includes('practice') || lower.includes('tutorial')) {
    category = 'Learning/Growth';
    estimated_minutes = 50;
    advisory_note = 'Take active notes and summarize core takeaways immediately after completing this session.';
  } else if (lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('meditat') || lower.includes('meal') || lower.includes('doctor') || lower.includes('health')) {
    category = 'Personal/Health';
    estimated_minutes = 40;
    advisory_note = 'Prioritize consistent form and hydration throughout your session.';
  }

  // Format clean title
  const clean_title = rawInput.length > 50 
    ? rawInput.slice(0, 47).trim() + '...' 
    : rawInput.charAt(0).toUpperCase() + rawInput.slice(1).trim();

  let subtasks = [];
  if (needsBreakdown) {
    if (category === 'Errands/Chores') {
      subtasks = [
        'Prepare checklist of items and tools needed',
        'Execute first stage of organizing / shopping',
        'Clean up workspace and review final results'
      ];
    } else if (category === 'Deep Work') {
      subtasks = [
        'Define core deliverable and eliminate distractions',
        'Draft the core architecture or content draft',
        'Review, refine, and verify quality'
      ];
    } else if (category === 'Admin/Shallow Work') {
      subtasks = [
        'Collect relevant contact info or reference documents',
        'Process and reply to pending correspondence',
        'Confirm calendar commitments and file records'
      ];
    } else if (category === 'Learning/Growth') {
      subtasks = [
        'Review outline and target learning objectives',
        'Study material attentively without multitasking',
        'Write a quick 3-bullet summary of lessons learned'
      ];
    } else {
      subtasks = [
        'Warm up and prepare your space or equipment',
        'Execute the main planned activity with steady focus',
        'Cool down, hydrate, and log progress'
      ];
    }
  }

  return {
    clean_title,
    category,
    estimated_minutes,
    advisory_note,
    subtasks
  };
};

/**
 * Analyzes raw task input and generates structured breakdown using Gemini 2.5 Flash
 * with strict JSON schema compliance.
 */
export const analyzeTask = async (taskPrompt, needsBreakdown = true) => {
  // If no Gemini client or API key, use heuristic generator
  if (!ai) {
    return generateHeuristicBreakdown(taskPrompt, needsBreakdown);
  }

  try {
    const userPrompt = `Analyze and break down the following task: ${taskPrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: taskSchema,
        temperature: 0.2
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsed = JSON.parse(responseText);

    // If user explicitly chose not to break down into subtasks, empty the subtasks array
    if (!needsBreakdown) {
      parsed.subtasks = [];
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini AI Service Error]', error.message);
    // Graceful fallback so task creation doesn't fail if Gemini API is temporarily rate-limited
    console.warn('[Gemini AI Fallback] Generating heuristic breakdown due to API error.');
    return generateHeuristicBreakdown(taskPrompt, needsBreakdown);
  }
};
