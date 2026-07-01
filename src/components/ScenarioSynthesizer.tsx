import React, { useState } from "react";
import { GeneratedScenario } from "../types";
import { 
  Image as ImageIcon, 
  Sparkles, 
  Maximize2, 
  Download, 
  Grid, 
  Sliders, 
  HelpCircle, 
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface ScenarioSynthesizerProps {
  onAddScenario: (scenario: GeneratedScenario) => void;
  scenarios: GeneratedScenario[];
  apiKeyLoaded: boolean;
}

const RATIO_PRESETS = [
  { value: "1:1", label: "1:1 Square (1024x1024)" },
  { value: "3:4", label: "3:4 Portrait" },
  { value: "4:3", label: "4:3 Standard" },
  { value: "16:9", label: "16:9 Landscape widescreen" },
  { value: "9:16", label: "9:16 Mobile Tall" },
  { value: "2:3", label: "2:3 Editorial" },
  { value: "3:2", label: "3:2 DSLR Classic" },
  { value: "21:9", label: "21:9 Ultra Panoramic" }
];

const SIZE_PRESETS = ["1K", "2K", "4K"];

const INITIAL_SUGGESTIONS = [
  "A black security drone hovering near an industrial fuel depot at night, infrared green thermal camera, telemetry overlay",
  "A perimeter security camera frame showing a suspicious suspect climbing a tall barbed-wire fence under dark heavy rain",
  "Intruder breach scene, security response vehicle flashing blue lights parked near chemical refinery gate, dramatic dusk",
  "Hazard assessment, active heavy dark smoke escaping from an electrical server vault door, caution warning signs"
];

export default function ScenarioSynthesizer({
  onAddScenario,
  scenarios,
  apiKeyLoaded
}: ScenarioSynthesizerProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageSize, setImageSize] = useState("1K");
  const [selectedModel, setSelectedModel] = useState("gemini-3-pro-image-preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<GeneratedScenario | null>(scenarios[0] || null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const finalPrompt = prompt.trim() || INITIAL_SUGGESTIONS[0];
    
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          imageSize,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error("Generation endpoint error: " + response.status);
      }

      const data = await response.json();
      
      const newScenario: GeneratedScenario = {
        id: `scen-${Date.now()}`,
        prompt: finalPrompt,
        aspectRatio,
        imageSize,
        imageUrl: data.imageUrl,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString()
      };

      onAddScenario(newScenario);
      setActiveScenario(newScenario);
    } catch (error: any) {
      console.error(error);
      alert("Failed to synthesize image: " + (error.message || String(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="ai-scenario-synthesizer" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">SecOps Threat Image Synthesizer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate synthetic incident reference images for guard training and tactical simulations.
          </p>
        </div>

        {/* API Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${apiKeyLoaded ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"}`} />
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            {apiKeyLoaded ? "Pro Image Engine" : "Canvas Mock Active"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Control Box panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Synthesis Configuration
            </h3>

            {/* Model select */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Image Generation Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview (Studio quality)</option>
                <option value="gemini-3.1-flash-image-preview">gemini-3.1-flash-image-preview (Standard quality)</option>
              </select>
            </div>

            {/* Size selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                Resolution Target (imageSize)
                <span title="Pro image supports 1K, 2K and 4K output sizes" className="cursor-help">
                  <Info className="w-3 h-3 text-slate-500" />
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_PRESETS.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-1.5 text-xs font-bold rounded border transition-all ${
                      imageSize === sz
                        ? "bg-emerald-500 text-slate-950 border-emerald-500"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio select */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Canvas Aspect Ratio (aspectRatio)</label>
              <div className="grid grid-cols-2 gap-2">
                {RATIO_PRESETS.map((ratio) => (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`py-1.5 px-2 text-[10px] font-semibold rounded border text-left transition-all truncate ${
                      aspectRatio === ratio.value
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt generator */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Scenario Threat Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the synthetic incident scenario in detail..."
                className="w-full h-20 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Quick recommendations */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Suggested Scenario Templates</span>
            <div className="space-y-1.5">
              {INITIAL_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="w-full p-2 bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 text-left rounded text-xs text-slate-400 hover:text-slate-200 transition-all truncate block"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display synthesise results */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-center items-center p-4">
            {activeScenario ? (
              <div className="space-y-4 w-full h-full flex flex-col justify-between">
                
                {/* Live canvas display container respecting ratios */}
                <div className="flex-1 flex justify-center items-center min-h-[220px] max-h-[340px]">
                  <img
                    src={activeScenario.imageUrl}
                    alt={activeScenario.prompt}
                    className="max-h-[300px] rounded-lg border border-slate-800 shadow-2xl object-contain"
                  />
                </div>

                <div className="border-t border-slate-900 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-semibold text-slate-200 truncate pr-4">{activeScenario.prompt}</span>
                    <span className="text-[10px] font-mono shrink-0 bg-slate-900 px-2 py-0.5 rounded text-emerald-400">
                      {activeScenario.aspectRatio} | {activeScenario.imageSize}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="font-mono uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {activeScenario.timestamp}
                    </span>
                    <span className="font-mono uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {activeScenario.model}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <ImageIcon className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-400">No threat scenario images synthesized yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Configure aspect ratio, specify resolution and hit synthesize to generate custom security training reference frames.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 rounded-lg text-xs font-bold tracking-wider cursor-pointer uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isGenerating
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold"
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
                SYNTHESIZING TRAINING SCENARIO IMAGE (VEO ENGINE)...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                SYNTHESIZE SCENARIO WITH {selectedModel.toUpperCase()}
              </>
            )}
          </button>

          {/* Scenarios generated list row */}
          {scenarios.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Generated Scenarios History ({scenarios.length})</span>
              <div className="flex gap-2 overflow-x-auto pb-2 pr-1 scrollbar-thin">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenario(sc)}
                    className={`w-20 h-20 shrink-0 rounded-lg border overflow-hidden relative group transition-all ${
                      activeScenario?.id === sc.id
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <img src={sc.imageUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <Maximize2 className="w-4 h-4 text-slate-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
