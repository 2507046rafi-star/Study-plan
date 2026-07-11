import React from "react";
import { CardData, CardTheme, GoalItem } from "../types";
import { CheckCircle2, Circle, AlertCircle, Calendar, User, Compass, Image as ImageIcon } from "lucide-react";

interface GoalCardPreviewProps {
  data: CardData;
  activeTheme: CardTheme;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const GoalCardPreview: React.FC<GoalCardPreviewProps> = ({ data, activeTheme, cardRef }) => {
  const completedCount = data.goals.filter((g) => g.completed).length;
  const totalCount = data.goals.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isGeom = activeTheme.id === "geometric-balance";
  const rdSm = isGeom ? "rounded-none" : "rounded-sm";
  const rdMd = isGeom ? "rounded-none" : "rounded-md";
  const rdLg = isGeom ? "rounded-none" : "rounded-lg";
  const rdXl = isGeom ? "rounded-none" : "rounded-xl";
  const rd2Xl = isGeom ? "rounded-none" : "rounded-2xl";

  // Filter mapper to CSS class
  const getFilterClass = (filter: string) => {
    switch (filter) {
      case "grayscale":
        return "filter-grayscale";
      case "sepia":
        return "filter-sepia";
      case "blur":
        return "filter-blur";
      case "high-contrast":
        return "filter-high-contrast";
      case "warm":
        return "filter-warm";
      case "cool":
        return "filter-cool";
      default:
        return "";
    }
  };

  // Priority badge styling helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return activeTheme.badgeHigh;
      case "medium":
        return activeTheme.badgeMedium;
      default:
        return activeTheme.badgeLow;
    }
  };

  // Render Goals List
  const renderGoals = () => {
    if (data.goals.length === 0) {
      return (
        <div className={`text-center py-6 border border-dashed border-zinc-300 ${rdLg} p-4`}>
          <AlertCircle className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
          <p className="text-sm font-medium text-zinc-500">No goals added yet</p>
          <p className="text-xs text-zinc-400 mt-1">Use the left panel to define your goals for today.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.goals.map((goal, index) => (
          <div
            key={goal.id}
            id={`goal-item-${goal.id}`}
            className={`flex items-start gap-3 p-3.5 ${rdXl} border ${activeTheme.borderColor} transition-all duration-200 bg-white/5 backdrop-blur-xs`}
          >
            <div className="mt-0.5 shrink-0">
              {goal.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={`text-sm font-semibold tracking-tight ${goal.completed ? "line-through text-slate-500" : activeTheme.textColor}`}
                >
                  {goal.title}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2 py-0.5 ${rdSm} border ${getPriorityBadge(
                      goal.priority
                    )} font-bold`}
                  >
                    {goal.priority}
                  </span>
                  {isGeom && (
                    <span className="text-[9px] font-mono opacity-50 text-slate-400">
                      0{index + 1}
                    </span>
                  )}
                </div>
              </div>
              {goal.description && (
                <p className={`text-xs mt-1 ${goal.completed ? "text-slate-500" : "text-slate-400"}`}>
                  {goal.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Images with Captions Grid
  const renderImages = () => {
    if (data.images.length === 0) {
      return (
        <div className={`flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 ${rd2Xl} bg-zinc-50/5 min-h-[160px]`}>
          <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
          <p className="text-xs font-medium text-zinc-500">No custom photos attached</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 text-center max-w-[200px]">
            Upload images in the sidebar to add visual reminders and custom captions.
          </p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${data.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {data.images.map((img) => (
          <div
            key={img.id}
            id={`card-image-box-${img.id}`}
            className={`overflow-hidden ${rdXl} border ${activeTheme.borderColor} bg-slate-950 flex flex-col`}
          >
            <div className="relative w-full overflow-hidden bg-slate-900 flex-1">
              <img
                src={img.url}
                alt={img.name}
                className={`w-full h-full object-cover aspect-video transition-all duration-300 ${getFilterClass(
                  img.filter
                )}`}
                referrerPolicy="no-referrer"
              />
            </div>
            {img.caption && (
              <div className="p-3 bg-slate-900 border-t border-slate-850 flex-none">
                <div className="flex items-center gap-2">
                  {isGeom && <div className="w-1.5 h-1.5 bg-indigo-500" />}
                  <p className={`text-[10px] leading-relaxed uppercase tracking-wider text-slate-400 ${activeTheme.fontBody}`}>
                    {img.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render Progress Bar
  const renderProgress = () => {
    if (data.progressStyle === "none" || totalCount === 0) return null;

    return (
      <div className={`p-4 ${rdXl} border ${activeTheme.borderColor} bg-slate-900/40 backdrop-blur-xs mt-6`}>
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className={activeTheme.textColor}>Today's Completion</span>
          <span className={activeTheme.textColor}>
            {completedCount}/{totalCount} Goals ({percentComplete}%)
          </span>
        </div>
        {data.progressStyle === "bar" && (
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${activeTheme.accentBg}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // Determine layout structures
  const renderLayoutContent = () => {
    switch (data.layout) {
      case "dual-column":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${activeTheme.subtitleColor}`}>
                Objectives
              </h3>
              {renderGoals()}
            </div>
            <div className="space-y-4">
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${activeTheme.subtitleColor}`}>
                Visual Captions
              </h3>
              {renderImages()}
              {renderProgress()}
            </div>
          </div>
        );

      case "image-header":
        return (
          <div className="space-y-6">
            {data.images.length > 0 && (
              <div className={`overflow-hidden rounded-2xl border ${activeTheme.borderColor} bg-white shadow-xs`}>
                <div className="relative w-full h-48 md:h-64 bg-zinc-100">
                  <img
                    src={data.images[0].url}
                    alt={data.images[0].name}
                    className={`w-full h-full object-cover transition-all duration-300 ${getFilterClass(
                      data.images[0].filter
                    )}`}
                    referrerPolicy="no-referrer"
                  />
                  {data.images[0].caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                      <p className="text-xs italic font-medium">"{data.images[0].caption}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                  Daily Goals
                </h3>
                {renderGoals()}
              </div>
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                  Supporting Media
                </h3>
                {data.images.length > 1 ? (
                  <div className="grid gap-3">
                    {data.images.slice(1).map((img) => (
                      <div
                        key={img.id}
                        className={`overflow-hidden rounded-xl border ${activeTheme.borderColor} bg-white`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className={`w-full aspect-video object-cover ${getFilterClass(img.filter)}`}
                          referrerPolicy="no-referrer"
                        />
                        {img.caption && (
                          <p className="text-[10px] p-2 italic text-zinc-500 line-clamp-2">"{img.caption}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center text-xs text-zinc-400">
                    No extra images
                  </div>
                )}
                {renderProgress()}
              </div>
            </div>
          </div>
        );

      case "minimalist-stack":
        return (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="space-y-4">
              {renderGoals()}
            </div>
            {data.images.length > 0 && (
              <div className="space-y-4">
                <div className="h-[1px] bg-zinc-200/80 my-4" />
                <h3 className={`text-[11px] font-bold uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                  Visual Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.images.map((img) => (
                    <div key={img.id} className="space-y-1">
                      <div className="overflow-hidden rounded-lg">
                        <img
                          src={img.url}
                          alt={img.name}
                          className={`w-full aspect-square object-cover ${getFilterClass(img.filter)}`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {img.caption && (
                        <p className={`text-[10px] leading-relaxed text-zinc-500 italic ${activeTheme.fontBody}`}>
                          – {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderProgress()}
          </div>
        );

      case "vertical-compact":
      default:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                Objectives
              </h3>
              {renderGoals()}
            </div>
            {data.images.length > 0 && (
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                  Inspirational Snapshots
                </h3>
                {renderImages()}
              </div>
            )}
            {renderProgress()}
          </div>
        );
    }
  };

  return (
    <div
      id="goal-card-root"
      ref={cardRef}
      style={{ background: activeTheme.bgGradient }}
      className={`w-full min-h-[500px] p-4 sm:p-8 ${isGeom ? "rounded-none" : "rounded-[24px]"} flex items-center justify-center transition-all duration-300 ease-in-out`}
    >
      <div
        id="goal-card-container"
        className={`w-full max-w-2xl ${isGeom ? "rounded-none border-[12px] border-white shadow-2xl" : "rounded-[20px] border " + activeTheme.borderColor} p-6 sm:p-8 ${activeTheme.fontHeading} transition-all duration-300`}
        style={{ backgroundColor: activeTheme.cardBg }}
      >
        {/* Card Header */}
        {isGeom ? (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div className="space-y-1">
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Target Date</div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase">
                {data.title || "Daily Goal Card"}
              </h1>
              <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase">
                {data.subtitle || "Your compass for modern daily achievements"}
              </p>
            </div>
            <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-3">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-white text-xs font-bold font-mono">
                01
              </div>
              {data.userName && (
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  BY: {data.userName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-100 pb-5 mb-5">
            <div className="space-y-1">
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${activeTheme.titleColor}`}>
                {data.title || "Daily Goal Card"}
              </h1>
              <p className={`text-sm ${activeTheme.subtitleColor} flex items-center gap-1.5`}>
                <Compass className="w-3.5 h-3.5 text-zinc-400" />
                {data.subtitle || "Your compass for modern daily achievements"}
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1 shrink-0 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{data.date}</span>
              </div>
              {data.userName && (
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{data.userName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {isGeom && <div className="h-1 w-12 bg-indigo-500 mb-6" />}

        {/* Card Content based on Layout */}
        <div className={activeTheme.fontBody}>{renderLayoutContent()}</div>

        {/* Card Footer */}
        {data.footerQuote && (
          <div className={`mt-8 pt-5 border-t ${isGeom ? "border-slate-800" : "border-zinc-100"} text-center`}>
            <p className={`text-xs italic leading-relaxed text-slate-400 max-w-lg mx-auto ${activeTheme.fontBody}`}>
              "{data.footerQuote}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
