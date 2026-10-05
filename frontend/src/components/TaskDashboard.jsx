import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Inbox
} from 'lucide-react';
import { TaskCard, CATEGORY_COLORS } from './TaskCard.jsx';
import { TaskDetailModal } from './TaskDetailModal.jsx';

const CATEGORIES = [
  'All',
  'Deep Work',
  'Admin/Shallow Work',
  'Errands/Chores',
  'Learning/Growth',
  'Personal/Health'
];

export const TaskDashboard = ({ 
  tasks = [], 
  loading = false, 
  onStatusChange, 
  onToggleSubtask,
  onDeleteTask,
  selectedCategory = 'All',
  onSelectCategory,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = totalTasks - completedTasks;
  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  // Filter tasks by status and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (activeTab === 'active' && task.status === 'completed') return false;
      if (activeTab === 'completed' && task.status !== 'completed') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesPrompt = task.original_prompt?.toLowerCase().includes(query);
        const matchesAdvisory = task.advisory_note?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesPrompt && !matchesAdvisory) return false;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Tasks</span>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{totalTasks}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active In-Flight</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-300 tracking-tight">{activeTasks}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-300 tracking-tight">{completedTasks}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Est. Focus Time</span>
          </div>
          <p className="text-2xl font-extrabold text-sky-300 tracking-tight font-mono">
            {totalEstimatedMinutes}m
          </p>
        </div>
      </div>

      {/* Control Bar: Search + Category Filters + Status Tabs */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, advisories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs & New Task CTA */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-slate-900/80 p-1 rounded-xl border border-white/5 flex space-x-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'active'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed
              </button>
            </div>

            <Link
              to="/task/new"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-white/5">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Category:</span>
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Grid / List View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-48 shimmer-bg border border-white/5" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Inbox className="w-8 h-8 opacity-75" />
          </div>
          <h3 className="text-lg font-bold text-white">No tasks match your criteria</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms or filter settings.' 
              : 'Empower your workflow by creating an AI-categorized task with step-by-step breakdown.'}
          </p>
          <div className="pt-2">
            <Link
              to="/task/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Smart Task</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDeleteTask}
              onOpenModal={(t) => setSelectedTaskForModal(t)}
            />
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskForModal && (
        <TaskDetailModal
          task={selectedTaskForModal}
          isOpen={!!selectedTaskForModal}
          onClose={() => setSelectedTaskForModal(null)}
          onUpdateStatus={async (taskId, status) => {
            await onStatusChange(taskId, status);
            setSelectedTaskForModal(prev => prev ? { ...prev, status } : null);
          }}
          onToggleSubtask={async (subtaskId, status) => {
            const updated = await onToggleSubtask(subtaskId, status);
            if (updated && updated.subtask) {
              setSelectedTaskForModal(prev => {
                if (!prev) return null;
                const newSubs = prev.subtasks.map(s => s.id === subtaskId ? { ...s, status } : s);
                return {
                  ...prev,
                  status: updated.parentCompleted ? 'completed' : prev.status,
                  subtasks: newSubs
                };
              });
            }
          }}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  );
};
