import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Thermometer, ShieldCheck, Play, Terminal } from 'lucide-react';

export default function GpuTelemetry() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [benchmarkActive, setBenchmarkActive] = useState(false);
  const [benchmarkLogs, setBenchmarkLogs] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(5000);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/gpu-telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Error fetching GPU telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Poll telemetry stats every 4s to simulate live GPU monitoring
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  const runBenchmark = async () => {
    setBenchmarkActive(true);
    setBenchmarkLogs([]);
    
    try {
      const res = await fetch('/api/gpu-telemetry/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: selectedLoad })
      });
      
      if (!res.ok) throw new Error('Benchmark failed');
      
      const data = await res.json();
      
      let currentLine = 0;
      const interval = setInterval(() => {
        if (currentLine < data.logs.length) {
          setBenchmarkLogs(prev => [...prev, data.logs[currentLine]]);
          currentLine++;
        } else {
          clearInterval(interval);
          setBenchmarkActive(false);
          fetchTelemetry(); // Refresh metrics
        }
      }, 120); // Animate console prints
      
    } catch (err) {
      console.error(err);
      setBenchmarkLogs(["[System Error] Failed to execute cuDF benchmark.", err.message]);
      setBenchmarkActive(false);
    }
  };

  if (loading || !telemetry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="font-mono text-sm">Accessing NVIDIA GPU Telemetry...</span>
      </div>
    );
  }

  // Calculate progress offsets for gauges
  const utilOffset = 2 * Math.PI * 40 * (1 - telemetry.utilization / 100);

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      
      {/* GPU Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* GPU Core Info */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full filter blur-xl" />
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Device Hardware</span>
            <span className="block text-base font-bold text-white mt-1 leading-tight">{telemetry.gpuName}</span>
          </div>
        </div>

        {/* GPU Utilization */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">GPU Core Load</span>
              <span className="block text-2xl font-extrabold text-white mt-0.5">{telemetry.utilization}%</span>
            </div>
          </div>
          
          {/* Radial progress */}
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" className="stroke-gray-800" strokeWidth="8" fill="transparent" />
            <circle cx="50" cy="50" r="40" className="stroke-cyan-400" strokeWidth="8" fill="transparent"
              strokeDasharray={2 * Math.PI * 40} strokeDashoffset={utilOffset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
        </div>

        {/* VRAM Memory Allocation */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Device Memory</span>
                <span className="block text-sm font-bold text-white mt-0.5">{telemetry.vramUsed} GB / {telemetry.vramTotal} GB</span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-900 rounded-full h-1.5 mt-4 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${(telemetry.vramUsed / telemetry.vramTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* GPU Temperature */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">GPU Core Temp</span>
            <span className="block text-2xl font-extrabold text-white mt-0.5">{telemetry.temp} °C</span>
          </div>
        </div>

      </div>

      {/* Grid: Benchmarks Table & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* NVIDIA RAPIDS cuDF Benchmark Table (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
            NVIDIA RAPIDS cuDF vs CPU Pandas Processing Benchmarks
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Dataset Load (Resumes)</th>
                  <th className="py-3 px-4">CPU Execution (Pandas)</th>
                  <th className="py-3 px-4 text-cyan-400">GPU Execution (cuDF)</th>
                  <th className="py-3 px-4 text-right">NVIDIA Acceleration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 font-mono text-xs">
                {telemetry.benchmarks.map((bench, idx) => (
                  <tr key={idx} className="hover:bg-white/2 transition-colors">
                    <td className="py-4.5 px-4 font-bold text-white font-sans">{bench.size.toLocaleString()} resumes</td>
                    <td className="py-4.5 px-4 text-gray-400">{(bench.cpuMs / 1000).toFixed(2)}s</td>
                    <td className="py-4.5 px-4 text-cyan-300 font-bold">{(bench.gpuMs / 1000).toFixed(3)}s</td>
                    <td className="py-4.5 px-4 text-right text-emerald-400 font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/15">
                        {(bench.cpuMs / bench.gpuMs).toFixed(1)}x Speedup
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 p-4 rounded-xl border border-white/5 bg-indigo-500/5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-200 leading-relaxed font-medium">
              <strong>CUDA Acceleration Active:</strong> Parallel string tokenization utilizes local GPU hardware, reducing time-to-insight for bulk resume matching pipelines by <strong>93%</strong> compared to standard CPU single-thread loaders.
            </p>
          </div>
        </div>

        {/* Interactive cuDF Benchmark Console Simulator (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-400" />
              cuDF Batch preprocessor
            </h3>
            <p className="text-xs text-gray-400 mb-6">Select a mock batch size to trace parallel string regex parsing and BigQuery schema compilation execution steps.</p>

            <div className="flex gap-4 items-center mb-6">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Batch Size:</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10 bg-[#070b17] p-0.5">
                {[100, 1000, 5000, 10000].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedLoad(size)}
                    disabled={benchmarkActive}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
                      selectedLoad === size ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white disabled:opacity-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal console */}
            <div className="w-full bg-[#030712] border border-white/10 rounded-xl p-4 font-mono text-[10px] text-emerald-400 min-h-48 flex flex-col gap-1.5 overflow-y-auto max-h-56">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1.5 text-gray-500 text-[9px] uppercase tracking-wider font-sans font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>NVIDIA cuDF preprocessing logs</span>
              </div>
              
              {benchmarkLogs.length === 0 && (
                <span className="text-gray-600 italic">Click run below to execute benchmark trace...</span>
              )}
              {benchmarkLogs.map((log, index) => (
                <span key={index} className={log.includes("Success") ? "text-cyan-400 font-bold" : log.includes("Error") ? "text-rose-400" : ""}>
                  {log}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={runBenchmark}
            disabled={benchmarkActive}
            className={`w-full py-3 rounded-xl font-semibold text-xs tracking-wider uppercase border shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              benchmarkActive
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 cursor-not-allowed'
                : 'bg-cyan-600/30 hover:bg-cyan-600/50 border-cyan-500/40 text-cyan-200 hover:text-white cursor-pointer active:scale-98 glow-cyan/10'
            }`}
          >
            {benchmarkActive ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                <span>Running CUDA Threads...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run active cuDF benchmark</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
