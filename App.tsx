import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, TimerStatus, DEFAULT_SETTINGS, TimeUnit, FocusRecord, Tag, DEFAULT_TAGS } from './types';
import { SettingsModal } from './components/SettingsModal';
import { CircularProgress } from './components/CircularProgress';
import { Statistics } from './components/Statistics';
import { TagSelector } from './components/TagSelector';
import { ShareModal } from './components/ShareModal';
import { CompletionModal } from './components/CompletionModal';
import { NoiseControl } from './components/NoiseControl';
import { playMindfulnessBell, playSessionEndSound } from './utils/sound';
import { performAutoBackup, createBackupObject } from './utils/backup';
import { uploadToWebDav } from './utils/webdav';
import { Settings as SettingsIcon, Play, Pause, RotateCcw, Volume2, BarChart2, Share2, Wind } from 'lucide-react';

const STORAGE_KEY = 'focusFlowState';
const HISTORY_KEY = 'focusFlowHistory';
const TAGS_KEY = 'focusFlowTags';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Helper to get initial state from localStorage
const getInitialState = () => {
  try {
    const savedStr = localStorage.getItem(STORAGE_KEY);
    if (!savedStr) return null;
    
    const saved = JSON.parse(savedStr);
    const now = Date.now();
    // Calculate how many seconds passed since last save
    const elapsed = (now - (saved.lastUpdated || now)) / 1000;

    let { status, globalTimeLeft, nextBellCountdown } = saved;

    // Adjust time if timer was active (RUNNING or BREAK)
    if (status === TimerStatus.RUNNING || status === TimerStatus.BREAK) {
      globalTimeLeft -= elapsed;
      
      if (status === TimerStatus.RUNNING) {
        nextBellCountdown -= elapsed;
        // If bell was missed while away, reset it to a short delay (5s) to resume rhythm
        if (nextBellCountdown <= 0) {
           nextBellCountdown = 5; 
        }
      }

      // If time ran out while away
      if (globalTimeLeft <= 0) {
        status = TimerStatus.FINISHED; 
        globalTimeLeft = 0;
        nextBellCountdown = 0;
      }
    }

    // Merge saved settings with default settings
    const mergedSettings = { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };

    return {
      settings: mergedSettings,
      status,
      globalTimeLeft: Math.floor(globalTimeLeft),
      nextBellCountdown: Math.floor(nextBellCountdown),
    };
  } catch (e) {
    console.error('Failed to load state', e);
    return null;
  }
};

// Load state once on module load
const loadedInitialState = getInitialState();

// Load History and Tags
const loadHistory = (): FocusRecord[] => {
    try {
        const str = localStorage.getItem(HISTORY_KEY);
        return str ? JSON.parse(str) : [];
    } catch { return []; }
};
const loadTags = (): Tag[] => {
    try {
        const str = localStorage.getItem(TAGS_KEY);
        return str ? JSON.parse(str) : DEFAULT_TAGS;
    } catch { return DEFAULT_TAGS; }
};

