import { withUserTransaction } from '../db/index.js';
import { analyzeTask } from '../services/ai.service.js';
import { 
  CreateTaskSchema, 
  UpdateStatusSchema, 
  UpdateSubtaskStatusSchema 
} from '../../../shared/validators/task.validator.js';

/**
 * GET /api/tasks
 * Fetch all tasks belonging to the authenticated user (isolated via RLS).
 * Supports optional query filter: ?category=...
 */
export const getTasks = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { category } = req.query;

    const tasks = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        return await store.getTasks(userId, category);
      }

      const query = `
        SELECT t.id, t.user_id, t.title, t.original_prompt, t.category, t.status, 
               t.estimated_minutes, t.advisory_note, t.created_at, t.updated_at,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', s.id, 
                     'title', s.title, 
                     'status', s.status, 
                     'sort_order', s.sort_order
                   ) ORDER BY s.sort_order
                 ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
               ) AS subtasks,
               COUNT(s.id)::int AS total_subtasks,
               COUNT(s.id) FILTER (WHERE s.status = 'completed')::int AS completed_subtasks
        FROM tasks t
        LEFT JOIN subtasks s ON s.task_id = t.id
        WHERE ($1::text IS NULL OR t.category = $1::text)
        GROUP BY t.id
        ORDER BY t.created_at DESC;
      `;
      const result = await client.query(query, [category || null]);
      return result.rows;
    });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:id
 * Fetch a single task with its subtasks, respecting RLS.
 */
export const getTaskById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const task = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        return await store.getTaskWithSubtasks(userId, id);
      }

      const query = `
        SELECT t.id, t.user_id, t.title, t.original_prompt, t.category, t.status, 
               t.estimated_minutes, t.advisory_note, t.created_at, t.updated_at,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', s.id, 
                     'title', s.title, 
                     'status', s.status, 
                     'sort_order', s.sort_order,
                     'created_at', s.created_at
                   ) ORDER BY s.sort_order
                 ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
               ) AS subtasks
        FROM tasks t
        LEFT JOIN subtasks s ON s.task_id = t.id
        WHERE t.id = $1::uuid
        GROUP BY t.id;
      `;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    });

    if (!task) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Task not found or access unauthorized.'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * Validates raw task input, invokes Gemini for breakdown & advisory,
 * and saves parent task and subtasks in an atomic transaction.
 */
export const createTask = async (req, res, next) => {
  try {
    const userId = req.userId;

    // 1. Zod Validation
    const validatedData = CreateTaskSchema.parse(req.body);
    const { raw_task_input, needs_breakdown } = validatedData;

    // 2. Call Gemini AI with structured JSON schema
    const aiAnalysis = await analyzeTask(raw_task_input, needs_breakdown);

    // 3. Database persistence with RLS transaction
    const savedTask = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        return await store.createTaskWithSubtasks(
          userId,
          {
            title: aiAnalysis.clean_title,
            original_prompt: raw_task_input,
            category: aiAnalysis.category,
            estimated_minutes: aiAnalysis.estimated_minutes,
            advisory_note: aiAnalysis.advisory_note
          },
          aiAnalysis.subtasks || []
        );
      }

      // Insert parent task
      const insertTaskSql = `
        INSERT INTO tasks (user_id, title, original_prompt, category, status, estimated_minutes, advisory_note)
        VALUES ($1, $2, $3, $4, 'pending', $5, $6)
        RETURNING *;
      `;
      const taskRes = await client.query(insertTaskSql, [
        userId,
        aiAnalysis.clean_title,
        raw_task_input,
        aiAnalysis.category,
        aiAnalysis.estimated_minutes,
        aiAnalysis.advisory_note
      ]);
      const createdTask = taskRes.rows[0];

      // Insert subtasks
      const createdSubtasks = [];
      if (Array.isArray(aiAnalysis.subtasks) && aiAnalysis.subtasks.length > 0) {
        const insertSubtaskSql = `
          INSERT INTO subtasks (task_id, title, status, sort_order)
          VALUES ($1, $2, 'pending', $3)
          RETURNING *;
        `;
        for (let i = 0; i < aiAnalysis.subtasks.length; i++) {
          const subRes = await client.query(insertSubtaskSql, [
            createdTask.id,
            aiAnalysis.subtasks[i],
            i + 1
          ]);
          createdSubtasks.push(subRes.rows[0]);
        }
      }

      return {
        ...createdTask,
        subtasks: createdSubtasks
      };
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully with AI advisory.',
      data: savedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/status
 * Update task status ('pending', 'in_progress', 'completed')
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const validated = UpdateStatusSchema.parse(req.body);

    const updatedTask = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        return await store.updateTaskStatus(userId, id, validated.status);
      }

      const sql = `
        UPDATE tasks
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::uuid
        RETURNING *;
      `;
      const result = await client.query(sql, [validated.status, id]);
      return result.rows[0] || null;
    });

    if (!updatedTask) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Task not found or access unauthorized.'
      });
    }

    res.json({
      success: true,
      message: 'Task status updated.',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/subtasks/:id/status
 * Update subtask status ('pending', 'completed')
 * Automatically marks parent task 'completed' if all subtasks are finished.
 */
export const updateSubtaskStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const validated = UpdateSubtaskStatusSchema.parse(req.body);

    const resultData = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        const sub = await store.updateSubtaskStatus(userId, id, validated.status);
        if (!sub) return null;
        const parent = await store.getTaskWithSubtasks(userId, sub.task_id);
        return { subtask: sub, parentTask: parent };
      }

      // Update subtask (RLS ensures user owns the parent task)
      const updateSubSql = `
        UPDATE subtasks
        SET status = $1
        WHERE id = $2::uuid
        RETURNING *;
      `;
      const subRes = await client.query(updateSubSql, [validated.status, id]);
      if (subRes.rows.length === 0) return null;
      const updatedSub = subRes.rows[0];

      // Check remaining pending subtasks for parent
      const countSql = `
        SELECT COUNT(*)::int AS pending_count
        FROM subtasks
        WHERE task_id = $1::uuid AND status != 'completed';
      `;
      const countRes = await client.query(countSql, [updatedSub.task_id]);
      const pendingCount = countRes.rows[0].pending_count;

      let parentTask = null;
      if (pendingCount === 0) {
        // Automatically complete parent task
        const completeParentSql = `
          UPDATE tasks
          SET status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1::uuid
          RETURNING *;
        `;
        const parentRes = await client.query(completeParentSql, [updatedSub.task_id]);
        parentTask = parentRes.rows[0];
      }

      return {
        subtask: updatedSub,
        parentCompleted: pendingCount === 0,
        parentTask
      };
    });

    if (!resultData) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Subtask not found or unauthorized.'
      });
    }

    res.json({
      success: true,
      message: 'Subtask status updated.',
      data: resultData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task (cascades to subtasks via FK).
 */
export const deleteTask = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const deleted = await withUserTransaction(userId, async ({ inMemory, client, store }) => {
      if (inMemory) {
        return await store.deleteTask(userId, id);
      }

      const sql = `
        DELETE FROM tasks
        WHERE id = $1::uuid
        RETURNING id;
      `;
      const result = await client.query(sql, [id]);
      return result.rows.length > 0;
    });

    if (!deleted) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Task not found or access unauthorized.'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.',
      id
    });
  } catch (error) {
    next(error);
  }
};
