import { z } from 'zod';

export const TASK_CATEGORIES = [
  'Deep Work',
  'Admin/Shallow Work',
  'Errands/Chores',
  'Learning/Growth',
  'Personal/Health'
];

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'];
export const SUBTASK_STATUSES = ['pending', 'completed'];

export const CreateTaskSchema = z.object({
  raw_task_input: z
    .string()
    .min(3, 'Task description is too short. Please provide at least 3 characters.')
    .max(500, 'Keep it concise. Maximum length is 500 characters.')
    .trim(),
  needs_breakdown: z.boolean().default(true)
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'], {
    errorMap: () => ({ message: 'Status must be one of: pending, in_progress, completed' })
  })
});

export const UpdateSubtaskStatusSchema = z.object({
  status: z.enum(['pending', 'completed'], {
    errorMap: () => ({ message: 'Status must be one of: pending, completed' })
  })
});
