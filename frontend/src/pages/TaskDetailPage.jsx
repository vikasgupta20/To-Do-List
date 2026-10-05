import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  fetchTaskById, 
  updateTaskStatus, 
  updateSubtaskStatus, 
  deleteTask 
} from '../api/taskApi.js';
import { CATEGORY_COLORS } from '../components/TaskCard.jsx';
import { 
  ArrowLeft, 
  Clock, 
  Lightbulb, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Sparkles, 
  CheckSquare, 
  Layers, 
  AlertCircle,
  Loader2,
  Calendar,
  Share2
} from 'lucide-react';

export const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTaskById(id);
      setTask(data);
    } catch (err) {
      setError(err.message || 'Task not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      // Optimistic update
      setTask(prev => {
        if (!prev) return null;
        const newSubs = prev.subtasks.map(s => s.id === subtaskId ? { ...s, status: nextStatus } : s);
        const allDone = newSubs.every(s => s.status === 'completed');
        return {
          ...prev,
          status: allDone ? 'completed' : prev.status,
          subtasks: newSubs
        };
      });

      const response = await updateSubtaskStatus(subtaskId, nextStatus);
      if (response && response.parentTask) {
        setTask(prev => ({
          ...prev,
          ...response.parentTask,
          subtasks: prev.subtasks
        }));
      }
    } catch (err) {
      alert(`Could not toggle subtask: ${err.message}`);
      loadTask();
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
      await updateTaskStatus(id, newStatus);
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
      loadTask();
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task?.title}"?`)) {
      try {
        await deleteTask(id);
        navigate('/');
      } catch (err) {
        alert(`Could not delete task: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading task details &amp; AI breakdown...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-xl mx-auto glass-panel p-8 rounded-3xl border border-rose-500/20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Task Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'Task could not be located.'}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const categoryStyle = CATEGORY_COLORS[task.category] || {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    bar: 'from-slate-500 to-slate-600',
    accent: 'text-slate-400'
  };

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const isCompleted = task.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Task</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border ${categoryStyle.badge}`}>
              {task.category}
            </span>

            {task.estimated_minutes && (
              <span className="text-xs font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{task.estimated_minutes} min duration</span>
              </span>
            )}
          </div>

          {/* Status Switcher Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              aria-label="Change Task Status"
              value={task.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="pending" className="bg-slate-900">Pending</option>
              <option value="in_progress" className="bg-slate-900">In Progress</option>
              <option value="completed" className="bg-slate-900">Completed</option>
            </select>
          </div>
        </div>

        {/* Task Title */}
        <h1 className={`text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight ${
          isCompleted ? 'line-through text-slate-400' : ''
        }`}>
          {task.title}
        </h1>

        {/* Raw Intent */}
        {task.original_prompt && (
          <div className="mb-8 p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 flex items-start space-x-2">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Raw Input:</span>
            <span className="text-slate-300 italic">&ldquo;{task.original_prompt}&rdquo;</span>
          </div>
        )}

        {/* AI Productivity Advisory Card */}
        {task.advisory_note && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/25 relative overflow-hidden shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Gemini AI Productivity Advisory
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              &ldquo;{task.advisory_note}&rdquo;
            </p>
          </div>
        )}

        {/* Subtasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Actionable Checkpoints ({completedSubtasks}/{totalSubtasks})
              </h3>
            </div>
            {totalSubtasks > 0 && (
              <span className="text-xs font-mono font-semibold text-indigo-300">
                {Math.round((completedSubtasks / totalSubtasks) * 100)}% Complete
              </span>
            )}
          </div>

          {/* Progress bar */}
          {totalSubtasks > 0 && (
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-4">
              <div 
                className={`h-full bg-gradient-to-r ${categoryStyle.bar} transition-all duration-300`} 
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
          )}

          {subtasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-slate-400 text-sm">
              No breakdown subtasks were requested for this item.
            </div>
          ) : (
            <div className="space-y-2.5">
              {subtasks.map((sub, idx) => {
                const subDone = sub.status === 'completed';
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleToggleSubtask(sub.id, sub.status)}
                    className={`flex items-start space-x-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      subDone 
                        ? 'bg-slate-900/30 border-white/5 opacity-60' 
                        : 'glass-input text-slate-200 hover:border-indigo-500/40 hover:bg-slate-900/80'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 focus:outline-none"
                    >
                      {subDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm sm:text-base font-medium ${
                        subDone ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}>
                        {sub.title}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-900">
                      Step {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
