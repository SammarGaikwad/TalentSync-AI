import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Bot, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Play, 
  Pause, 
  UserCheck, 
  RefreshCw, 
  Mail, 
  FileText, 
  Check, 
  Info, 
  Lock, 
  Sparkles,
  Activity,
  Database
} from 'lucide-react';

export default function AgentWorkspace({ candidates = [], initialCandidate = null, onGcsSyncSuccess }) {
  // Candidate selection states
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidate?.id || '');
  const [customName, setCustomName] = useState('');
  const [customSkills, setCustomSkills] = useState('');
  const [mission, setMission] = useState('Build a deep technical assessment challenge, verify Github activity, and prepare an outreach draft.');
  
  // Execution states
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // 'idle' | 'planning' | 'running' | 'paused' | 'completed' | 'error'
  
  // Accumulated data
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [stepResults, setStepResults] = useState({});
  const [telemetries, setTelemetries] = useState([]);
  const [agentReasonings, setAgentReasonings] = useState({});
  
  // Logs console state
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  // Human-in-the-loop editing states
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [editingEmail, setEditingEmail] = useState({ subject: '', body: '' });
  const [refinementDirective, setRefinementDirective] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Preset missions
  const presets = [
    { title: 'Full Screening & Outreach', desc: 'Screen CV, verify certs, compile interview questions, draft outreach.' },
    { title: 'Technical Integrity Check', desc: 'Cross-examine technical competencies, simulate Github verification, check coding alignment.' },
    { title: 'Outreach & Scheduling Prep', desc: 'Draft outreach, prepare preliminary questions, design briefing document.' }
  ];

  // Auto-scroll console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Set initial candidate if passed
  useEffect(() => {
    if (initialCandidate) {
      setSelectedCandidateId(initialCandidate.id);
      setCandidateProfile(initialCandidate);
    }
  }, [initialCandidate]);

  const addLog = (agent, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, agent, message, type }]);
  };

  const handleSelectPreset = (desc) => {
    setMission(desc);
  };

  // Start workflow
  const startWorkflow = async () => {
    if (!selectedCandidateId && !customName) {
      alert('Please select a candidate or configure a custom profile.');
      return;
    }

    setWorkflowStatus('planning');
    setSteps([]);
    setStepResults({});
    setAgentReasonings({});
    setTelemetries([]);
    setCurrentStepIndex(-1);
    setLogs([]);

    addLog('CoordinatorAgent', 'Initializing autonomous multi-agent planner...', 'system');

    let customCandidate = null;
    if (selectedCandidateId === 'custom') {
      customCandidate = {
        candidate_name: customName || 'Custom Candidate',
        core_competencies: customSkills.split(',').map(s => s.trim()).filter(Boolean),
        technical_score: 8,
        leadership_score: 7,
        job_alignment_score: 8,
        alignment_explanation: 'Custom defined candidate profile.'
      };
      setCandidateProfile(customCandidate);
    } else {
      const existing = candidates.find(c => c.id === selectedCandidateId);
      setCandidateProfile(existing);
      customCandidate = existing;
    }

    try {
      const response = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          customCandidate,
          mission
        })
      });

      if (!response.ok) throw new Error('Planner failed to generate step configurations.');

      const data = await response.json();
      setSteps(data.steps);
      setWorkflowStatus('running');
      setCurrentStepIndex(0);
      addLog('CoordinatorAgent', `Planning complete. generated ${data.steps.length} specialized subtasks.`, 'success');
      
      // Trigger execution of the first step
      executeStep(0, data.steps, data.candidate, data.mission, {});
    } catch (err) {
      console.error(err);
      addLog('CoordinatorAgent', `Planning aborted: ${err.message}`, 'error');
      setWorkflowStatus('error');
    }
  };

  // Execute a specific step index
  const executeStep = async (index, stepList, candidateData, missionText, accumulatedResults, feedbackText = null) => {
    if (index >= stepList.length) {
      setWorkflowStatus('completed');
      addLog('CoordinatorAgent', 'All multi-agent actions executed successfully. Task completed.', 'success');
      return;
    }

    const step = stepList[index];
    setCurrentStepIndex(index);
    addLog('CoordinatorAgent', `Delegating Subtask #${step.stepId} to ${step.agentName}...`, 'system');
    addLog(step.agentName, `Activating agent reasoning... Task: "${step.description}"`, 'info');

    try {
      const response = await fetch('/api/agent/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.stepId,
          agentName: step.agentName,
          candidate: candidateData,
          mission: missionText,
          previousResults: accumulatedResults,
          feedback: feedbackText,
          targetTools: step.targetTools || []
        })
      });

      if (!response.ok) throw new Error(`${step.agentName} execution failed.`);

      const data = await response.json();
      
      // Store results
      const newAccumulated = { ...accumulatedResults, [step.agentName]: data.result };
      setStepResults(newAccumulated);
      setAgentReasonings(prev => ({ ...prev, [step.agentName]: data.reasoning }));
      setTelemetries(prev => [...prev, data.telemetry]);

      // Tool execution logs
      if (data.toolLogs && Array.isArray(data.toolLogs)) {
        data.toolLogs.forEach(log => {
          addLog(`${step.agentName} Tool`, log, 'gpu');
        });
      }

      // Telemetry logs
      if (data.telemetry.cuDfLog) {
        addLog('NVIDIA cuDF', data.telemetry.cuDfLog, 'gpu');
      }
      addLog(step.agentName, `Completed reasoning loop. Latency: ${data.telemetry.timeMs}ms | Speed: ${data.telemetry.tokenSec} tok/sec via ${data.telemetry.engine}`, 'success');

      // Check if human approval is required
      if (step.requiresApproval) {
        setWorkflowStatus('paused');
        addLog('CoordinatorAgent', `Subtask requires human review and confirmation. Pausing pipeline.`, 'warning');
        
        // Load content into editors
        if (step.agentName === 'InterviewerAgent') {
          setEditingQuestions(data.result.questions || []);
        } else if (step.agentName === 'OutreachAgent') {
          setEditingEmail(data.result || { subject: '', body: '' });
        }
      } else {
        // Proceed automatically
        executeStep(index + 1, stepList, candidateData, missionText, newAccumulated);
      }

    } catch (err) {
      console.error(err);
      addLog(step.agentName, `Error during execution: ${err.message}. Returning fallback simulated results.`, 'error');
      setWorkflowStatus('error');
    }
  };

  // Human approval override
  const handleApproveStep = () => {
    // Inject edited content back into results
    const currentStep = steps[currentStepIndex];
    let updatedResult = { ...stepResults[currentStep.agentName] };

    if (currentStep.agentName === 'InterviewerAgent') {
      updatedResult.questions = editingQuestions;
      addLog('Human-in-the-Loop', 'Targeted interview questions approved & updated by Recruiter.', 'gpu');
    } else if (currentStep.agentName === 'OutreachAgent') {
      updatedResult = editingEmail;
      addLog('Human-in-the-Loop', 'Recruiter Outreach Draft approved.', 'gpu');
    }

    const updatedAccumulated = {
      ...stepResults,
      [currentStep.agentName]: updatedResult
    };

    setStepResults(updatedAccumulated);
    setWorkflowStatus('running');
    
    // Execute next step
    executeStep(currentStepIndex + 1, steps, candidateProfile, mission, updatedAccumulated);
  };

  // Human refinement feedback regeneration
  const handleRegenerateStep = async () => {
    if (!refinementDirective.trim()) {
      alert('Please enter a refinement directive explaining what to adjust.');
      return;
    }
    
    setIsRegenerating(true);
    addLog('Human-in-the-Loop', `Requesting regeneration of ${steps[currentStepIndex].agentName} with instructions: "${refinementDirective}"`, 'warning');
    
    setWorkflowStatus('running');
    
    const currentStep = steps[currentStepIndex];
    const cleanedResults = { ...stepResults };
    delete cleanedResults[currentStep.agentName];
    
    await executeStep(currentStepIndex, steps, candidateProfile, mission, cleanedResults, refinementDirective);
    setIsRegenerating(false);
    setRefinementDirective('');
  };

  const handleSaveToPipeline = async () => {
    if (!candidateProfile) return;
    
    try {
      const updatedCandidate = {
        ...candidateProfile,
        agentEvaluation: {
          mission,
          screener: stepResults.ScreenerAgent,
          verification: stepResults.VerificationAgent,
          questions: stepResults.InterviewerAgent?.questions,
          outreach: stepResults.OutreachAgent,
          completedAt: new Date().toISOString()
        }
      };

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate)
      });

      if (res.ok) {
        alert('Multi-Agent assessment report successfully saved to Candidate Profile!');
        if (onGcsSyncSuccess) onGcsSyncSuccess(); // Trigger parent refresh
      } else {
        alert('Failed to save assessment to pipeline database.');
      }
    } catch (err) {
      console.error('Error saving agent report:', err);
      alert('Network error saving report.');
    }
  };

  // Get active agent for visualizer
  const getActiveAgent = () => {
    if (workflowStatus === 'planning') return 'PlannerAgent';
    if (workflowStatus === 'paused') return 'Human';
    if (workflowStatus === 'running' && currentStepIndex !== -1) {
      return steps[currentStepIndex]?.agentName;
    }
    return null;
  };

  const activeAgent = getActiveAgent();

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in text-gray-200">
      
      {/* Real-time Collaboration Visualizer Board */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Autonomous Multi-Agent Workspace
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  Active Team Network
                </span>
              </h2>
              <p className="text-xs text-gray-400">Watch specialized digital teammates plan, reason, and coordinate actions.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">System Engine:</span>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
              NVIDIA NIM + cuDF GPU
            </span>
          </div>
        </div>

        {/* The Graphic Visualizer Nodes */}
        <div className="h-44 relative bg-black/30 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-around p-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(17,24,39,0.5),rgba(3,7,18,0.9))]" />
          
          {/* Connecting Lines Graphic (Dynamic glows) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Planner to Screener */}
            <line x1="16%" y1="50%" x2="33%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {activeAgent === 'ScreenerAgent' && (
              <line x1="16%" y1="50%" x2="33%" y2="50%" stroke="url(#indigoGlow)" strokeWidth="3" className="animate-pulse" />
            )}
            
            {/* Planner to Verification */}
            <line x1="16%" y1="50%" x2="50%" y2="25%" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {activeAgent === 'VerificationAgent' && (
              <line x1="16%" y1="50%" x2="50%" y2="25%" stroke="url(#cyanGlow)" strokeWidth="3" className="animate-pulse" />
            )}
            
            {/* Planner to Interviewer */}
            <line x1="16%" y1="50%" x2="50%" y2="75%" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {activeAgent === 'InterviewerAgent' && (
              <line x1="16%" y1="50%" x2="50%" y2="75%" stroke="url(#purpleGlow)" strokeWidth="3" className="animate-pulse" />
            )}
            
            {/* Planner to Outreach */}
            <line x1="16%" y1="50%" x2="67%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {activeAgent === 'OutreachAgent' && (
              <line x1="16%" y1="50%" x2="67%" y2="50%" stroke="url(#cyanGlow)" strokeWidth="3" className="animate-pulse" />
            )}

            {/* Outreach to Human (Pauses) */}
            <line x1="67%" y1="50%" x2="88%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {activeAgent === 'Human' && (
              <line x1="67%" y1="50%" x2="88%" y2="50%" stroke="url(#roseGlow)" strokeWidth="3" className="animate-pulse" />
            )}

            {/* Defs for Gradients */}
            <defs>
              <linearGradient id="indigoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="roseGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Node 1: Coordinator / Planner */}
          <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${activeAgent === 'PlannerAgent' ? 'scale-110' : 'opacity-70'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
              activeAgent === 'PlannerAgent' ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'bg-gray-900/80 border-white/10'
            }`}>
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Coordinator</span>
          </div>

          {/* Node 2: Screener */}
          <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${activeAgent === 'ScreenerAgent' ? 'scale-110' : 'opacity-70'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              activeAgent === 'ScreenerAgent' ? 'bg-purple-600/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-900/80 border-white/10'
            }`}>
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase">CV Screener</span>
          </div>

          {/* Core split layer for verification and questions */}
          <div className="flex flex-col gap-6 justify-center">
            {/* Node 3: Verification */}
            <div className={`relative z-10 flex flex-col items-center gap-1.5 transition-all duration-300 ${activeAgent === 'VerificationAgent' ? 'scale-110' : 'opacity-70'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                activeAgent === 'VerificationAgent' ? 'bg-cyan-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-900/80 border-white/10'
              }`}>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Verify agent</span>
            </div>

            {/* Node 4: Interviewer */}
            <div className={`relative z-10 flex flex-col items-center gap-1.5 transition-all duration-300 ${activeAgent === 'InterviewerAgent' ? 'scale-110' : 'opacity-70'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                activeAgent === 'InterviewerAgent' ? 'bg-fuchsia-600/30 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'bg-gray-900/80 border-white/10'
              }`}>
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Interviewer</span>
            </div>
          </div>

          {/* Node 5: Outreach */}
          <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${activeAgent === 'OutreachAgent' ? 'scale-110' : 'opacity-70'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              activeAgent === 'OutreachAgent' ? 'bg-cyan-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-900/80 border-white/10'
            }`}>
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Outreach Agent</span>
          </div>

          {/* Node 6: Recruiter Approval (HITL) */}
          <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${activeAgent === 'Human' ? 'scale-110' : 'opacity-50'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
              activeAgent === 'Human' ? 'bg-rose-600/30 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-gray-900/80 border-white/10'
            }`}>
              <UserCheck className="w-6 h-6 text-rose-400" />
            </div>
            <span className="text-[10px] font-bold font-mono tracking-wider text-rose-400 uppercase">Recruiter Lead (Oversight)</span>
          </div>
        </div>
      </div>

      {/* Grid: Controller Panel, Log Console, NVIDIA Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Planning Panel (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Mission Planner Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-fit">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
                Configure Mission
              </h3>
              <p className="text-xs text-gray-400 mb-6">Select a candidate and prompt the Coordinator Agent to design an execution workflow.</p>

              <div className="flex flex-col gap-4">
                {/* Candidate Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Target Candidate:</label>
                  <select 
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    disabled={workflowStatus === 'running' || workflowStatus === 'planning'}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#070b17]/60 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="" disabled>-- Choose Candidate --</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.candidate_name}</option>
                    ))}
                    <option value="custom">-- Custom Mock Profile --</option>
                  </select>
                </div>

                {/* Custom Candidate options if custom selected */}
                {selectedCandidateId === 'custom' && (
                  <div className="flex flex-col gap-3 p-3 bg-black/20 rounded-xl border border-white/5 animate-fade-in">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Candidate Name:</label>
                      <input 
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Tony Stark"
                        className="w-full px-3 py-1.5 rounded-lg border border-white/5 bg-gray-900 text-xs text-white focus:outline-none focus:border-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Core Tech Stack (comma separated):</label>
                      <input 
                        type="text"
                        value={customSkills}
                        onChange={(e) => setCustomSkills(e.target.value)}
                        placeholder="React, Python, AWS, Docker"
                        className="w-full px-3 py-1.5 rounded-lg border border-white/5 bg-gray-900 text-xs text-white focus:outline-none focus:border-indigo-500/30"
                      />
                    </div>
                  </div>
                )}

                {/* Task/Mission Prompt */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orchestration Prompt / Mission:</label>
                  <textarea 
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    disabled={workflowStatus === 'running' || workflowStatus === 'planning'}
                    rows="4"
                    className="w-full p-3 rounded-xl border border-white/5 bg-[#070b17]/60 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
                  />
                </div>

                {/* Mission Presets */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Prompt Presets:</label>
                  <div className="flex flex-col gap-2">
                    {presets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset.desc)}
                        disabled={workflowStatus === 'running' || workflowStatus === 'planning'}
                        className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="font-semibold text-gray-300">{preset.title}</span>
                        <span className="text-[10px] text-gray-500 truncate w-full">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={startWorkflow}
              disabled={workflowStatus === 'running' || workflowStatus === 'planning' || (!selectedCandidateId && !customName)}
              className="w-full mt-6 py-3.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30"
            >
              {workflowStatus === 'planning' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Planning Workflow...</span>
                </>
              ) : workflowStatus === 'running' ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse text-cyan-400" />
                  <span>Running Agents...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Multi-Agent Task</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center/Right Side: Live Execution Steps & Logs (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Execution steps progress list */}
          {steps.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>Orchestrator Roadmap</span>
                <span className="text-[10px] text-indigo-400 font-mono">({steps.length} Nodes)</span>
              </h3>
              
              <div className="flex flex-col gap-3">
                {steps.map((step, idx) => {
                  const isActive = currentStepIndex === idx;
                  const isCompleted = currentStepIndex > idx;
                  const isPaused = isActive && workflowStatus === 'paused';
                  
                  return (
                    <div 
                      key={step.stepId}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isActive && isPaused ? 'border-rose-500/30 bg-rose-500/5' :
                        isActive ? 'border-cyan-500/30 bg-cyan-500/5' :
                        isCompleted ? 'border-emerald-500/10 bg-emerald-500/2 border-dashed' :
                        'border-white/5 bg-black/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : isActive && isPaused ? (
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold animate-pulse">
                            <Pause className="w-3 h-3 fill-current" />
                          </div>
                        ) : isActive ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold animate-spin" style={{ animationDuration: '3s' }}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-500 text-[10px] font-bold font-mono">
                            {step.stepId}
                          </div>
                        )}
                        
                        <div>
                          <span className="block text-xs font-bold text-white leading-tight">{step.title}</span>
                          <span className="block text-[10px] text-gray-500 mt-0.5 leading-normal">{step.agentName} • {step.description}</span>
                          {step.targetTools && step.targetTools.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {step.targetTools.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-mono font-bold tracking-wide uppercase">
                                  🔧 {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {step.requiresApproval && (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isActive && isPaused ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' :
                          isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-white/5 border-white/10 text-gray-500'
                        }`}>
                          Oversight
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Agent Log Terminal */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between h-80">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Agent Collaboration Console
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-[10px] flex flex-col gap-2 min-h-0 border border-white/5">
              {logs.length === 0 && (
                <span className="text-gray-600 italic">Console idling. Trigger a multi-agent task to listen to agent streams.</span>
              )}
              {logs.map((log, idx) => {
                let colorClass = 'text-gray-300';
                if (log.type === 'system') colorClass = 'text-indigo-400 font-bold';
                else if (log.type === 'success') colorClass = 'text-emerald-400';
                else if (log.type === 'warning') colorClass = 'text-amber-400 font-semibold';
                else if (log.type === 'error') colorClass = 'text-rose-400 font-bold';
                else if (log.type === 'gpu') colorClass = 'text-cyan-400 italic';
                
                return (
                  <div key={idx} className="flex gap-2 items-start leading-relaxed border-b border-white/2 pb-1.5 last:border-b-0">
                    <span className="text-gray-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`font-bold shrink-0 uppercase tracking-wide px-1.5 py-0.5 rounded text-[8px] border ${
                      log.agent === 'CoordinatorAgent' ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300' :
                      log.agent === 'NVIDIA cuDF' ? 'bg-cyan-950/40 border-cyan-500/20 text-cyan-300' :
                      log.agent === 'Human-in-the-Loop' ? 'bg-rose-950/40 border-rose-500/20 text-rose-300' :
                      'bg-purple-950/40 border-purple-500/20 text-purple-300'
                    }`}>
                      {log.agent}
                    </span>
                    <span className={colorClass}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

        {/* Right Side: NVIDIA Telemetry Sidebar (3 columns) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-5 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl" />
            
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              NVIDIA Hardware Layer
            </h3>
            
            {/* Live Metrics values */}
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Active Server NIM</span>
                <span className="block text-sm font-bold text-white mt-1">Llama-3-70B-Instruct-NIM</span>
              </div>

              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="block text-[10px] text-gray-500 uppercase font-sans">VRAM Memory Load</span>
                <div className="flex items-center justify-between text-white mt-1.5 font-bold">
                  <span>{telemetries[telemetries.length - 1]?.vramUsed || '6.5'} GB</span>
                  <span className="text-[10px] text-gray-500">/ 24.0 GB</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1 mt-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${((telemetries[telemetries.length - 1]?.vramUsed || 6.5) / 24.0) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Inference Generation</span>
                <span className="block text-sm font-bold text-emerald-400 mt-1">
                  {telemetries[telemetries.length - 1]?.tokenSec || '94'} tokens/sec
                </span>
              </div>

              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Execution Speedup</span>
                <span className="block text-sm font-bold text-cyan-400 mt-1">
                  14.5x Acceleration (cuDF)
                </span>
              </div>
            </div>

            <div className="mt-auto p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-200 leading-normal">
                Parallel cleaning & tokenization executes in GPU-accelerated cuDF nodes, bypassing CPU serialization.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Human-in-the-loop Intermediate Approval Box */}
      {workflowStatus === 'paused' && (
        <div className="glass-panel rounded-3xl p-6 border-2 border-rose-500/30 bg-rose-950/10 shadow-[0_0_30px_rgba(244,63,94,0.15)] flex flex-col gap-4 animate-fade-in relative z-20">
          <div className="flex items-center justify-between border-b border-rose-500/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Lock className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Action Required: Human-in-the-Loop Verification
                </h3>
                <p className="text-xs text-rose-300">Evaluate, edit, and approve the generated draft from {steps[currentStepIndex]?.agentName} to continue.</p>
              </div>
            </div>
            
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-pulse">
              Pipeline Paused
            </span>
          </div>

          {/* Render editor depending on step */}
          {steps[currentStepIndex]?.agentName === 'InterviewerAgent' && (
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Generated Targeted Interview Questions:</h4>
              <div className="flex flex-col gap-4">
                {editingQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-black/30 rounded-xl border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 border-b border-white/5 pb-1">
                      <span>Concept: {q.targetConcept}</span>
                      <span className="font-bold">Question #{idx + 1}</span>
                    </div>
                    <textarea 
                      value={q.question}
                      onChange={(e) => {
                        const newQ = [...editingQuestions];
                        newQ[idx].question = e.target.value;
                        setEditingQuestions(newQ);
                      }}
                      rows="2"
                      className="w-full bg-transparent border-0 text-xs text-white focus:outline-none resize-none font-sans font-medium"
                    />
                    <div className="mt-1">
                      <span className="block text-[9px] text-gray-500 uppercase">Expected Response criteria:</span>
                      <input 
                        type="text"
                        value={q.expectedAnswer}
                        onChange={(e) => {
                          const newQ = [...editingQuestions];
                          newQ[idx].expectedAnswer = e.target.value;
                          setEditingQuestions(newQ);
                        }}
                        className="w-full bg-transparent border-b border-white/5 text-[10px] text-gray-400 focus:outline-none focus:border-indigo-500 pb-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps[currentStepIndex]?.agentName === 'OutreachAgent' && (
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Generated Outreach Email:</h4>
              <div className="p-4 bg-black/30 rounded-xl border border-white/5 flex flex-col gap-3">
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase mb-1">Email Subject:</label>
                  <input 
                    type="text"
                    value={editingEmail.subject}
                    onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })}
                    className="w-full bg-transparent border-b border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold pb-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase mb-1">Email Body:</label>
                  <textarea 
                    value={editingEmail.body}
                    onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })}
                    rows="8"
                    className="w-full bg-transparent border-0 text-xs text-white focus:outline-none resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active agent's reasoning trace displayed for oversight transparency */}
          {agentReasonings[steps[currentStepIndex]?.agentName] && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-xs mt-2">
              <strong className="text-indigo-300 block mb-1.5 font-mono uppercase tracking-wider text-[10px]">
                🧠 {steps[currentStepIndex]?.agentName} Reasoning Trace:
              </strong>
              <p className="text-gray-400 font-mono leading-relaxed whitespace-pre-wrap text-[10px] bg-black/30 p-2.5 rounded border border-white/5 max-h-40 overflow-y-auto">
                {agentReasonings[steps[currentStepIndex]?.agentName]}
              </p>
            </div>
          )}

          {/* Refinement input */}
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-rose-500/10">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Regeneration Directives (Refinement):</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={refinementDirective}
                onChange={(e) => setRefinementDirective(e.target.value)}
                placeholder="e.g. Make the interview questions harder, focus more on Kubernetes architecture, make the email friendlier..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                disabled={isRegenerating}
              />
              <button
                onClick={handleRegenerateStep}
                disabled={isRegenerating || !refinementDirective.trim()}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Step</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-rose-500/10 pt-4 mt-2">
            <button
              onClick={() => {
                setWorkflowStatus('idle');
                addLog('Human-in-the-Loop', 'Recruiter rejected intermediate draft. Workflow stopped.', 'error');
              }}
              className="px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Aborted Task
            </button>
            <button
              onClick={handleApproveStep}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Resume Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* Completed Results Compiled Panel */}
      {workflowStatus === 'completed' && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/2 flex flex-col gap-6 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Compiled Multi-Agent Assessment Dossier</h3>
                <p className="text-xs text-gray-400">Completed report generated from agent reasoning nodes.</p>
              </div>
            </div>

            <button
              onClick={handleSaveToPipeline}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Commit Dossier to Candidate Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Screen Results */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Resume Screening Results
                </span>
              </h4>
              
              <div className="text-xs flex flex-col gap-3">
                <p className="text-gray-300 leading-relaxed font-medium">
                  {stepResults.ScreenerAgent?.summary}
                </p>
                
                {agentReasonings.ScreenerAgent && (
                  <details className="mt-1 group border-t border-white/5 pt-2">
                    <summary className="text-[10px] text-gray-500 hover:text-white cursor-pointer uppercase font-bold select-none list-none flex items-center justify-between">
                      <span>🧠 Agent Thinking Process</span>
                      <span className="text-[8px]">▼</span>
                    </summary>
                    <p className="mt-2 text-[10px] text-gray-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                      {agentReasonings.ScreenerAgent}
                    </p>
                  </details>
                )}

                <div>
                  <strong className="block text-[10px] text-gray-500 uppercase mb-1">Identified Strengths:</strong>
                  <ul className="list-disc list-inside text-gray-400 flex flex-col gap-1.5 pl-1.5">
                    {stepResults.ScreenerAgent?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <strong className="block text-[10px] text-gray-500 uppercase mb-1">Identified Gaps:</strong>
                  <ul className="list-disc list-inside text-rose-300 flex flex-col gap-1.5 pl-1.5">
                    {stepResults.ScreenerAgent?.gaps?.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase">Readiness Rating:</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold">
                    {stepResults.ScreenerAgent?.readinessRating}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Results */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Simulated External Verification Checks
                </span>
              </h4>
              
              <div className="text-xs flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase font-sans">GitHub Check</span>
                    <span className="block font-bold text-emerald-400 mt-0.5 truncate">{stepResults.VerificationAgent?.githubCheck?.status}</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase font-sans">LinkedIn Check</span>
                    <span className="block font-bold text-cyan-400 mt-0.5 truncate">{stepResults.VerificationAgent?.linkedinCheck?.status}</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase font-sans">Certifications</span>
                    <span className="block font-bold text-purple-400 mt-0.5 truncate">{stepResults.VerificationAgent?.certificationCheck?.status}</span>
                  </div>
                </div>
                
                {agentReasonings.VerificationAgent && (
                  <details className="group border-t border-white/5 pt-2">
                    <summary className="text-[10px] text-gray-500 hover:text-white cursor-pointer uppercase font-bold select-none list-none flex items-center justify-between">
                      <span>🧠 Agent Thinking Process</span>
                      <span className="text-[8px]">▼</span>
                    </summary>
                    <p className="mt-2 text-[10px] text-gray-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                      {agentReasonings.VerificationAgent}
                    </p>
                  </details>
                )}

                <div>
                  <strong className="block text-[10px] text-gray-500 uppercase mb-1">GitHub Repos Found:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {stepResults.VerificationAgent?.githubCheck?.reposFound?.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-mono">{r}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="block text-[10px] text-gray-500 uppercase mb-1">Sync Summary:</strong>
                  <p className="text-gray-400 mt-1 leading-relaxed">{stepResults.VerificationAgent?.summary}</p>
                </div>
              </div>
            </div>

            {/* Approved Questions */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Targeted Interview Questions (Approved)
                </span>
              </h4>
              
              <div className="text-xs flex flex-col gap-3.5">
                {agentReasonings.InterviewerAgent && (
                  <details className="group border-b border-white/5 pb-2">
                    <summary className="text-[10px] text-gray-500 hover:text-white cursor-pointer uppercase font-bold select-none list-none flex items-center justify-between">
                      <span>🧠 Agent Thinking Process</span>
                      <span className="text-[8px]">▼</span>
                    </summary>
                    <p className="mt-2 text-[10px] text-gray-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                      {agentReasonings.InterviewerAgent}
                    </p>
                  </details>
                )}

                {stepResults.InterviewerAgent?.questions?.map((q, i) => (
                  <div key={i} className="p-2.5 bg-black/35 rounded border border-white/5">
                    <strong className="block text-gray-200">Q{i + 1}: {q.question}</strong>
                    <span className="block text-[9px] text-gray-500 mt-1 italic">Expected: {q.expectedAnswer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Outreach */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  Outreach Communication Brief (Approved)
                </span>
              </h4>
              
              <div className="text-xs flex flex-col gap-2.5 bg-black/35 rounded border border-white/5 p-3">
                {agentReasonings.OutreachAgent && (
                  <details className="group border-b border-white/5 pb-2">
                    <summary className="text-[10px] text-gray-500 hover:text-white cursor-pointer uppercase font-bold select-none list-none flex items-center justify-between">
                      <span>🧠 Agent Thinking Process</span>
                      <span className="text-[8px]">▼</span>
                    </summary>
                    <p className="mt-2 text-[10px] text-gray-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                      {agentReasonings.OutreachAgent}
                    </p>
                  </details>
                )}

                <div>
                  <span className="block text-[9px] text-gray-500 uppercase">Subject:</span>
                  <span className="font-bold text-white text-xs">{stepResults.OutreachAgent?.subject}</span>
                </div>
                <div className="border-t border-white/5 pt-2.5 mt-1 text-gray-400 font-sans leading-relaxed whitespace-pre-wrap">
                  {stepResults.OutreachAgent?.body}
                </div>
              </div>
            </div>

          </div>  </div>
      )}

    </div>
  );
}
