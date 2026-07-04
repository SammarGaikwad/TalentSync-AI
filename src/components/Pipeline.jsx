import React, { useState } from 'react';
import { Search, Eye, Trash2, Calendar, FileUser, BrainCircuit } from 'lucide-react';

export default function Pipeline({ candidates, onViewCandidate, onDeleteCandidate, onLaunchAgent, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter candidates based on name or competencies
  const filteredCandidates = candidates.filter(candidate => {
    const nameMatch = candidate.candidate_name.toLowerCase().includes(searchTerm.toLowerCase());
    const competenciesMatch = candidate.core_competencies?.some(comp => 
      comp.toLowerCase().includes(searchTerm.toLowerCase())
    ) || false;
    return nameMatch || competenciesMatch;
  });

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 5) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full animate-fade-in flex flex-col gap-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or core competency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-panel-interactive border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:glow-violet/10"
          />
        </div>
        
        <div className="text-xs text-gray-400 font-mono">
          Showing {filteredCandidates.length} of {candidates.length} candidates
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-4 text-center">Tech Rating</th>
                <th className="py-4 px-4 text-center">Leadership</th>
                <th className="py-4 px-4 text-center">Job Fit</th>
                <th className="py-4 px-6">Key Competencies</th>
                <th className="py-4 px-6 text-center">Date Analyzed</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <span>Loading candidate data pipeline...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-500 font-medium">
                    <FileUser className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <span>No candidates match your search filters or pipeline is empty.</span>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr 
                    key={candidate.id} 
                    className="hover:bg-white/3 transition-colors group cursor-pointer"
                    onClick={() => onViewCandidate(candidate)}
                  >
                    {/* Name column */}
                    <td className="py-4.5 px-6 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-extrabold text-xs">
                          {candidate.candidate_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block group-hover:text-cyan-400 transition-colors">{candidate.candidate_name}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Technical Score */}
                    <td className="py-4.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${getScoreColor(candidate.technical_score)}`}>
                        {candidate.technical_score}/10
                      </span>
                    </td>
                    
                    {/* Leadership Score */}
                    <td className="py-4.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${getScoreColor(candidate.leadership_score)}`}>
                        {candidate.leadership_score}/10
                      </span>
                    </td>

                    {/* Job Fit Alignment */}
                    <td className="py-4.5 px-4 text-center">
                      {candidate.job_alignment_score !== undefined ? (
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${getScoreColor(candidate.job_alignment_score)}`}>
                          {candidate.job_alignment_score}/10
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">N/A</span>
                      )}
                    </td>
                    
                    {/* Key Competencies tags (rendered clean) */}
                    <td className="py-4.5 px-6 max-w-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.core_competencies?.slice(0, 3).map((comp, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 border border-white/5 text-gray-400"
                          >
                            {comp}
                          </span>
                        ))}
                        {candidate.core_competencies?.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/10 text-indigo-300">
                            +{candidate.core_competencies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Date Analyzed */}
                    <td className="py-4.5 px-6 text-center text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(candidate.analyzedAt)}</span>
                      </div>
                    </td>
                    
                    {/* Action buttons */}
                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onLaunchAgent && onLaunchAgent(candidate)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
                          title="Launch Agent Mission"
                        >
                          <BrainCircuit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewCandidate(candidate)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCandidate(candidate.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors"
                          title="Delete candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
