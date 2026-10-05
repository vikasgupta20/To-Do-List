import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  deleteTask,
  updateSubtaskStatus
} from '../controllers/task.controller.js';

const router = Router();

// /api/tasks
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

// Convenient subtask status alias under /api/tasks/subtasks/:id/status
router.patch('/subtasks/:id/status', updateSubtaskStatus);

export default router;
