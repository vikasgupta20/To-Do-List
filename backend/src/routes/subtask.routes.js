import { Router } from 'express';
import { updateSubtaskStatus } from '../controllers/task.controller.js';

const router = Router();

// /api/subtasks/:id/status
router.patch('/:id/status', updateSubtaskStatus);

export default router;
