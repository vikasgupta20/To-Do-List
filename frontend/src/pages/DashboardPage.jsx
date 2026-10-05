import React, { useState, useEffect, useCallback } from 'react';
import { TaskDashboard } from '../components/TaskDashboard.jsx';
import { 
  fetchTasks, 
  updateTaskStatus, 
  updateSubtaskStatus, 
  deleteTask 
} from '../api/taskApi.js';
import { AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTasks(selectedCategory);
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (taskId, nextStatus) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      await updateTaskStatus(taskId, nextStatus);
    } catch (err) {
      alert(`Could not update task status: ${err.message}`);
      loadTasks();
    }
  };

  const handleToggleSubtask = async (subtaskId, nextStatus) => {
    try {
      const response = await updateSubtaskStatus(subtaskId, nextStatus);
      // Refresh list to update parent task status & subtask counts accurately
      loadTasks();
      return response;
    } catch (err) {
      alert(`Could not update subtask: ${err.message}`);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await deleteTask(taskId);
    } catch (err) {
      alert(`Could not delete task: ${err.message}`);
      loadTasks();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <TaskDashboard
        tasks={tasks}
        loading={loading}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onStatusChange={handleStatusChange}
        onToggleSubtask={handleToggleSubtask}
        onDeleteTask={handleDeleteTask}
        onRefresh={loadTasks}
      />
    </div>
  );
};
