import React, { useState } from 'react';
import { Info, Layers, Cpu, Server, Code } from 'lucide-react';

export default function HelpDocs() {
  const [activeTab, setActiveTab] = useState('arch');

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in text-gray-200">
      
      {/* Top Alert banner */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-indigo-500/5 flex gap-4 text-sm text-indigo-200">
        <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-white mb-0.5">Platform Documentation</strong>
          Welcome to the TalentSync AI developer guide. This page outlines the details governing our multi-agent architecture and local GPU performance scaling models.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('arch')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
              activeTab === 'arch'
                ? 'bg-indigo-600/30 text-white border-indigo-500/40 shadow-md shadow-indigo-950/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Agent Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('nvidia')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
              activeTab === 'nvidia'
                ? 'bg-cyan-600/30 text-white border-cyan-500/40 shadow-md shadow-cyan-950/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>NVIDIA Tech Stack</span>
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
              activeTab === 'apis'
                ? 'bg-purple-600/30 text-white border-purple-500/40 shadow-md shadow-purple-950/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Code className="w-4 h-4 text-purple-400" />
            <span>Developer APIs</span>
          </button>
        </div>

        {/* Content Panel (9 cols) */}
        <div className="lg:col-span-9 glass-panel rounded-2xl p-6 border border-white/5">
          
          {/* Tab 1: Architecture */}
          {activeTab === 'arch' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Multi-Agent Coordination Model
              </h3>
              
              <div className="text-sm text-gray-300 flex flex-col gap-4 leading-relaxed">
                <p>
                  TalentSync AI relies on a **Hierarchical multi-agent network**. A primary coordinator delegates discrete workflows to specialized secondary nodes:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-black/25 rounded-xl border border-white/5">
                    <strong className="block text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">CoordinatorAgent</strong>
                    <p className="text-xs text-gray-400">Acts as the task planner. Takes user objectives, maps dependencies, compiles step structures, and merges final outputs.</p>
                  </div>

                  <div className="p-4 bg-black/25 rounded-xl border border-white/5">
                    <strong className="block text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">ScreenerAgent</strong>
                    <p className="text-xs text-gray-400">Processes textual CV documents to map competencies, alignment metrics, and skills gaps against specified goals.</p>
                  </div>

                  <div className="p-4 bg-black/25 rounded-xl border border-white/5">
                    <strong className="block text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">VerificationAgent</strong>
                    <p className="text-xs text-gray-400">Runs external diagnostics to verify authenticity (simulated code contributions, employment timelines, certifications).</p>
                  </div>

                  <div className="p-4 bg-black/25 rounded-xl border border-white/5">
                    <strong className="block text-fuchsia-300 text-xs font-bold uppercase tracking-wider mb-1">InterviewerAgent</strong>
                    <p className="text-xs text-gray-400">Prepares personalized coding challenges and vetting questions targeting candidate CV gaps. Requires Recruiter approval.</p>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mt-4">Human-in-the-Loop Oversight</h4>
                <p className="text-xs text-gray-400">
                  Critical communication steps (e.g., outreach emails and interview designs) are paused by the Coordinator. The recruiter leads have override edit blocks directly inside the workspace UI before commit pipelines trigger.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: NVIDIA Tech Stack */}
          {activeTab === 'nvidia' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                NVIDIA Acceleration Stack
              </h3>
              
              <div className="text-sm text-gray-300 flex flex-col gap-4 leading-relaxed">
                <p>
                  To handle high throughput during large-scale bulk uploads, the multi-agent orchestration is optimized via GPU execution:
                </p>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="p-4 bg-black/25 rounded-xl border border-white/5 flex gap-4">
                    <Server className="w-10 h-10 text-cyan-400 shrink-0 mt-1" />
                    <div>
                      <strong className="block text-xs text-white uppercase tracking-wider mb-1">NVIDIA NIM (Neural Inference Microservices)</strong>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Llama-3-70B model requests are processed using local NIM microservices. By caching KV parameters and processing tokens via Tensor Cores, inference speeds average **94 tokens/sec** with sub-second response times.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/25 rounded-xl border border-white/5 flex gap-4">
                    <Cpu className="w-10 h-10 text-indigo-400 shrink-0 mt-1" />
                    <div>
                      <strong className="block text-xs text-white uppercase tracking-wider mb-1">NVIDIA RAPIDS cuDF GPU Preprocessing</strong>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Before tokenization, resume text strings are preprocessed (stripped, lowercase mapped, casing cleaned) using parallel GPU threads on cuDF. This avoids Python CPU bottlenecks, yielding a **14.5x processing speedup**.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Developer APIs */}
          {activeTab === 'apis' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                Developer API Endpoints
              </h3>
              
              <div className="text-sm text-gray-300 flex flex-col gap-4">
                
                {/* Init endpoint */}
                <div className="flex flex-col gap-2">
                  <strong className="text-xs text-white font-mono">POST /api/agent/init</strong>
                  <p className="text-xs text-gray-400 leading-normal">Initializes the multi-agent task planner and outputs a list of roadmap steps.</p>
                  <pre className="bg-[#030712] border border-white/10 rounded-xl p-3.5 font-mono text-[10px] text-purple-300 overflow-x-auto">
{`// Request Payload:
{
  "candidateId": "129381029",
  "mission": "Deep screen candidate tech stack"
}

// Success Response:
{
  "success": true,
  "steps": [
    { "stepId": 1, "agentName": "ScreenerAgent", "title": "...", "requiresApproval": false }
  ]
}`}
                  </pre>
                </div>

                {/* Execute endpoint */}
                <div className="flex flex-col gap-2 mt-4">
                  <strong className="text-xs text-white font-mono">POST /api/agent/execute-step</strong>
                  <p className="text-xs text-gray-400 leading-normal">Runs reasoning loops for a single step inside the Coordinator roadmap.</p>
                  <pre className="bg-[#030712] border border-white/10 rounded-xl p-3.5 font-mono text-[10px] text-cyan-300 overflow-x-auto">
{`// Request Payload:
{
  "stepId": 3,
  "agentName": "InterviewerAgent",
  "candidate": { ... },
  "previousResults": { ... }
}

// Success Response:
{
  "success": true,
  "result": { "questions": [...] },
  "telemetry": { "timeMs": 1120, "tokenSec": 91, "engine": "NVIDIA NIM" }
}`}
                  </pre>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
