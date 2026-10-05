import React from 'react';
import { Link } from 'react-router-dom';
import { SmartTaskInput } from '../components/SmartTaskInput.jsx';
import { ArrowLeft, Sparkles, Shield, Cpu } from 'lucide-react';

export const NewTaskPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Creation Form */}
      <SmartTaskInput />

      {/* Architectural Explainer Callout */}
      <div className="max-w-3xl mx-auto glass-panel p-5 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
        <div className="flex items-start space-x-3">
          <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Structured Schema Generation</span>
            <span>Gemini 2.5 Flash guarantees valid JSON mapping to strict category domains and realistic time estimates.</span>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">PostgreSQL Row Level Security</span>
            <span>All tasks and subtasks are strictly isolated in PostgreSQL using tenant session variables and foreign key cascading.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
