import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Lightbulb, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Trash2, 
  CheckSquare, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CATEGORY_COLORS } from './TaskCard.jsx';

export const TaskDetailModal = ({ 
  task, 
  isOpen, 
  onClose, 
  onToggleSubtask, 
  onUpdateStatus, 
  onDelete 
}) => {
  if (!isOpen || !task) return null;

  const categoryStyle = CATEGORY_COLORS[task.category] || {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    bar: 'from-slate-500 to-slate-600',
    accent: 'text-slate-400'
  };

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const totalCount = subtasks.length;
  const isCompleted = task.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative glass-panel rounded-3xl max-w-2xl w-full border border-white/10 shadow-2xl p-6 sm:p-8 z-10 overflow-hidden animate-fadeIn">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-md border ${categoryStyle.badge}`}>
              {task.category}
            </span>

            {task.estimated_minutes && (
              <span className="text-xs font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{task.estimated_minutes} min duration</span>
              </span>
            )}

            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                aria-label="Task Status Selector"
                value={task.status}
                onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                className="text-xs font-medium bg-slate-900 text-slate-200 border border-white/15 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Title */}
        <h2 className={`text-xl sm:text-2xl font-bold text-white mb-2 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h2>

        {/* Original Raw Prompt */}
        {task.original_prompt && task.original_prompt !== task.title && (
          <p className="text-xs text-slate-400 mb-4 bg-slate-900/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 font-semibold mr-1">Raw Intent:</span>
            &ldquo;{task.original_prompt}&rdquo;
          </p>
        )}

        {/* AI Productivity Advisory Note */}
        {task.advisory_note && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/20 text-slate-200">
            <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Productivity Advisory</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              &ldquo;{task.advisory_note}&rdquo;
            </p>
          </div>
        )}

        {/* Subtasks Checklist */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/5">
            <span className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Actionable Checkpoints ({completedCount}/{totalCount})</span>
            </span>
            {totalCount > 0 && (
              <span className="font-mono text-indigo-300">
                {Math.round((completedCount / totalCount) * 100)}% Complete
              </span>
            )}
          </div>

          {subtasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 italic">
              No subtasks generated for this single-step task.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {subtasks.map((subtask) => {
                const subDone = subtask.status === 'completed';
                return (
                  <div
                    key={subtask.id}
                    onClick={() => onToggleSubtask(subtask.id, subDone ? 'pending' : 'completed')}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      subDone
                        ? 'bg-slate-900/30 border-white/5 text-slate-400'
                        : 'glass-input text-slate-200 hover:border-indigo-500/40'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 focus:outline-none"
                    >
                      {subDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-indigo-400 transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm ${subDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {subtask.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete task "${task.title}"?`)) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
