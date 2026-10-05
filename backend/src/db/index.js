import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

let pool = null;
let isPostgresAvailable = false;

if (connectionString) {
  const isSslNeeded = connectionString.includes('sslmode=require') || 
                      connectionString.includes('neon.tech') || 
                      connectionString.includes('supabase.co') ||
                      process.env.NODE_ENV === 'production';

  pool = new Pool({
    connectionString,
    ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]', err.message);
  });
}

// In-Memory Dev Store used if PostgreSQL is not configured or offline during development
class InMemoryStore {
  constructor() {
    this.users = new Map([
      ['00000000-0000-0000-0000-000000000001', {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo.user@buildtoship.local',
        created_at: new Date().toISOString()
      }]
    ]);
    this.tasks = new Map();
    this.subtasks = new Map();
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // RLS-aware task query
  async getTasks(userId, category) {
    let list = Array.from(this.tasks.values()).filter(t => t.user_id === userId);
    if (category) {
      list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }

  async getTaskWithSubtasks(userId, taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.user_id !== userId) {
      return null;
    }
    const subtasks = Array.from(this.subtasks.values())
      .filter(s => s.task_id === taskId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return { ...task, subtasks };
  }

  async createTaskWithSubtasks(userId, taskData, subtasksList = []) {
    const taskId = this.generateUuid();
    const now = new Date().toISOString();
    const task = {
      id: taskId,
      user_id: userId,
      title: taskData.title,
      original_prompt: taskData.original_prompt,
      category: taskData.category,
      status: 'pending',
      estimated_minutes: taskData.estimated_minutes,
      advisory_note: taskData.advisory_note,
      created_at: now,
      updated_at: now
    };
    this.tasks.set(taskId, task);

    const createdSubtasks = [];
    for (let i = 0; i < subtasksList.length; i++) {
      const subId = this.generateUuid();
      const sub = {
        id: subId,
        task_id: taskId,
        title: subtasksList[i],
        status: 'pending',
        sort_order: i + 1,
        created_at: now
      };
      this.subtasks.set(subId, sub);
      createdSubtasks.push(sub);
    }
    return { ...task, subtasks: createdSubtasks };
  }

  async updateTaskStatus(userId, taskId, status) {
    const task = this.tasks.get(taskId);
    if (!task || task.user_id !== userId) return null;
    task.status = status;
    task.updated_at = new Date().toISOString();
    return task;
  }

  async updateSubtaskStatus(userId, subtaskId, status) {
    const subtask = this.subtasks.get(subtaskId);
    if (!subtask) return null;
    const parentTask = this.tasks.get(subtask.task_id);
    if (!parentTask || parentTask.user_id !== userId) return null;
    
    subtask.status = status;
    
    // Check if all subtasks are completed, then complete parent
    const sisterSubtasks = Array.from(this.subtasks.values()).filter(s => s.task_id === subtask.task_id);
    const allCompleted = sisterSubtasks.every(s => s.status === 'completed');
    if (allCompleted && parentTask.status !== 'completed') {
      parentTask.status = 'completed';
      parentTask.updated_at = new Date().toISOString();
    }
    
    return subtask;
  }

  async deleteTask(userId, taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.user_id !== userId) return false;
    
    // Cascade delete subtasks
    for (const [sId, sub] of this.subtasks.entries()) {
      if (sub.task_id === taskId) {
        this.subtasks.delete(sId);
      }
    }
    this.tasks.delete(taskId);
    return true;
  }
}

export const inMemoryStore = new InMemoryStore();

/**
 * Verifies PostgreSQL connection at startup
 */
export const checkDbConnection = async () => {
  if (!pool) {
    console.warn('⚠️  DATABASE_URL is not configured. Running in Fallback In-Memory Mode for development.');
    isPostgresAvailable = false;
    return false;
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully at:', result.rows[0].now);
    isPostgresAvailable = true;
    return true;
  } catch (error) {
    console.warn(`⚠️  PostgreSQL connection failed (${error.message}). Running in Fallback In-Memory Mode.`);
    isPostgresAvailable = false;
    return false;
  }
};

export const getIsPostgresAvailable = () => isPostgresAvailable;

/**
 * Transaction-scoped execution with strict PostgreSQL Row Level Security (RLS).
 * Sets 'app.current_user_id' locally within the transaction.
 */
export const withUserTransaction = async (userId, callback) => {
  if (!isPostgresAvailable || !pool) {
    // Execute callback against in-memory mock store
    return await callback({ inMemory: true, store: inMemoryStore });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Set local configuration parameter for transaction-scoped RLS
    // Using parameterized set_config(setting_name, new_value, is_local)
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
    
    const result = await callback({ inMemory: false, client });
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[Rollback Error]', rbErr.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

export { pool };
