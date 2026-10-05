const API_BASE = '/api';

/**
 * Returns current tenant user ID from localStorage or uses default
 */
export const getActiveUserId = () => {
  return localStorage.getItem('aura_task_user_id') || '00000000-0000-0000-0000-000000000001';
};

export const setActiveUserId = (userId) => {
  localStorage.setItem('aura_task_user_id', userId);
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getActiveUserId(),
  };
};

export async function fetchTasks(category = null) {
  const url = category && category !== 'All' 
    ? `${API_BASE}/tasks?category=${encodeURIComponent(category)}`
    : `${API_BASE}/tasks`;

  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }
  return data.data;
}

export async function fetchTaskById(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch task');
  }
  return data.data;
}

export async function createTaskPayload(payload) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.details 
      ? data.details.map(d => d.message).join(' ') 
      : (data.message || 'Failed to create task');
    throw new Error(errorMsg);
  }
  return data.data;
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update task status');
  }
  return data.data;
}

export async function updateSubtaskStatus(subtaskId, status) {
  const res = await fetch(`${API_BASE}/subtasks/${subtaskId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update subtask status');
  }
  return data.data;
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }
  return data;
}
