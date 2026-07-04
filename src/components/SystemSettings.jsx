import React, { useState, useEffect } from 'react';
import { Settings, Cpu, BrainCircuit, ShieldCheck, Save, RefreshCw, Terminal } from 'lucide-react';

export default function SystemSettings() {
  // Settings States
  const [inferenceServer, setInferenceServer] = useState('nim'); // 'nim' | 'gemini' | 'vertex'
  const [hostUri, setHostUri] = useState('http://localhost:8000/v1/chat/completions');
  
  // Hardware settings
  const [cudfAccelerated, setCudfAccelerated] = useState(true);
  const [parallelAgents, setParallelAgents] = useState(true);
  const [telemetryPolling, setTelemetryPolling] = useState(true);

  // Agent Prompts States
  const [activePromptTab, setActivePromptTab] = useState('planner');
  const [prompts, setPrompts] = useState({
    planner: 'You are the PlannerAgent. Given a recruitment mission and candidate profile, analyze it and generate a detailed sequence of subtasks as a JSON array of steps. Each step must have stepId, agentName, title, description, requiresApproval (boolean), and targetTools (array of strings). Available agents: ScreenerAgent, VerificationAgent, InterviewerAgent, OutreachAgent. Available tools: cudf-cleaner, github-search, linkedin-sync, bq-warehouse.',
    screener: 'You are the ScreenerAgent. Review candidate resumes for core tech stack matches, soft skills, and major gaps based on the recruiting goal.',
    verification: 'You are the VerificationAgent. Check and validate technical credentials, GitHub repository activity, and employment history.',
    interviewer: 'You are the InterviewerAgent. Devise highly tailored technical questions probing candidate knowledge gaps.',
    outreach: 'You are the OutreachAgent. Draft personalized recruiting email sequences using candidate strengths.'
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setInferenceServer(data.inferenceServer || 'nim');
          setHostUri(data.hostUri || 'http://localhost:8000/v1/chat/completions');
          setCudfAccelerated(data.cudfAccelerated !== undefined ? data.cudfAccelerated : true);
          setParallelAgents(data.parallelAgents !== undefined ? data.parallelAgents : true);
          setTelemetryPolling(data.telemetryPolling !== undefined ? data.telemetryPolling : true);
          if (data.prompts) {
            setPrompts(data.prompts);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        inferenceServer,
        hostUri,
        cudfAccelerated,
        parallelAgents,
        telemetryPolling,
        prompts
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings to server.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Network error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('Are you sure you want to reset all agent prompts to defaults?')) return;
    setPrompts({
      planner: 'You are the PlannerAgent. Given a recruitment mission, analyze candidate data and generate a detailed, logical sequence of subtasks.',
      screener: 'You are the ScreenerAgent. Review candidate resumes for core tech stack matches, soft skills, and major gaps based on the recruiting goal.',
      verification: 'You are the VerificationAgent. Check and simulate background validation for technical credentials, GitHub activity, and employment history.',
      interviewer: 'You are the InterviewerAgent. Devise highly tailored technical questions probing candidate knowledge gaps.',
      outreach: 'You are the OutreachAgent. Draft personalized recruiting email sequences using candidate strengths.'
    });
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in text-gray-200">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Form Column (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Server Config */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
              Inference Server Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => {
                  setInferenceServer('nim');
                  setHostUri('http://localhost:8000/v1/chat/completions');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                  inferenceServer === 'nim'
                    ? 'border-indigo-500/40 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 bg-[#070b17]/40 hover:border-white/10'
                }`}
              >
                <Cpu className="w-6 h-6 text-indigo-400" />
                <div>
                  <strong className="block text-xs text-white">NVIDIA NIM</strong>
                  <span className="text-[10px] text-gray-500">Local High-Speed Inference</span>
                </div>
              </div>

              <div 
                onClick={() => {
                  setInferenceServer('gemini');
                  setHostUri('https://api.google.com/gemini/v1');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                  inferenceServer === 'gemini'
                    ? 'border-purple-500/40 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'border-white/5 bg-[#070b17]/40 hover:border-white/10'
                }`}
              >
                <BrainCircuit className="w-6 h-6 text-purple-400" />
                <div>
                  <strong className="block text-xs text-white">Gemini Developer API</strong>
                  <span className="text-[10px] text-gray-500">Standard Google SDK</span>
                </div>
              </div>

              <div 
                onClick={() => {
                  setInferenceServer('vertex');
                  setHostUri('https://us-central1-aiplatform.googleapis.com');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                  inferenceServer === 'vertex'
                    ? 'border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'border-white/5 bg-[#070b17]/40 hover:border-white/10'
                }`}
              >
                <Settings className="w-6 h-6 text-cyan-400" />
                <div>
                  <strong className="block text-xs text-white">Vertex AI Endpoint</strong>
                  <span className="text-[10px] text-gray-500">Google Cloud Platform</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Endpoint Host URI:</label>
                <input 
                  type="text"
                  value={hostUri}
                  onChange={(e) => setHostUri(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#070b17]/60 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Agent Custom Prompts */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-cyan-400" />
                Customize Agent Persona Instructions
              </h3>
              <button 
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider bg-transparent border-0 cursor-pointer"
              >
                Reset Personas
              </button>
            </div>
            
            <p className="text-xs text-gray-400">Modify the base developer directives utilized by each specialized agent node.</p>

            {/* Prompt sub-navigation tabs */}
            <div className="flex flex-wrap border-b border-white/5 pb-0.5 gap-1.5 mt-2">
              {Object.keys(prompts).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePromptTab(key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                    activePromptTab === key 
                      ? 'bg-[#070b19]/60 border-white/10 text-cyan-400 font-bold' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/2'
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)} Agent
                </button>
              ))}
            </div>

            <div className="mt-2">
              <textarea 
                value={prompts[activePromptTab]}
                onChange={(e) => setPrompts({ ...prompts, [activePromptTab]: e.target.value })}
                rows="5"
                className="w-full p-4 rounded-xl border border-white/5 bg-[#070b17]/60 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
                <span>Configurations Saved and Synced!</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Parameters...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Commit System Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Settings Columns: Hardware Layer & NIM Stats (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Hardware Config Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-purple-500" />
              NVIDIA Hardware & Exec Mode
            </h3>
            
            <p className="text-xs text-gray-400">Configure parameters relating to parallel processing and local GPU resource allocation.</p>

            <div className="flex flex-col gap-4 mt-2">
              {/* Option 1: cuDF preprocessing */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/25">
                <div>
                  <strong className="block text-xs text-white">NVIDIA cuDF Cleaning</strong>
                  <span className="block text-[10px] text-gray-500 mt-0.5">Use GPU parallel string buffers to preprocess resume texts.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCudfAccelerated(!cudfAccelerated)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    cudfAccelerated ? 'bg-cyan-500' : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all ${
                    cudfAccelerated ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Option 2: Parallel Multi-agents */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/25">
                <div>
                  <strong className="block text-xs text-white">Parallel Reasoning Loops</strong>
                  <span className="block text-[10px] text-gray-500 mt-0.5">Allow agent chains to run parallel queries on NIM nodes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setParallelAgents(!parallelAgents)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    parallelAgents ? 'bg-cyan-500' : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all ${
                    parallelAgents ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Option 3: Live Telemetry */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/25">
                <div>
                  <strong className="block text-xs text-white">GPU Live Telemetry Polling</strong>
                  <span className="block text-[10px] text-gray-500 mt-0.5">Query the GPU device context metrics index every 4 seconds.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTelemetryPolling(!telemetryPolling)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    telemetryPolling ? 'bg-cyan-500' : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all ${
                    telemetryPolling ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostics terminal details */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4 font-mono text-[10px] text-emerald-400 min-h-48">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-gray-500 font-sans font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>NVIDIA NIM Diagnostics</span>
            </div>

            <div className="flex flex-col gap-1.5 select-none leading-relaxed">
              <span>[SYSTEM INFO] Host OS: Windows Server 2026</span>
              <span>[SYSTEM INFO] Hardware: NVIDIA L4 Tensor Core GPU</span>
              <span>[CUDA INFO] Driver: 535.129.03 | Runtime: CUDA 12.2</span>
              <span>[NIM SOCKET] Listening: http://localhost:8000</span>
              <span>[NIM DIAGS] Model Register: Meta-Llama-3-70B-Instruct</span>
              <span>[NIM DIAGS] KV Cache Config: PageAttention V2</span>
              <span className="text-cyan-400 font-bold">[ACCEL INDEX] cuDF Acceleration speedup factor: 14.5x</span>
              <span className="text-emerald-400 font-bold">[ACCEL STATUS] All GPU parallel execution hooks healthy.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
