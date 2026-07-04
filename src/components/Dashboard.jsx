import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  HelpCircle, 
  FolderGit2, 
  LogOut, 
  Zap,
  Cpu,
  Database,
  BrainCircuit,
  CheckCircle,
  XCircle,
  Info,
  Menu,
  X
} from 'lucide-react';
import CandidateIngestion from './CandidateIngestion';
import DecisionMatrix from './DecisionMatrix';
import Pipeline from './Pipeline';
import GpuTelemetry from './GpuTelemetry';
import GcpConfig from './GcpConfig';
import AgentWorkspace from './AgentWorkspace';
import SystemSettings from './SystemSettings';
import HelpDocs from './HelpDocs';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pipeline management states
  const [candidates, setCandidates] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [agentInitialCandidate, setAgentInitialCandidate] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' | 'info' }
  
  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLaunchAgentMission = (candidate) => {
    setAgentInitialCandidate(candidate);
    setActiveTab('agents');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Talent Dashboard', icon: LayoutDashboard },
    { id: 'candidates', label: 'Candidate Pipeline', icon: Users },
    { id: 'agents', label: 'Agent Workspace', icon: BrainCircuit },
    { id: 'gpu', label: 'GPU Acceleration', icon: Cpu },
    { id: 'gcp', label: 'GCP Warehouse', icon: Database },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle }
  ];

  // Fetch candidates from JSON DB
  const fetchCandidates = async () => {
    setIsDbLoading(true);
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setAnalysisData(null);
    setError(null);
  };

  const handleAnalysisSuccess = (data) => {
    setIsLoading(false);
    if (data.results && Array.isArray(data.results)) {
      // Bulk analysis response
      fetchCandidates();
      const successCount = data.results.length;
      const errorCount = data.errors?.length || 0;
      showToast(`Bulk Ingestion Complete! Evaluated ${successCount} candidates. ${errorCount} failed.`, 'success');
      setActiveTab('candidates'); // Navigate to the pipeline table
    } else {
      // Single analysis response
      setAnalysisData(data);
      showToast(`Assessment generated for ${data.candidate_name}!`, 'success');
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setError(null);
    setIsLoading(false);
  };

  // Database actions
  const handleSaveCandidate = async (candidate) => {
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate)
      });
      if (res.ok) {
        await fetchCandidates();
        showToast('Candidate successfully saved to pipeline.', 'success');
        setActiveTab('candidates'); // Switch to pipeline view
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save candidate', 'error');
      }
    } catch (err) {
      console.error('Error saving candidate:', err);
      showToast('Network error saving candidate', 'error');
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!confirm('Are you sure you want to delete this candidate evaluation?')) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        showToast('Candidate assessment deleted.', 'info');
      }
    } catch (err) {
      console.error('Error deleting candidate:', err);
      showToast('Error deleting candidate from pipeline', 'error');
    }
  };

  // Format today's date
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-[#05070f] text-white">
      
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-[#070b17]/80 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[6px] bg-[#070b19] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white">TalentSync AI</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-25 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 shrink-0 glass-panel border-r border-white/5 bg-[#070b17]/95 md:bg-transparent p-6 z-30 md:static transition-transform duration-300 md:translate-x-0 flex flex-col justify-between h-full md:h-auto ${
        isMobileMenuOpen ? 'translate-x-0 shadow-[5px_0_30px_rgba(0,0,0,0.5)]' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col gap-8">
          
          {/* Logo / Brand & Close button */}
          <div className="flex items-center justify-between py-2 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-[10px] bg-[#070b19] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white m-0">TalentSync AI</h1>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Enterprise v1.2</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/30 glow-violet/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer in sidebar */}
        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 font-bold">
              RA
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Recruiter Admin</p>
              <p className="text-xs text-gray-500">Global HR Lead</p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 text-xs font-semibold text-rose-400/70 hover:text-rose-400 transition-colors py-2 px-1">
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout session</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full z-10">
        
        {/* Workspace Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {activeTab === 'dashboard' ? 'Candidate Assessment' : menuItems.find(m => m.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{getFormattedDate()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              AI Engines Online
            </div>
          </div>
        </header>

        {/* Tab Content Router */}
        <div className="flex-1 flex items-center justify-center w-full">
          {activeTab === 'dashboard' ? (
            !analysisData && !isLoading && !error ? (
              /* Ingestion Screen - Center aligned */
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-center mb-8 max-w-lg">
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Ingest Candidate CV</h2>
                  <p className="text-gray-400 text-sm">Upload a technical resume to run a structured talent sync evaluation using Google Gemini models.</p>
                </div>
                <CandidateIngestion 
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisSuccess={handleAnalysisSuccess}
                  isLoading={isLoading}
                  error={error}
                  setError={setError}
                />
              </div>
            ) : isLoading || error ? (
              /* Ingestion with Loading or Error state */
              <CandidateIngestion 
                onAnalysisStart={handleAnalysisStart}
                onAnalysisSuccess={handleAnalysisSuccess}
                isLoading={isLoading}
                error={error}
                setError={setError}
              />
            ) : (
              /* Result Screen */
              <DecisionMatrix 
                data={analysisData}
                onReset={handleReset}
                onSave={handleSaveCandidate}
              />
            )
          ) : activeTab === 'candidates' || activeTab === 'evaluations' ? (
            /* Database Pipeline View */
            <Pipeline 
              candidates={candidates}
              onViewCandidate={(candidate) => {
                setAnalysisData(candidate);
                setActiveTab('dashboard');
              }}
              onDeleteCandidate={handleDeleteCandidate}
              onLaunchAgent={handleLaunchAgentMission}
              isLoading={isDbLoading}
            />
          ) : activeTab === 'agents' ? (
            /* Autonomous Multi-Agent Workspace */
            <AgentWorkspace 
              candidates={candidates}
              initialCandidate={agentInitialCandidate}
              onGcsSyncSuccess={fetchCandidates}
            />
          ) : activeTab === 'gpu' ? (
            /* GPU Telemetry Stats */
            <GpuTelemetry />
          ) : activeTab === 'gcp' ? (
            /* GCP Cloud Settings */
            <GcpConfig onGcsSyncSuccess={fetchCandidates} />
          ) : activeTab === 'settings' ? (
            /* System Settings Config */
            <SystemSettings />
          ) : activeTab === 'help' ? (
            /* Help & Documentation Guide */
            <HelpDocs />
          ) : (
            /* Other Navigation States */
            <div className="text-center py-20 glass-panel rounded-2xl p-10 max-w-md w-full">
              <FolderGit2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-white mb-2">Workspace Section Under Construction</h2>
              <p className="text-sm text-gray-400 mb-6">The section you requested is not linked.</p>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-200 transition-colors"
              >
                Go back to Talent Assessment
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification Box */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border flex items-center gap-3 shadow-2xl animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
          toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]' :
          'bg-indigo-950/90 border-indigo-500/30 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
        } backdrop-blur-md`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
           toast.type === 'error' ? <XCircle className="w-5 h-5 text-rose-400" /> :
           <Info className="w-5 h-5 text-indigo-400" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2 text-xs font-bold leading-none p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
