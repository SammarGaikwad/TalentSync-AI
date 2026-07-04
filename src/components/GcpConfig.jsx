import React, { useState, useEffect } from 'react';
import { Database, CloudLightning, Info, CheckCircle, BrainCircuit } from 'lucide-react';

export default function GcpConfig({ onGcsSyncSuccess }) {
  const [bucketName, setBucketName] = useState('gs://talentsync-candidate-resumes');
  const [bqTable, setBqTable] = useState('gcp-talent-project.warehouse.evaluations');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  
  // States for actions
  const [isGcsSyncing, setIsGcsSyncing] = useState(false);
  const [gcsSyncResult, setGcsSyncResult] = useState(null);
  
  const [isBqExporting, setIsBqExporting] = useState(false);
  const [bqExportResult, setBqExportResult] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.geminiModel) {
            setGeminiModel(data.geminiModel);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleModelSelect = async (model) => {
    setGeminiModel(model);
    try {
      const getRes = await fetch('/api/settings');
      if (getRes.ok) {
        const settings = await getRes.json();
        settings.geminiModel = model;
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
      }
    } catch (err) {
      console.error('Error saving model settings:', err);
    }
  };

  const handleGcsSync = async (e) => {
    e.preventDefault();
    setIsGcsSyncing(true);
    setGcsSyncResult(null);
    
    try {
      const res = await fetch('/api/gcs-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName })
      });
      if (res.ok) {
        const data = await res.json();
        setGcsSyncResult(data);
        if (onGcsSyncSuccess) {
          onGcsSyncSuccess(); // Refresh candidates pipeline
        }
      }
    } catch (err) {
      console.error('GCS Sync error:', err);
    } finally {
      setIsGcsSyncing(false);
    }
  };

  const handleBqExport = async (e) => {
    e.preventDefault();
    setIsBqExporting(true);
    setBqExportResult(null);

    try {
      const res = await fetch('/api/bigquery-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableDestination: bqTable })
      });
      if (res.ok) {
        const data = await res.json();
        setBqExportResult(data);
      }
    } catch (err) {
      console.error('BigQuery export error:', err);
    } finally {
      setIsBqExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      
      {/* Top Info Alert */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-indigo-500/5 flex gap-4 text-sm text-indigo-200">
        <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-white mb-0.5">Google Cloud & NVIDIA Acceleration Layer</strong>
          TalentSync AI runs pre-processing string manipulations using GPU-accelerated **NVIDIA cuDF** on GKE before transmitting text tokens to **Gemini**. The evaluated parameters are warehoused in **BigQuery** for multi-dimensional business reports.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: GCS Bucket Sync */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
              GCS Bucket Ingestion
            </h3>
            <p className="text-xs text-gray-400 mb-6">Scan and ingest bulk candidate resumes stored in a Google Cloud Storage bucket.</p>

            <form onSubmit={handleGcsSync} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bucket URI:</label>
                <input
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#070b17]/60 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGcsSyncing}
                className="w-full py-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGcsSyncing ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                    <span>Syncing Cloud Storage...</span>
                  </>
                ) : (
                  <>
                    <CloudLightning className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Scan & Sync GCS Bucket</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sync Results */}
          {gcsSyncResult && (
            <div className="mt-6 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Bucket Synchronized Successfully</span>
              </div>
              <ul className="text-[11px] text-gray-400 flex flex-col gap-1 font-mono">
                <li>• Files Found: {gcsSyncResult.filesFound.length}</li>
                <li>• Ingested Candidates: {gcsSyncResult.addedCandidatesCount}</li>
                <li>• Mode: {gcsSyncResult.simulated ? "Cloud Sandbox Simulation" : "Production Google Cloud Bucket"}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: BigQuery Warehouse Export */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-400" />
              BigQuery Warehouse Sync
            </h3>
            <p className="text-xs text-gray-400 mb-6">Warehouse candidate evaluations into Google BigQuery datasets to run aggregate analytics.</p>

            <form onSubmit={handleBqExport} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dataset Table Destination:</label>
                <input
                  type="text"
                  value={bqTable}
                  onChange={(e) => setBqTable(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#070b17]/60 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isBqExporting}
                className="w-full py-3 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBqExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                    <span>Writing to BigQuery...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sync Pipeline to BigQuery</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Export Results */}
          {bqExportResult && (
            <div className="mt-6 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>BigQuery Data Warehouse Synced</span>
              </div>
              <ul className="text-[11px] text-gray-400 flex flex-col gap-1 font-mono">
                <li>• Rows Exported: {bqExportResult.exportedCount}</li>
                <li>• Table Schema: JSON Assessment</li>
                <li>• Mode: {bqExportResult.simulated ? "Cloud Sandbox Simulation" : "Production BigQuery Dataset"}</li>
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* Row 3: Gemini Enterprise Platform Selection */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-purple-500" />
          Gemini Enterprise Model Settings
        </h3>
        <p className="text-xs text-gray-400 mb-6">Select the LLM engine for structured candidate evaluation analysis.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gemini Flash */}
          <div 
            onClick={() => handleModelSelect('gemini-2.5-flash')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-4 ${
              geminiModel === 'gemini-2.5-flash'
                ? 'border-purple-500/40 bg-purple-500/5'
                : 'border-white/5 bg-[#070b17]/40 hover:border-white/10 hover:bg-white/2'
            }`}
          >
            <BrainCircuit className="w-8 h-8 text-purple-400 shrink-0 mt-1" />
            <div>
              <strong className="block text-sm text-white">Gemini 2.5 Flash</strong>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">High-performance speed optimized for batch uploader analysis and quick pipeline screenings.</p>
            </div>
          </div>
 
          {/* Gemini Pro */}
          <div 
            onClick={() => handleModelSelect('gemini-2.5-pro')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-4 ${
              geminiModel === 'gemini-2.5-pro'
                ? 'border-purple-500/40 bg-purple-500/5'
                : 'border-white/5 bg-[#070b17]/40 hover:border-white/10 hover:bg-white/2'
            }`}
          >
            <BrainCircuit className="w-8 h-8 text-cyan-400 shrink-0 mt-1" />
            <div>
              <strong className="block text-sm text-white">Gemini 2.5 Pro (Recommended for Deep Screening)</strong>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Maximum reasoning quality for complex technical validation questions and detailed red flag checks.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
