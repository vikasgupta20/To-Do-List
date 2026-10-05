import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  Layers, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { getActiveUserId, setActiveUserId } from '../api/taskApi.js';

const DEMO_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Demo Workspace A', role: 'Team Lead' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Demo Workspace B', role: 'Security Auditor' },
];

export const Layout = ({ children }) => {
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState(getActiveUserId());
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleUserChange = (newUserId) => {
    setActiveUserId(newUserId);
    setCurrentUserId(newUserId);
    // Reload page or trigger re-render so queries run under the new RLS session
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 glass-panel backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-950/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    AuraTask
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    AI 2.5
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Intelligent Task Architect
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center space-x-1.5 ${
                location.pathname === '/'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/task/new"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Smart Task</span>
            </Link>

            {/* Tenant / RLS Context Switcher */}
            <div className="relative ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-white/10 flex items-center space-x-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-end space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  <span>RLS Isolation</span>
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {DEMO_USERS.find(u => u.id === currentUserId)?.name || 'Custom User'}
                </span>
              </div>

              <select
                aria-label="RLS Tenant Identity Switcher"
                value={currentUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="bg-slate-900/90 text-xs text-slate-200 border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                title="Switch User Identity to verify PostgreSQL Row Level Security data isolation"
              >
                {DEMO_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500 glass-panel mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gemini 2.5 Flash Engine &amp; PostgreSQL RLS Active</span>
          </div>
          <div className="text-slate-400">
            Powered by <span className="text-indigo-400 font-semibold">@google/genai</span> SDK &bull; End-to-End Type Safety with Zod
          </div>
        </div>
      </footer>
    </div>
  );
};
