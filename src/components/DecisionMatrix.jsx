import React from 'react';
import { User, AlertOctagon, HelpCircle, CheckCircle, ArrowLeft, UserCheck, Download, FileSpreadsheet } from 'lucide-react';
import CircularGauge from './CircularGauge';

export default function DecisionMatrix({ data, onReset, onSave }) {
  const {
    candidate_name,
    technical_score,
    leadership_score,
    core_competencies = [],
    red_flags = [],
    recommended_interview_questions = [],
    job_alignment_score = 0,
    alignment_explanation = '',
    missing_qualifications = []
  } = data;

  const isSaved = !!data.id;
  const hasJobMatching = job_alignment_score > 0;

  // STEP 4 EXPORTS
  // CSV Export utility
  const handleExportCSV = () => {
    const csvContent = [
      ['TalentSync AI Assessment Report', ''],
      ['Candidate Name', candidate_name],
      ['Technical Score (1-10)', technical_score],
      ['Leadership Score (1-10)', leadership_score],
      ['Job Alignment Score (1-10)', hasJobMatching ? job_alignment_score : 'N/A'],
      ['Core Competencies', core_competencies.join(', ')],
      ['Red Flags', red_flags.join('; ')],
      ['Alignment Explanation', hasJobMatching ? alignment_explanation : 'N/A'],
      ['Missing Qualifications', hasJobMatching ? missing_qualifications.join(', ') : 'N/A'],
      ['Recommended Interview Questions', recommended_interview_questions.join('; ')]
    ].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TalentSync_${candidate_name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print triggers
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in print:max-w-none print:p-0">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 print:hidden">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel-interactive border-white/5 text-gray-300 hover:text-white text-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Analyze Another Resume</span>
        </button>
        
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel-interactive border-white/5 text-gray-300 hover:text-white text-sm"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          {/* PDF Print */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel-interactive border-white/5 text-gray-300 hover:text-white text-sm"
            title="Print report to PDF"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export PDF</span>
          </button>

          {/* Database Saving Actions */}
          {!isSaved && onSave ? (
            <button
              onClick={() => onSave(data)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-indigo-200 hover:text-white text-sm font-semibold transition-all duration-300"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Save to Pipeline</span>
            </button>
          ) : isSaved ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold select-none">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Saved in Database</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Print Assessment Title (Visible ONLY when printing) */}
      <div className="hidden print:block mb-8 border-b border-gray-300 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">TalentSync AI Candidate Assessment Report</h1>
        <p className="text-sm text-gray-500 mt-1">Generated dynamically via Gemini 2.5 Flash on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">
        
        {/* Left Side: Summary & Gauges & Skills (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 print:w-full print:mb-6">
          
          {/* Candidate Profile Panel */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden print:border-gray-300 print:text-black print:shadow-none">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none print:hidden" />
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg print:hidden">
                <div className="w-full h-full rounded-[14px] bg-[#0c101d] flex items-center justify-center">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white print:text-black">{candidate_name}</h2>
                <p className="text-sm text-gray-400 mt-0.5 print:text-gray-600">Candidate Evaluation Assessment Profile</p>
              </div>
            </div>
          </div>

          {/* Scores/Gauges Panel */}
          <div className="glass-panel rounded-2xl p-6 print:border-gray-300 print:text-black">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 print:text-black">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 print:bg-black" />
              Capability Scores
            </h3>
            
            <div className={`grid grid-cols-1 gap-6 print:grid-cols-3 ${hasJobMatching ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <CircularGauge
                score={technical_score}
                label="Technical Capability"
                gradientStart="#8b5cf6"
                gradientEnd="#6366f1"
                glowClass="glow-violet"
              />
              <CircularGauge
                score={leadership_score}
                label="Leadership Potential"
                gradientStart="#06b6d4"
                gradientEnd="#3b82f6"
                glowClass="glow-cyan"
              />
              {hasJobMatching && (
                <CircularGauge
                  score={job_alignment_score}
                  label="Job Alignment"
                  gradientStart="#10b981"
                  gradientEnd="#059669"
                  glowClass="glow-emerald"
                />
              )}
            </div>
          </div>

          {/* Job Match Fit Analysis Section */}
          {hasJobMatching && (
            <div className="glass-panel rounded-2xl p-6 print:border-gray-300 print:text-black">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black">
                <span className="w-1.5 h-4 rounded-full bg-emerald-400 print:bg-green-600" />
                Job Requirements Matching Fit
              </h3>
              
              <p className="text-sm text-gray-300 leading-relaxed bg-white/3 border border-white/5 rounded-xl p-4 mb-4 print:text-black print:bg-gray-100 print:border-gray-300">
                {alignment_explanation}
              </p>
              
              {missing_qualifications?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5 print:text-red-600">Identified Gaps / Missing Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {missing_qualifications.map((gap, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg font-semibold print:bg-red-100 print:text-red-700 print:border-red-300"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core Competencies Panel */}
          <div className="glass-panel rounded-2xl p-6 print:border-gray-300 print:text-black">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black">
              <span className="w-1.5 h-4 rounded-full bg-cyan-400 print:bg-blue-600" />
              Core Competencies
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {core_competencies.length > 0 ? (
                core_competencies.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/5 border border-cyan-500/20 text-cyan-300 transition-all duration-300 print:bg-gray-100 print:text-black print:border-gray-400"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm italic">No competency tags generated.</span>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Red Flags & Questions (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 print:w-full">
          
          {/* Red Flags Section */}
          <div className="glass-panel rounded-2xl p-6 print:border-gray-300 print:text-black">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black">
              <span className="w-1.5 h-4 rounded-full bg-rose-500 print:bg-red-600" />
              Risk Assessment / Red Flags
            </h3>
            
            {red_flags.length > 0 ? (
              <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 flex flex-col gap-3 print:bg-red-50 print:border-red-300">
                {red_flags.map((flag, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 print:text-red-600" />
                    <p className="text-rose-200 leading-relaxed font-medium print:text-red-800">{flag}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex gap-3 text-sm print:bg-green-50 print:border-green-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 print:text-green-600" />
                <p className="text-emerald-200 font-semibold print:text-green-800">No critical red flags or job-stability risks identified.</p>
              </div>
            )}
          </div>

          {/* Recommended Interview Questions */}
          <div className="glass-panel rounded-2xl p-6 print:border-gray-300 print:text-black">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black">
              <span className="w-1.5 h-4 rounded-full bg-amber-500 print:bg-yellow-600" />
              Targeted Interview Questions
            </h3>
            
            <div className="flex flex-col gap-4">
              {recommended_interview_questions.length > 0 ? (
                recommended_interview_questions.map((question, index) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-xl border border-white/5 bg-white/3 flex gap-3 text-sm print:bg-gray-50 print:border-gray-300 print:text-black"
                  >
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 print:text-yellow-600" />
                    <p className="text-gray-300 leading-relaxed font-medium print:text-gray-800">{question}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm italic">No custom interview questions generated.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