export default function App() {
  // --- State ---
  const [settings, setSettings] = useState<Settings>(loadedInitialState?.settings || DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  const [status, setStatus] = useState<TimerStatus>(loadedInitialState?.status || TimerStatus.IDLE);
  
  const [globalTimeLeft, setGlobalTimeLeft] = useState(
    loadedInitialState ? loadedInitialState.globalTimeLeft : DEFAULT_SETTINGS.focusDurationMinutes * 60
  ); 
  
  const [nextBellCountdown, setNextBellCountdown] = useState(
    loadedInitialState ? loadedInitialState.nextBellCountdown : 0
  ); 
  
  const [microBreakActive, setMicroBreakActive] = useState(false);

  // --- Data State ---
  const [history, setHistory] = useState<FocusRecord[]>(loadHistory);
  const [tags, setTags] = useState<Tag[]>(loadTags);
  const [selectedTagId, setSelectedTagId] = useState<string>(tags[0]?.id || '1');

  // --- Share & Completion Modal State ---
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [lastCompletedDuration, setLastCompletedDuration] = useState<number>(settings.focusDurationMinutes * 60);

  const currentTag = tags.find(t => t.id === selectedTagId) || tags[0] || { id: '1', name: '未分类', color: '#0d9488' };

  const todayTotalSeconds = history
    .filter(r => {
      const d = new Date(r.startTime);
      const today = new Date();
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    })
    .reduce((sum, r) => sum + r.durationSeconds, 0);

  // Save History/Tags when changed and trigger Auto Backup / WebDAV sync if enabled
  useEffect(() => { 
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); 
    if (settings.autoBackupEnabled) {
      performAutoBackup(settings, history, tags);
    }
    if (settings.webDavConfig?.enabled && settings.webDavConfig?.autoSync && settings.webDavConfig?.serverUrl && settings.webDavConfig?.username) {
      const backupData = createBackupObject(settings, history, tags);
      uploadToWebDav(settings.webDavConfig, backupData).catch(() => {});
    }
  }, [history, settings]);

  useEffect(() => { 
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); 
    if (settings.autoBackupEnabled) {
      performAutoBackup(settings, history, tags);
    }
  }, [tags, settings]);
  
  // --- Android Back Gesture State ---
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTime = useRef<number>(0);
  const isSettingsOpenRef = useRef(isSettingsOpen);
  const isStatsOpenRef = useRef(isStatsOpen);

  // Sync ref with state
  useEffect(() => { isSettingsOpenRef.current = isSettingsOpen; }, [isSettingsOpen]);
  useEffect(() => { isStatsOpenRef.current = isStatsOpen; }, [isStatsOpen]);

  // Refs for timer logic
  const timerRef = useRef<number | null>(null);
  
  // --- Android Back Gesture & History Logic ---
  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = () => {
      const now = Date.now();

      // 1. If Modals are open, close them
      if (isSettingsOpenRef.current) {
        setIsSettingsOpen(false);
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      if (isStatsOpenRef.current) {
        setIsStatsOpen(false);
        window.history.pushState(null, '', window.location.pathname);
        return;
      }

      // 2. Main Screen Logic
      if (now - lastBackPressTime.current < 2000) {
        window.history.back();
      } else {
        lastBackPressTime.current = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2000);
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // --- Persistence Effect ---
  useEffect(() => {
    const stateToSave = {
      settings,
      status,
      globalTimeLeft,
      nextBellCountdown,
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [settings, status, globalTimeLeft, nextBellCountdown]);

  // --- Logic ---

  const getRandomIntervalSeconds = useCallback(() => {
    const minSec = settings.minIntervalMinutes * 60;
    const maxSec = settings.maxIntervalMinutes * 60;
    return Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
  }, [settings.minIntervalMinutes, settings.maxIntervalMinutes]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(TimerStatus.IDLE);
    setGlobalTimeLeft(settings.focusDurationMinutes * 60);
    setNextBellCountdown(0);
    setMicroBreakActive(false);
  }, [settings.focusDurationMinutes]);

  useEffect(() => {
    if (status === TimerStatus.IDLE) {
      setGlobalTimeLeft(settings.focusDurationMinutes * 60);
    }
  }, [settings.focusDurationMinutes, status]);

  const startTimer = () => {
    if (status === TimerStatus.IDLE || status === TimerStatus.FINISHED) {
      const initialInterval = getRandomIntervalSeconds();
      setGlobalTimeLeft(settings.focusDurationMinutes * 60);
      setNextBellCountdown(initialInterval);
      setStatus(TimerStatus.RUNNING);
    } else if (status === TimerStatus.PAUSED) {
      setStatus(TimerStatus.RUNNING);
    } else if (status === TimerStatus.BREAK_PAUSED) {
      setStatus(TimerStatus.BREAK);
    }
  };

  const pauseTimer = () => {
    if (status === TimerStatus.BREAK) {
      setStatus(TimerStatus.BREAK_PAUSED);
    } else {
      setStatus(TimerStatus.PAUSED);
    }
  };

  // Record Saving Logic
  const saveFocusSession = useCallback(() => {
      const duration = settings.focusDurationMinutes * 60;
      const endTime = Date.now();
      const startTime = endTime - (duration * 1000);
      const tag = tags.find(t => t.id === selectedTagId);

      const newRecord: FocusRecord = {
          id: crypto.randomUUID(),
          startTime,
          endTime,
          durationSeconds: duration,
          tagId: selectedTagId,
          tagName: tag ? tag.name : '未分类'
      };
      setHistory(prev => [...prev, newRecord]);
  }, [settings.focusDurationMinutes, selectedTagId, tags]);

  // Main Tick Loop
  useEffect(() => {
    if (status === TimerStatus.RUNNING) {
      timerRef.current = window.setInterval(() => {
        setGlobalTimeLeft((prev) => {
          // 1. Check Global End
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            
            // SAVE SESSION HERE
            saveFocusSession();
            setLastCompletedDuration(settings.focusDurationMinutes * 60);
            setIsCompletionOpen(true);
            
            setStatus(settings.showBreakCountdown ? TimerStatus.BREAK : TimerStatus.FINISHED);
            playSessionEndSound();
            return settings.showBreakCountdown ? settings.longBreakMinutes * 60 : 0;
          }
          return prev - 1;
        });

        // 2. Check Bell Countdown
        setNextBellCountdown((prev) => {
          if (prev <= 1) {
            playMindfulnessBell();
            setMicroBreakActive(true);
            setTimeout(() => setMicroBreakActive(false), settings.microBreakSeconds * 1000);
            return getRandomIntervalSeconds();
          }
          return prev - 1;
        });

      }, 1000);
    } else if (status === TimerStatus.BREAK) {
      timerRef.current = window.setInterval(() => {
        setGlobalTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStatus(TimerStatus.FINISHED);
            playSessionEndSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, settings, getRandomIntervalSeconds, saveFocusSession]); 


  // --- Render Helpers ---
  const getProgressColor = () => {
    if (status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED) return "stroke-emerald-600";
    if (status === TimerStatus.FINISHED) return "stroke-slate-400";
    return "stroke-teal-700";
  };

  const getTotalTimeForProgress = () => {
    if (status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED) return settings.longBreakMinutes * 60;
    return settings.focusDurationMinutes * 60;
  };
  
  const getStatusText = () => {
    if (status === TimerStatus.BREAK) return "休息时间";
    if (status === TimerStatus.BREAK_PAUSED) return "休息暂停";
    if (status === TimerStatus.FINISHED) return "专注完成";
    if (status === TimerStatus.PAUSED) return "专注暂停";
    if (status === TimerStatus.IDLE) return "准备专注";
    return "正念专注中";
  };

  const formatRangeValue = (minutes: number, unit: TimeUnit) => {
    if (unit === 'sec') return Math.round(minutes * 60);
    return parseFloat(minutes.toFixed(1));
  };

  const renderRandomRange = () => {
      const minVal = formatRangeValue(settings.minIntervalMinutes, settings.minIntervalUnit);
      const maxVal = formatRangeValue(settings.maxIntervalMinutes, settings.maxIntervalUnit);
      
      const minLabel = settings.minIntervalUnit === 'min' ? '分钟' : '秒';
      const maxLabel = settings.maxIntervalUnit === 'min' ? '分钟' : '秒';

      if (settings.minIntervalUnit === settings.maxIntervalUnit) {
          return `${minVal} - ${maxVal} ${minLabel}`;
      }
      return `${minVal} ${minLabel} - ${maxVal} ${maxLabel}`;
  };

  // Tag Management
  const handleAddTag = (name: string, color: string) => {
      const newTag: Tag = { id: crypto.randomUUID(), name, color };
      setTags(prev => [...prev, newTag]);
      setSelectedTagId(newTag.id);
  };

  // NEW: Delete Tag Logic
  const handleDeleteTag = (tagId: string) => {
    setTags(prev => {
      const newTags = prev.filter(t => t.id !== tagId);
      // If we deleted the currently selected tag, reset selection to first available or default
      if (selectedTagId === tagId) {
         const nextTag = newTags.length > 0 ? newTags[0].id : DEFAULT_TAGS[0].id;
         setSelectedTagId(nextTag);
      }
      return newTags;
    });
  };

  // Handle Data Import (from JSON backup file or snapshot)
  const handleImportData = useCallback((data: { settings?: Settings; history: FocusRecord[]; tags: Tag[] }) => {
    if (data.history) setHistory(data.history);
    if (data.tags && data.tags.length > 0) setTags(data.tags);
    if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 flex flex-col items-center justify-between p-3 sm:p-6 relative overflow-x-hidden select-none">
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Navigation */}
      <div className="w-full max-w-2xl flex items-center justify-between z-20 px-1 sm:px-2 pt-1 sm:pt-2">
        <button 
          onClick={() => setIsStatsOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-2xl border border-slate-200/80 shadow-2xs transition-all active:scale-95 text-xs font-semibold shrink-0"
          title="查看统计与复盘"
        >
          <BarChart2 size={16} className="text-teal-600 shrink-0" />
          <span className="hidden sm:inline">数据复盘</span>
          <span className="sm:hidden">复盘</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NoiseControl />

          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-teal-50/90 hover:bg-teal-100 text-teal-800 rounded-2xl border border-teal-200/70 shadow-2xs transition-all active:scale-95 text-xs font-semibold shrink-0"
            title="一键分享专注卡片海报"
          >
            <Share2 size={15} className="text-teal-600 shrink-0" />
            <span className="hidden sm:inline">专注卡片</span>
            <span className="sm:hidden">卡片</span>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 sm:p-2.5 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 rounded-2xl border border-slate-200/80 shadow-2xs transition-all active:scale-95 shrink-0"
            title="参数设置与备份"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-6 sm:gap-7 z-10 py-4 my-auto">
        
        {/* Header Title */}
        <div className="text-center space-y-1">
           <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Focus Flow</h1>
           <p className="text-slate-400 text-xs font-medium">不慌不忙，正念专注</p>
        </div>

        {/* Main Circular Timer */}
        <div className="relative flex flex-col items-center">
          <CircularProgress 
            totalSeconds={getTotalTimeForProgress()} 
            currentSeconds={globalTimeLeft}
            color={getProgressColor()}
            duration={status === TimerStatus.IDLE ? 0 : 1000}
            isBreathing={status === TimerStatus.RUNNING}
            isFinished={status === TimerStatus.FINISHED}
          >
             <div className="text-center flex flex-col items-center">
               <span className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight ${status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED ? 'text-teal-700' : 'text-slate-900'}`}>
                 {formatTime(globalTimeLeft)}
               </span>
               <span className="text-slate-500 mt-2.5 font-semibold tracking-wide text-xs bg-slate-100/90 px-3 py-1 rounded-full border border-slate-200/60">
                 {getStatusText()}
               </span>
             </div>
          </CircularProgress>

          {/* Automatic Breathing Rhythm Banner */}
          {status === TimerStatus.RUNNING && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-teal-50/90 text-teal-800 rounded-full border border-teal-200/70 text-xs font-semibold animate-breath-text shadow-2xs mt-1">
              <Wind size={13} className="text-teal-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span>正念呼吸 · 随波吸气... 沉淀呼气</span>
            </div>
          )}

          {/* Micro Break Overlay */}
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center text-white backdrop-blur-xs transition-all duration-500 ${microBreakActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
          >
             <div className="text-center animate-pulse">
                <Volume2 size={40} className="mx-auto mb-2 text-teal-400" />
                <p className="text-lg font-bold tracking-tight">正念深呼吸</p>
                <p className="text-xs text-slate-400 mt-1">放松肩颈，回归当前</p>
             </div>
          </div>
        </div>

        {/* Tag Selector */}
        {status === TimerStatus.IDLE ? (
            <TagSelector 
                tags={tags} 
                selectedTagId={selectedTagId} 
                onSelect={setSelectedTagId} 
                onAddTag={handleAddTag}
                onDeleteTag={handleDeleteTag}
            />
        ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tags.find(t => t.id === selectedTagId)?.color }}></div>
                 <span className="text-xs font-semibold text-slate-700">{tags.find(t => t.id === selectedTagId)?.name || '未分类'}</span>
            </div>
        )}

        {/* Random Bell Next Countdown Info Card */}
        {status !== TimerStatus.IDLE && status !== TimerStatus.FINISHED && status !== TimerStatus.BREAK && status !== TimerStatus.BREAK_PAUSED && (
           <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 w-full max-w-xs flex justify-between items-center shadow-2xs border border-slate-200/70 text-xs">
              <div className="flex flex-col">
                 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">下一次正念提醒</span>
                 <span className="text-base font-mono font-bold text-slate-800 mt-0.5">
                    {status === TimerStatus.RUNNING ? formatTime(nextBellCountdown) : '--:--'}
                 </span>
              </div>
              <div className="flex flex-col text-right">
                 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">随机间隔范围</span>
                 <span className="text-xs font-medium text-slate-600 mt-0.5">
                    {renderRandomRange()}
                 </span>
              </div>
           </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-5 mt-1">
          {(status === TimerStatus.RUNNING || status === TimerStatus.BREAK) ? (
             <button 
               onClick={pauseTimer}
               className={`w-16 h-16 text-white rounded-2xl shadow-sm flex items-center justify-center transition-all active:scale-95 ${status === TimerStatus.BREAK ? 'bg-teal-700 hover:bg-teal-800' : 'bg-amber-600 hover:bg-amber-700'}`}
               title="暂停"
             >
               <Pause size={28} fill="currentColor" />
             </button>
          ) : (
             <button 
               onClick={startTimer}
               className={`w-16 h-16 text-white rounded-2xl shadow-sm flex items-center justify-center transition-all active:scale-95 ${status === TimerStatus.BREAK_PAUSED ? 'bg-teal-700 hover:bg-teal-800' : 'bg-slate-900 hover:bg-slate-800'}`}
               title="开始专注"
             >
               <Play size={28} fill="currentColor" className="ml-1" />
             </button>
          )}
          
          <button 
             onClick={resetTimer}
             className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-2xl shadow-2xs border border-slate-200/80 flex items-center justify-center transition-all active:scale-95"
             title="重置计时"
          >
             <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
        history={history}
        tags={tags}
        onImportData={handleImportData}
      />

      <Statistics 
         isOpen={isStatsOpen}
         onClose={() => setIsStatsOpen(false)}
         records={history}
         tags={tags}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        durationSeconds={lastCompletedDuration}
        tagName={currentTag.name}
        tagColor={currentTag.color}
        todayTotalSeconds={todayTotalSeconds}
      />

      <CompletionModal 
        isOpen={isCompletionOpen}
        onClose={() => setIsCompletionOpen(false)}
        durationSeconds={lastCompletedDuration}
        tagName={currentTag.name}
        tagColor={currentTag.color}
        todayTotalSeconds={todayTotalSeconds}
        onStartBreak={() => {
          setIsCompletionOpen(false);
          setStatus(TimerStatus.BREAK);
          setGlobalTimeLeft(settings.longBreakMinutes * 60);
        }}
        onOpenShare={() => {
          setIsCompletionOpen(false);
          setIsShareOpen(true);
        }}
      />
      
      {/* Android Back Exit Toast */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-medium shadow-xl transition-opacity duration-300 z-50 pointer-events-none ${showExitToast ? 'opacity-100' : 'opacity-0'}`}>
         再按一次返回退出 Focus Flow
      </div>
    </div>
  );
}