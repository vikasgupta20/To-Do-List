import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ChevronRight, 
  Lightbulb, 
  PlayCircle,
  ListTodo
} from 'lucide-react';

export const CATEGORY_COLORS = {
  'Deep Work': {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    bar: 'from-indigo-500 to-indigo-600',
    accent: 'text-indigo-400',
    border: 'hover:border-indigo-500/40'
  },
  'Admin/Shallow Work': {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    bar: 'from-sky-500 to-sky-600',
    accent: 'text-sky-400',
    border: 'hover:border-sky-500/40'
  },
  'Errands/Chores': {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'from-amber-500 to-amber-600',
    accent: 'text-amber-400',
    border: 'hover:border-amber-500/40'
  },
  'Learning/Growth': {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bar: 'from-emerald-500 to-emerald-600',
    accent: 'text-emerald-400',
    border: 'hover:border-emerald-500/40'
  },
  'Personal/Health': {
    badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    bar: 'from-pink-500 to-pink-600',
    accent: 'text-pink-400',
    border: 'hover:border-pink-500/40'
  }
};

export const TaskCard = ({ task, onStatusChange, onDelete, onOpenModal }) => {
  const categoryStyle = CATEGORY_COLORS[task.category] || {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    bar: 'from-slate-500 to-slate-600',
    accent: 'text-slate-400',
    border: 'hover:border-slate-500/40'
  };

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  // Subtask completion stats
  const totalSubtasks = task.total_subtasks !== undefined 
    ? Number(task.total_subtasks) 
    : (Array.isArray(task.subtasks) ? task.subtasks.length : 0);
  const completedSubtasks = task.completed_subtasks !== undefined 
    ? Number(task.completed_subtasks) 
    : (Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.status === 'completed').length : 0);

  const completionPercentage = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : (isCompleted ? 100 : 0);

  const handleNextStatus = (e) => {
    e.stopPropagation();
    let nextStatus = 'in_progress';
    if (task.status === 'pending') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'pending';

    onStatusChange(task.id, nextStatus);
  };

  return (
    <div
      onClick={() => onOpenModal ? onOpenModal(task) : null}
      className={`glass-card rounded-2xl p-5 border flex flex-col justify-between group cursor-pointer transition-all ${categoryStyle.border} ${
        isCompleted ? 'opacity-70 bg-slate-900/40' : ''
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md border ${categoryStyle.badge}`}>
            {task.category}
          </span>

          <div className="flex items-center space-x-2">
            {task.estimated_minutes && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.estimated_minutes}m</span>
              </span>
            )}

            {/* Quick Status Indicator */}
            <button
              type="button"
              onClick={handleNextStatus}
              title={`Click to cycle status. Current: ${task.status}`}
              className="text-xs px-2 py-0.5 rounded-full font-medium transition-transform active:scale-95 flex items-center space-x-1 border"
              style={{
                backgroundColor: isCompleted ? 'rgba(52, 211, 153, 0.1)' : isInProgress ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                borderColor: isCompleted ? 'rgba(52, 211, 153, 0.25)' : isInProgress ? 'rgba(99, 102, 241, 0.25)' : 'rgba(148, 163, 184, 0.2)',
                color: isCompleted ? '#34d399' : isInProgress ? '#818cf8' : '#94a3b8'
              }}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Done</span>
                </>
              ) : isInProgress ? (
                <>
                  <PlayCircle className="w-3 h-3 text-indigo-400" />
                  <span>Doing</span>
                </>
              ) : (
                <>
                  <Circle className="w-3 h-3 text-slate-400" />
                  <span>To Do</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3 className={`text-base font-semibold text-slate-100 group-hover:text-white transition-colors mb-2 line-clamp-2 ${
          isCompleted ? 'line-through text-slate-400' : ''
        }`}>
          {task.title}
        </h3>

        {/* AI Advisory Note snippet */}
        {task.advisory_note && (
          <div className="mb-4 text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-white/5 flex items-start space-x-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 italic">{task.advisory_note}</p>
          </div>
        )}
      </div>

      {/* Footer / Subtasks Progress */}
      <div className="pt-3 border-t border-white/5 space-y-3">
        {totalSubtasks > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                <span>Checkpoints</span>
              </span>
              <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${categoryStyle.bar} transition-all duration-300`} 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to={`/task/${task.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group/link"
          >
            <span>Open Details</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete task "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Delete task"
            className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
