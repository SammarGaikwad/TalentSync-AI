import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, RefreshCw, Cpu, Briefcase } from 'lucide-react';

export default function CandidateIngestion({ onAnalysisSuccess, onAnalysisStart, isLoading, error, setError }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef(null);
  
  // Bulk processing file state
  const [bulkFiles, setBulkFiles] = useState([]);
  
  // Job Description states
  const [showJdInput, setShowJdInput] = useState(false);
  const [jdType, setJdType] = useState('text'); // 'text' | 'file'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const jdFileInputRef = useRef(null);

  const steps = [
    "Parsing document buffers...",
    "Sending request packets to Gemini...",
    "Mapping skills and credentials...",
    "Validating capability indexes...",
    "Writing evaluations to database..."
  ];

  // Rotate loading steps for visual feedback
  const runLoadingSteps = () => {
    setLoadingStep(0);
    const intervals = [1200, 2400, 4500, 7000];
    const timers = [];
    
    intervals.forEach((time, index) => {
      const t = setTimeout(() => {
        setLoadingStep(index + 1);
      }, time);
      timers.push(t);
    });

    return () => timers.forEach(t => clearTimeout(t));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Branch between single resume analysis and bulk analysis
  const processFiles = async (files) => {
    if (files.length === 1) {
      processSingleFile(files[0]);
      return;
    }

    // Filter valid PDFs
    const validPdfs = files.filter(file => file.type === "application/pdf");
    if (validPdfs.length === 0) {
      setError("No valid PDF files selected. Please upload PDF files only.");
      return;
    }

    const overSized = validPdfs.some(file => file.size > 10 * 1024 * 1024);
    if (overSized) {
      setError("One or more files exceed the 10MB size limit.");
      return;
    }

    // Setup bulk state
    setFileName(`${validPdfs.length} Resumes`);
    setBulkFiles(validPdfs.map(f => ({ name: f.name, status: 'processing' })));
    setError(null);
    onAnalysisStart();
    const cleanupSteps = runLoadingSteps();

    const formData = new FormData();
    validPdfs.forEach(file => {
      formData.append('resumes', file);
    });

    if (showJdInput) {
      if (jdType === 'file' && jdFile) {
        formData.append('jobDescription', jdFile);
      } else if (jdType === 'text' && jdText.trim().length > 0) {
        formData.append('jobDescriptionText', jdText);
      }
    }

    try {
      const response = await fetch('/api/analyze-resume-bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze files in batch.');
      }

      const result = await response.json();
      onAnalysisSuccess(result); // Pass results back
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during batch ingestion.');
    } finally {
      cleanupSteps();
      setBulkFiles([]);
    }
  };

  // Single resume analysis
  const processSingleFile = async (file) => {
    if (file.type !== "application/pdf") {
      setError("Unsupported format. Please upload a valid PDF resume.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds size limit of 10MB.");
      return;
    }

    setFileName(file.name);
    setBulkFiles([]);
    setError(null);
    onAnalysisStart();
    const cleanupSteps = runLoadingSteps();

    const formData = new FormData();
    formData.append('resume', file);
    
    if (showJdInput) {
      if (jdType === 'file' && jdFile) {
        formData.append('jobDescription', jdFile);
      } else if (jdType === 'text' && jdText.trim().length > 0) {
        formData.append('jobDescriptionText', jdText);
      }
    }

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume. Please check server connectivity.');
      }

      const result = await response.json();
      onAnalysisSuccess(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please verify your connection.');
    } finally {
      cleanupSteps();
    }
  };

  const loadDemoProfile = () => {
    setFileName("Sample_Resume_Sarah_Jenkins.pdf");
    onAnalysisStart();
    const demoJson = {
      candidate_name: "Sarah Jenkins",
      technical_score: 9,
      leadership_score: 8,
      core_competencies: ["Python", "Go", "Docker", "Kubernetes", "AWS", "Terraform", "gRPC", "Prometheus"],
      red_flags: ["No Kubernetes certifications listed, though has 4 years production experience."],
      recommended_interview_questions: [
        "Explain how you would handle persistent volume state migration across Kubernetes namespace clusters.",
        "Describe your experience debugging high-load worker bottleneck latency under event-driven architectures."
      ],
      job_alignment_score: 9,
      alignment_explanation: "Sarah Jenkins is an exceptional technical match with over 5 years of Cloud Architecture experience, deploying containers on Kubernetes, and writing Infrastructure-as-code using Terraform. She matches 95% of the core competencies.",
      missing_qualifications: ["Certified Kubernetes Administrator (CKA)"]
    };
    
    // Simulate loader state changes
    setLoadingStep(0);
    setTimeout(() => setLoadingStep(1), 300);
    setTimeout(() => setLoadingStep(2), 600);
    setTimeout(() => setLoadingStep(3), 900);
    setTimeout(() => setLoadingStep(4), 1200);

    setTimeout(() => {
      onAnalysisSuccess(demoJson);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Upload Box */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!isLoading ? onButtonClick : undefined}
        className={`relative overflow-hidden rounded-2xl glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed text-center transition-all duration-300 ${
          isLoading ? 'border-indigo-500/40 bg-indigo-950/10 cursor-not-allowed' :
          isDragActive ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01] glow-cyan' : 
          error ? 'border-rose-500/50 bg-rose-950/10 hover:border-rose-400/70 cursor-pointer' :
          'border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer glow-violet/10'
        }`}
      >
        {/* Hidden File Input (supports multiple selections) */}
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".pdf" 
          onChange={handleFileChange}
          disabled={isLoading}
          multiple
        />

        {/* Scanning Line Animation during loading */}
        {isLoading && <div className="scanning-line" />}

        {/* Main Body States */}
        {isLoading ? (
          <div className="flex flex-col items-center py-4 w-full">
            <div className="relative w-14 h-14 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin" />
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-bold tracking-wide text-white mb-1.5 text-gradient-shimmer">
              Analyzing {fileName}
            </h3>
            
            <p className="text-xs text-gray-400 min-h-5 transition-all duration-300 font-mono">
              {steps[loadingStep] || "Processing..."}
            </p>

            {/* If Bulk, render individual progress list */}
            {bulkFiles.length > 0 && (
              <div className="w-full max-w-sm mt-5 text-left flex flex-col gap-2 max-h-36 overflow-y-auto px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                {bulkFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-b-0">
                    <span className="text-gray-300 truncate pr-4">{file.name}</span>
                    <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Queueing
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Subtle Progress Bar */}
            <div className="w-48 bg-gray-900/60 rounded-full h-1.5 mt-5 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(loadingStep + 1) * 20}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            {error ? (
              <div className="w-12 h-12 rounded-full bg-rose-950/30 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-300 transition-all duration-300 hover:text-white group-hover:scale-110">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
            )}

            <h3 className="text-xl font-bold text-white mb-2">
              {error ? "Analysis Failed" : "Upload Resume Documents"}
            </h3>
            
            <p className="text-sm text-gray-400 max-w-sm mb-4 leading-relaxed">
              {error ? error : "Drag and drop one or more candidate CVs (PDF format, max 10MB each) to generate structured evaluation assessments."}
            </p>
            
            <button 
              type="button"
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 border shadow-lg ${
                error ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40' :
                'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200 hover:text-white'
              }`}
            >
              {error ? (
                <>
                  <RefreshCw className="w-4 h-4" /> Try Again
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Browse PDF Resumes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Demo helper */}
      {!isLoading && (
        <div className="flex items-center justify-center -mt-2">
          <button
            type="button"
            onClick={loadDemoProfile}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-1.5 transition-colors p-1"
          >
            ✨ Don't have a resume PDF? Experience with a pre-loaded Demo Profile
          </button>
        </div>
      )}

      {/* Job Description Matching Form */}
      {!isLoading && (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                id="jd-toggle"
                type="checkbox"
                checked={showJdInput}
                onChange={(e) => setShowJdInput(e.target.checked)}
                className="w-4.5 h-4.5 text-indigo-600 border-gray-700 bg-gray-900 rounded focus:ring-indigo-500 focus:ring-offset-gray-950 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="jd-toggle" className="text-sm font-bold text-gray-300 select-none cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Match against Job Description requirements</span>
              </label>
            </div>
            
            {showJdInput && (
              <div className="flex rounded-lg overflow-hidden border border-white/10 bg-[#070b17] p-0.5">
                <button
                  type="button"
                  onClick={() => setJdType('text')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    jdType === 'text' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setJdType('file')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    jdType === 'file' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            )}
          </div>
          
          {showJdInput && (
            <div className="mt-4 animate-fade-in">
              {jdType === 'text' ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the job specifications, certifications, key tech stack, and experience requirements here to calculate candidate match alignment..."
                    rows="4"
                    className="w-full p-3.5 rounded-xl border border-white/5 bg-[#070b17]/60 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans leading-relaxed"
                  />
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-gray-500 font-medium">Provide JD to compare candidates technical stacks.</span>
                    <button
                      type="button"
                      onClick={() => setJdText("Position: Senior Cloud Solutions Engineer\n- Core Competencies: Python, Docker, Kubernetes, AWS, Infrastructure-as-code (Terraform)\n- Experience Required: 5+ years building and deploying scalable microservices\n- Soft Skills: Strong technical communication and cross-team collaboration")}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline transition-colors"
                    >
                      ✨ Auto-Fill Demo JD Requirements
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => jdFileInputRef.current.click()}
                  className="p-6 rounded-xl border border-dashed border-white/10 bg-[#070b17]/60 hover:bg-[#070b17]/80 cursor-pointer flex flex-col items-center justify-center text-center transition-colors group"
                >
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setJdFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-300 font-bold">
                    {jdFile ? jdFile.name : "Select Job Description PDF"}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1">PDF format only, max 5MB</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
