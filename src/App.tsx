import React, { useState, useRef, useEffect } from "react";
import { CardData, CardImage, GoalItem, CardLayout } from "./types";
import { PRESET_THEMES } from "./data/themes";
import { GoalCardPreview } from "./components/GoalCardPreview";
import {
  enhanceGoalText,
  suggestCaptions,
  EnhancedGoals,
} from "./lib/api";
import {
  exportToImage,
  exportToPDF,
  exportToPowerPoint,
  exportToWordDocument,
} from "./lib/export";
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  FileText,
  Presentation,
  FileCode,
  CheckCircle,
  HelpCircle,
  User,
  Calendar,
  Layers,
  BarChart,
  Quote,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  Info
} from "lucide-react";

// Pre-defined sample base64 placeholder image to showcase default card design
const DEFAULT_PREVIEW_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><rect width='100%' height='100%' fill='%23022C22'/><circle cx='400' cy='225' r='180' fill='%23059669' opacity='0.3'/><circle cx='300' cy='180' r='100' fill='%23F59E0B' opacity='0.2'/><path d='M150 350 L350 200 L550 320 L750 180' stroke='%2334D399' stroke-width='4' fill='none' opacity='0.6'/><text x='50%' y='50%' font-family='sans-serif' font-size='24' fill='%23F3F4F6' text-anchor='middle' dominant-baseline='middle'>Visualize Your Daily Peak Performance</text></svg>";

const INITIAL_CARD_DATA: CardData = {
  title: "Daily Focus & Strategy",
  subtitle: "High impact execution and mental clarity framework",
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  userName: "Alex Rivers",
  goals: [
    {
      id: "g1",
      title: "Deliver core product blueprint deck",
      description: "Complete presentation slides, highlight scaling benchmarks & roadmap.",
      priority: "high",
      completed: true,
    },
    {
      id: "g2",
      title: "Conduct 1:1 engineering alignment sync",
      description: "Resolve blockers around the state manager and deployment pipeline.",
      priority: "medium",
      completed: false,
    },
    {
      id: "g3",
      title: "60 mins deep focus on system architecture",
      description: "Draft database indices schema and review API endpoints limits.",
      priority: "high",
      completed: false,
    },
  ],
  images: [
    {
      id: "img1",
      url: DEFAULT_PREVIEW_IMAGE,
      name: "peak_performance_vision.png",
      caption: "Consistency over intensity. Small wins daily stack up into massive leverage.",
      filter: "none",
      aspectRatio: "16:9",
    },
  ],
  footerQuote: "The secret of getting ahead is getting started. Focus entirely on the immediate task at hand.",
  themeId: "geometric-balance",
  layout: "dual-column",
  showProgress: true,
  progressStyle: "bar",
};

