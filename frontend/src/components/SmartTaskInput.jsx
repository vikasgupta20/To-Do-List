import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight,
  SplitSquareVertical,
  Zap
} from 'lucide-react';
import { CreateTaskSchema } from '@shared/validators/task.validator.js';
import { createTaskPayload } from '../api/taskApi.js';

const SAMPLE_PROMPTS = [
  "Host a dinner party for 6 people this Saturday",
  "Prepare for quarterly product roadmap review",
  "Organize my garage workbench and tool storage",
  "Complete 45-minute high intensity interval workout",
  "Learn fundamentals of PostgreSQL Row Level Security"
];

export const SmartTaskInput = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [taskInput, setTaskInput] = useState('');
  const [needsBreakdown, setNeedsBreakdown] = useState(true);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setServerError('');

    // 1. Client-Side Zod Validation
    const validationResult = CreateTaskSchema.safeParse({
      raw_task_input: taskInput,
      needs_breakdown: needsBreakdown
    });

    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      setValidationError(issue ? issue.message : 'Invalid task description');
      return;
    }

    try {
      setLoading(true);
      const createdTask = await createTaskPayload({
        raw_task_input: validationResult.data.raw_task_input,
        needs_breakdown: validationResult.data.needs_breakdown
      });

      if (onSuccess) {
        onSuccess(createdTask);
      } else {
        // Redirect to detail page as specified in User Flow
        navigate(`/task/${createdTask.id}`);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to analyze and save task.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample) => {
    setTaskInput(sample);
    setValidationError('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-white/10">
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Create Smart Task</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                Gemini 2.5 Flash
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Type your raw intention. Gemini will categorize it, estimate duration, and explode it into subtasks.
            </p>
          </div>
        </div>

        {/* Validation / Server Errors */}
        {validationError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Validation Notice</p>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Processing Error</p>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Text Area */}
          <div>
            <label htmlFor="raw_task_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Raw Task Goal or Intention
            </label>
            <div className="relative">
              <textarea
                id="raw_task_input"
                name="raw_task_input"
                rows={4}
                disabled={loading}
                value={taskInput}
                onChange={(e) => {
                  setTaskInput(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="e.g., Organize my garage workbench, sort bolts, sweep floor, and donate unused tools..."
                className="w-full rounded-xl glass-input px-4 py-3.5 text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500">
                {taskInput.length}/500
              </div>
            </div>
          </div>

          {/* Quick Sample Prompts */}
          <div>
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Or try an inspiring prompt:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={loading}
                  onClick={() => handleSelectSample(sample)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-white/5 hover:border-indigo-500/30 transition-all text-left truncate max-w-full"
                >
                  &ldquo;{sample}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* AI Breakdown Toggle */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={needsBreakdown}
                disabled={loading}
                onChange={(e) => setNeedsBreakdown(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                  <SplitSquareVertical className="w-4 h-4 text-indigo-400" />
                  <span>AI Subtask Explosion</span>
                </span>
                <span className="text-xs text-slate-400">
                  Automatically decomposes complex project goals into 3&ndash;5 actionable checkpoints
                </span>
              </div>
            </label>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 ${
                loading
                  ? 'bg-indigo-700 cursor-wait shimmer-bg'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Gemini is synthesizing &amp; structuring your plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span>Analyze &amp; Create Task</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading shimmer overlay placeholder */}
        {loading && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3 animate-fadeIn">
            <div className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Synthesizing structured task plan...</span>
            </div>
            <div className="h-4 rounded-md shimmer-bg w-3/4" />
            <div className="h-3 rounded-md shimmer-bg w-1/2" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-8 rounded-lg shimmer-bg" />
              <div className="h-8 rounded-lg shimmer-bg" />
              <div className="h-8 rounded-lg shimmer-bg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
