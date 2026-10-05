-- ============================================================================
-- AI-Powered Full-Stack To-Do List Application - Database Schema
-- Production SQL for PostgreSQL with Strict Row Level Security (RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables/policies if running a clean migration
DROP POLICY IF EXISTS tasks_isolation_policy ON tasks;
DROP POLICY IF EXISTS subtasks_isolation_policy ON subtasks;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_prompt TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    estimated_minutes INTEGER,
    advisory_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subtasks Table
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_sort_order ON subtasks(task_id, sort_order);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Tasks Isolation Policy: limits access to rows matching app.current_user_id
CREATE POLICY tasks_isolation_policy ON tasks 
    FOR ALL 
    USING (user_id = current_setting('app.current_user_id', true)::uuid)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Subtasks Isolation Policy: inherits isolation via task_id ownership
CREATE POLICY subtasks_isolation_policy ON subtasks 
    FOR ALL 
    USING (task_id IN (SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id', true)::uuid))
    WITH CHECK (task_id IN (SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Default Seed User for Development/Testing
INSERT INTO users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo.user@buildtoship.local')
ON CONFLICT (id) DO NOTHING;