export default function App() {
  const [cardData, setCardData] = useState<CardData>(INITIAL_CARD_DATA);
  const [activeThemeId, setActiveThemeId] = useState<string>("geometric-balance");

  // Input states for goals
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalPriority, setNewGoalPriority] = useState<"high" | "medium" | "low">("medium");

  // AI loading and selection states
  const [isEnhancingGoal, setIsEnhancingGoal] = useState(false);
  const [enhancedGoalOptions, setEnhancedGoalOptions] = useState<EnhancedGoals | null>(null);
  const [isSuggestingCaptions, setIsSuggestingCaptions] = useState<string | null>(null); // holds image ID
  const [suggestedCaptionsList, setSuggestedCaptionsList] = useState<string[] | null>(null);
  const [selectedTargetImageForAI, setSelectedTargetImageForAI] = useState<string | null>(null);

  // Status and error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null); // "png", "pdf", etc.

  const cardRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = PRESET_THEMES.find((t) => t.id === activeThemeId) || PRESET_THEMES[0];

  // Auto-sync theme details when clicked
  useEffect(() => {
    setCardData((prev) => ({ ...prev, themeId: activeThemeId }));
  }, [activeThemeId]);

  // Goal handlers
  const handleAddGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newItem: GoalItem = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim(),
      priority: newGoalPriority,
      completed: false,
    };

    setCardData((prev) => ({
      ...prev,
      goals: [...prev.goals, newItem],
    }));

    // Clear inputs
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalPriority("medium");
    setEnhancedGoalOptions(null);
  };

  const handleToggleGoal = (id: string) => {
    setCardData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setCardData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  };

  const handleMoveGoal = (index: number, direction: "up" | "down") => {
    const newGoals = [...cardData.goals];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newGoals.length) {
      const temp = newGoals[index];
      newGoals[index] = newGoals[targetIndex];
      newGoals[targetIndex] = temp;

      setCardData((prev) => ({ ...prev, goals: newGoals }));
    }
  };

  // Image upload and processing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: CardImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            url: event.target.result as string,
            name: file.name,
            caption: "Freshly visualised focus anchor.",
            filter: "none",
            aspectRatio: "16:9",
          };

          setCardData((prev) => ({
            ...prev,
            images: [...prev.images, newImg],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (id: string) => {
    setCardData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
    if (selectedTargetImageForAI === id) {
      setSelectedTargetImageForAI(null);
      setSuggestedCaptionsList(null);
    }
  };

  const handleUpdateImageCaption = (id: string, caption: string) => {
    setCardData((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, caption } : img)),
    }));
  };

  const handleUpdateImageFilter = (id: string, filter: CardImage["filter"]) => {
    setCardData((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, filter } : img)),
    }));
  };

  // AI Helpers
  const triggerEnhanceGoal = async () => {
    if (!newGoalTitle.trim()) return;
    setIsEnhancingGoal(true);
    setErrorMessage(null);
    try {
      const options = await enhanceGoalText(newGoalTitle);
      setEnhancedGoalOptions(options);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to AI server. Please check your setup.");
    } finally {
      setIsEnhancingGoal(false);
    }
  };

  const applyEnhancedGoal = (text: string) => {
    setNewGoalTitle(text);
    setEnhancedGoalOptions(null);
  };

  const triggerSuggestCaptions = async (imgId: string) => {
    const img = cardData.images.find((i) => i.id === imgId);
    if (!img) return;

    setIsSuggestingCaptions(imgId);
    setSelectedTargetImageForAI(imgId);
    setErrorMessage(null);

    try {
      const mainGoalTitle = cardData.goals[0]?.title || cardData.title;
      const res = await suggestCaptions(mainGoalTitle, img.caption);
      setSuggestedCaptionsList(res.captions);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to suggest captions from AI.");
    } finally {
      setIsSuggestingCaptions(null);
    }
  };

  const applySuggestedCaption = (caption: string) => {
    if (!selectedTargetImageForAI) return;
    handleUpdateImageCaption(selectedTargetImageForAI, caption);
    setSuggestedCaptionsList(null);
    setSelectedTargetImageForAI(null);
  };

  // Reset to original preview data
  const handleResetCard = () => {
    if (window.confirm("Are you sure you want to reset all card settings back to defaults?")) {
      setCardData(INITIAL_CARD_DATA);
      setActiveThemeId("nordic-slate");
      setNewGoalTitle("");
      setNewGoalDesc("");
      setEnhancedGoalOptions(null);
      setSuggestedCaptionsList(null);
      setErrorMessage(null);
    }
  };

  // Export handlers
  const handleExport = async (format: "png" | "pdf" | "pptx" | "doc") => {
    setIsExporting(format);
    setErrorMessage(null);
    const filename = `daily-goal-card-${new Date().toISOString().slice(0, 10)}`;

    try {
      // Small pause to allow state updates to settle
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (format === "png") {
        await exportToImage("goal-card-root", filename);
      } else if (format === "pdf") {
        await exportToPDF("goal-card-root", filename);
      } else if (format === "pptx") {
        await exportToPowerPoint(cardData, activeTheme, filename);
      } else if (format === "doc") {
        await exportToWordDocument(cardData, filename);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Export failed during ${format.toUpperCase()} creation: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Navigation Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="font-black tracking-tighter text-xl">GOAL:SYNC</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCard}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-slate-200 rounded-sm bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-slate-900 px-4 py-2 rounded-sm text-white font-semibold hover:bg-slate-800 transition"
          >
            Google AI Studio
          </a>
        </div>
      </header>

      {/* Main Framework Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
        
        {/* Left Side: Parameters Form / Control panel (lg:col-span-5) */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-white p-6 overflow-y-auto space-y-8">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Info className="w-4 h-4 text-rose-600" /> System Alert
              </div>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* 1. Header Information Setup */}
          <section className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">01 / Core Settings</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Card Title</label>
                <input
                  type="text"
                  value={cardData.title}
                  onChange={(e) => setCardData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                  placeholder="Daily Focus & Strategy"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Organizer Name</label>
                <input
                  type="text"
                  value={cardData.userName}
                  onChange={(e) => setCardData((prev) => ({ ...prev, userName: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                  placeholder="Your Name"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Focus Motto / Subtitle</label>
                <input
                  type="text"
                  value={cardData.subtitle}
                  onChange={(e) => setCardData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                  placeholder="Focus motto or philosophy..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Calendar Date</label>
                <input
                  type="text"
                  value={cardData.date}
                  onChange={(e) => setCardData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Layout Style</label>
                <select
                  value={cardData.layout}
                  onChange={(e) => setCardData((prev) => ({ ...prev, layout: e.target.value as CardLayout }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                >
                  <option value="dual-column">Split Column (Balanced)</option>
                  <option value="vertical-compact">Vertical Compact (Linear)</option>
                  <option value="image-header">Banner Image Header</option>
                  <option value="minimalist-stack">Minimalist Stack (Editorial)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. Objectives List Manager */}
          <section className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">02 / Core Goals</label>

            {/* Quick Add Form */}
            <form onSubmit={handleAddGoal} className="space-y-3 bg-slate-50/50 p-4 border border-slate-200 rounded-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  Goal Title
                  <button
                    type="button"
                    onClick={triggerEnhanceGoal}
                    disabled={isEnhancingGoal || !newGoalTitle.trim()}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm ${
                      newGoalTitle.trim()
                        ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                        : "text-slate-400 bg-slate-100 cursor-not-allowed"
                    } font-semibold transition cursor-pointer`}
                  >
                    {isEnhancingGoal ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-100" />
                    )}
                    AI Enhance SMART
                  </button>
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Finish System Architecture"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* AI Enhancement Selections */}
              {enhancedGoalOptions && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 fill-indigo-200" /> AI Suggestions:
                    </span>
                    <button
                      type="button"
                      onClick={() => setEnhancedGoalOptions(null)}
                      className="text-[9px] text-slate-400 hover:text-slate-600"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => applyEnhancedGoal(enhancedGoalOptions.smart)}
                      className="w-full text-left p-1.5 rounded bg-white border border-indigo-100/50 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-[10px] leading-snug"
                    >
                      <strong className="text-indigo-800">SMART:</strong> {enhancedGoalOptions.smart}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEnhancedGoal(enhancedGoalOptions.motivational)}
                      className="w-full text-left p-1.5 rounded bg-white border border-indigo-100/50 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-[10px] leading-snug"
                    >
                      <strong className="text-indigo-800">Motivational:</strong> {enhancedGoalOptions.motivational}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEnhancedGoal(enhancedGoalOptions.minimal)}
                      className="w-full text-left p-1.5 rounded bg-white border border-indigo-100/50 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-[10px] leading-snug"
                    >
                      <strong className="text-indigo-800">Minimalist:</strong> {enhancedGoalOptions.minimal}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                  <select
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value as "high" | "medium" | "low")}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500"
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Action</label>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm py-3 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" /> Add Goal
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subtext / Description (Optional)</label>
                <textarea
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="Add measurements, specific subtasks or resources..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 h-16 resize-none transition"
                />
              </div>
            </form>

            {/* Added Goals List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cardData.goals.map((g, idx) => (
                <div key={g.id} className="flex items-center justify-between border border-slate-200 p-2.5 rounded-lg text-xs gap-3 hover:bg-slate-50/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={g.completed}
                      onChange={() => handleToggleGoal(g.id)}
                      className="rounded border-slate-300 w-4 h-4 accent-slate-900 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${g.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {g.title}
                      </p>
                      {g.description && <p className="text-[10px] text-slate-400 truncate">{g.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      g.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                      g.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {g.priority}
                    </span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveGoal(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === cardData.goals.length - 1}
                      onClick={() => handleMoveGoal(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Photos & Captions Upload */}
          <section className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">03 / Visual Asset</label>

            {/* Drag Zone / File Selector */}
            <div className="h-32 border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-sm hover:border-indigo-500 transition-colors">
              <label className="cursor-pointer block w-full h-full flex flex-col items-center justify-center gap-1">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-xs text-slate-600 font-semibold">Upload PNG or JPG</span>
                <span className="text-[10px] text-slate-400">Drag files or click here</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Images List with Filters & Captions */}
            <div className="space-y-4">
              {cardData.images.map((img) => (
                <div key={img.id} className="p-4 border border-slate-200 rounded-sm space-y-4 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-14 h-14 rounded-sm object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{img.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Filter:</span>
                          <select
                            value={img.filter}
                            onChange={(e) => handleUpdateImageFilter(img.id, e.target.value as CardImage["filter"])}
                            className="text-[10px] p-1.5 rounded-sm border border-slate-200 bg-white focus:outline-none"
                          >
                            <option value="none">Original</option>
                            <option value="grayscale">Noir (B&W)</option>
                            <option value="sepia">Warm Sepia</option>
                            <option value="blur">Soft Blur</option>
                            <option value="high-contrast">Dramatic</option>
                            <option value="warm">Sunny Gold</option>
                            <option value="cool">Frozen Slate</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-sm hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Caption & Suggest captions */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Image Caption</label>
                      <button
                        type="button"
                        onClick={() => triggerSuggestCaptions(img.id)}
                        disabled={!!isSuggestingCaptions}
                        className="flex items-center gap-1 text-[9px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded-sm transition cursor-pointer"
                      >
                        {isSuggestingCaptions === img.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-200" />
                        )}
                        Suggest AI Captions
                      </button>
                    </div>

                    {/* Show Suggestion list */}
                    {selectedTargetImageForAI === img.id && suggestedCaptionsList && (
                      <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-sm space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-indigo-700 mb-1">
                          <span>Apply a Caption choice:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSuggestedCaptionsList(null);
                              setSelectedTargetImageForAI(null);
                            }}
                            className="text-slate-400 hover:text-slate-600 font-normal"
                          >
                            Dismiss
                          </button>
                        </div>
                        {suggestedCaptionsList.map((caption, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => applySuggestedCaption(caption)}
                            className="w-full text-left p-1.5 rounded-sm bg-white border border-indigo-100/40 hover:border-indigo-300 hover:bg-indigo-50/30 text-[10px] leading-snug transition"
                          >
                            "{caption}"
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      value={img.caption}
                      onChange={(e) => handleUpdateImageCaption(img.id, e.target.value)}
                      placeholder="Add Caption"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 h-16 resize-none transition"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Fine-Tuning Details */}
          <section className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">04 / Card Theme & Fine-Tuning</label>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5" /> Bottom Motto / Quote
                </label>
                <textarea
                  value={cardData.footerQuote}
                  onChange={(e) => setCardData((prev) => ({ ...prev, footerQuote: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 h-16 resize-none transition"
                  placeholder="Motivational quotes or summary rule..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Progress Style</label>
                  <select
                    value={cardData.progressStyle}
                    onChange={(e) => setCardData((prev) => ({ ...prev, progressStyle: e.target.value as "bar" | "percentage" | "none" }))}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-indigo-500 transition"
                  >
                    <option value="bar">Completion Progress Bar</option>
                    <option value="percentage">Text Percentage Mode</option>
                    <option value="none">Hide Completion stats</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Side: Preview & Export Panel (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-slate-100 p-6 flex flex-col justify-between overflow-y-auto relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          
          <div className="space-y-6 relative z-10">
            
            {/* Theme Picker Strip */}
            <div className="bg-white p-6 border border-slate-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  05 / Card Theme Preset
                </span>
                <span className="text-xs text-slate-500">Instantly swap visual moods</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveThemeId(theme.id)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold tracking-tight transition flex items-center gap-1.5 cursor-pointer ${
                      activeThemeId === theme.id
                        ? "bg-slate-900 text-white shadow-none"
                        : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 border border-white/20 inline-block shadow-xs"
                      style={{ background: theme.bgGradient }}
                    />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS STAGE */}
            <div className="relative">
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider z-10 font-bold">
                Live Card Stage
              </div>
              <div className="overflow-x-auto p-1 rounded-[26px]">
                <GoalCardPreview
                  data={cardData}
                  activeTheme={activeTheme}
                  cardRef={cardRef}
                />
              </div>
            </div>

          </div>

          {/* Export framework at bottom */}
          <div className="mt-8 bg-white p-6 border border-slate-200 rounded-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                06 / Export & Ship Card
              </span>
              <p className="text-xs text-slate-500">
                Download your daily card into real PowerPoint, PDF, Image, or Microsoft Word documents.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleExport("png")}
                disabled={!!isExporting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3.5 px-2 rounded-sm flex flex-col items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting === "png" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-indigo-100" />
                )}
                <span>PNG Image</span>
              </button>

              <button
                onClick={() => handleExport("pdf")}
                disabled={!!isExporting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3.5 px-2 rounded-sm flex flex-col items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting === "pdf" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-rose-100" />
                )}
                <span>PDF Document</span>
              </button>

              <button
                onClick={() => handleExport("pptx")}
                disabled={!!isExporting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-3.5 px-2 rounded-sm flex flex-col items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting === "pptx" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Presentation className="w-5 h-5 text-amber-100" />
                )}
                <span>PowerPoint slide</span>
              </button>

              <button
                onClick={() => handleExport("doc")}
                disabled={!!isExporting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-2 rounded-sm flex flex-col items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting === "doc" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileCode className="w-5 h-5 text-emerald-100" />
                )}
                <span>Word Document</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
