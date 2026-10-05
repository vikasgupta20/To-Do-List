import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { NewTaskPage } from './pages/NewTaskPage.jsx';
import { TaskDetailPage } from './pages/TaskDetailPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/task/new" element={<NewTaskPage />} />
          <Route path="/task/:id" element={<TaskDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
