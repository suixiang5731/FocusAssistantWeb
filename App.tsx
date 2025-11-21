import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, TimerStatus, DEFAULT_SETTINGS, TimeUnit } from './types';
import { SettingsModal } from './components/SettingsModal';
import { CircularProgress } from './components/CircularProgress';
import { playMindfulnessBell, playSessionEndSound } from './utils/sound';
import { Settings as SettingsIcon, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

const STORAGE_KEY = 'focusFlowState';

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
        // rather than firing immediately (which might be blocked by browser autoplay policy)
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

    // Merge saved settings with default settings to ensure new fields (Units) exist if loading from old storage
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

// Load state once on module load to avoid repetitive parsing during renders
const loadedInitialState = getInitialState();

export default function App() {
  // --- State ---
  const [settings, setSettings] = useState<Settings>(loadedInitialState?.settings || DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [status, setStatus] = useState<TimerStatus>(loadedInitialState?.status || TimerStatus.IDLE);
  
  // Initialize time based on saved state OR default to settings duration
  const [globalTimeLeft, setGlobalTimeLeft] = useState(
    loadedInitialState ? loadedInitialState.globalTimeLeft : DEFAULT_SETTINGS.focusDurationMinutes * 60
  ); 
  
  const [nextBellCountdown, setNextBellCountdown] = useState(
    loadedInitialState ? loadedInitialState.nextBellCountdown : 0
  ); 
  
  const [microBreakActive, setMicroBreakActive] = useState(false);
  
  // --- Android Back Gesture State ---
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTime = useRef<number>(0);
  const isSettingsOpenRef = useRef(isSettingsOpen);

  // Sync ref with state so event listener can access current value
  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen;
  }, [isSettingsOpen]);

  // Refs for timer logic
  const timerRef = useRef<number | null>(null);
  
  // --- Android Back Gesture & History Logic ---
  useEffect(() => {
    // Create a history entry to trap the back button
    // Using window.location.pathname keeps current url but adds a state entry
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      const now = Date.now();

      // 1. If Settings Modal is open, close it and stay in app
      if (isSettingsOpenRef.current) {
        setIsSettingsOpen(false);
        // Push state again to re-arm the trap (ensure we always have a "forward" state to pop)
        window.history.pushState(null, '', window.location.pathname);
        return;
      }

      // 2. Main Screen Logic
      if (now - lastBackPressTime.current < 2000) {
        // Double press detected: Allow exit
        // We are currently at the 'popped' state (index N-1).
        // Calling back() sends us to N-2, which effectively exits the PWA/Tab history
        window.history.back();
      } else {
        // First press: Show toast and trap
        lastBackPressTime.current = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2000);
        
        // Push state again to re-arm the trap
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // --- Persistence Effect ---
  // Save state to localStorage whenever it changes
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

  // Reset / Init
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(TimerStatus.IDLE);
    setGlobalTimeLeft(settings.focusDurationMinutes * 60);
    setNextBellCountdown(0);
    setMicroBreakActive(false);
  }, [settings.focusDurationMinutes]);

  // Update time when settings change ONLY if IDLE
  useEffect(() => {
    if (status === TimerStatus.IDLE) {
      setGlobalTimeLeft(settings.focusDurationMinutes * 60);
    }
  }, [settings.focusDurationMinutes, status]);

  // Start Timer
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

  // Main Tick Loop
  useEffect(() => {
    if (status === TimerStatus.RUNNING) {
      timerRef.current = window.setInterval(() => {
        setGlobalTimeLeft((prev) => {
          // 1. Check Global End
          if (prev <= 1) {
            clearInterval(timerRef.current!);
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
  }, [status, settings, getRandomIntervalSeconds]); 


  // --- Render Helpers ---
  const getProgressColor = () => {
    if (status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED) return "stroke-emerald-500";
    if (status === TimerStatus.FINISHED) return "stroke-slate-400";
    return "stroke-indigo-600";
  };

  const getTotalTimeForProgress = () => {
    if (status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED) return settings.longBreakMinutes * 60;
    return settings.focusDurationMinutes * 60;
  };
  
  const getStatusText = () => {
    if (status === TimerStatus.BREAK) return "休息时间";
    if (status === TimerStatus.BREAK_PAUSED) return "休息暂停";
    if (status === TimerStatus.FINISHED) return "已完成";
    if (status === TimerStatus.PAUSED) return "已暂停";
    return "专注中";
  };

  // Helpers for range display
  const formatRangeValue = (minutes: number, unit: TimeUnit) => {
    if (unit === 'sec') {
      return Math.round(minutes * 60);
    }
    // If minutes, maybe 1 decimal is enough, usually it's whole numbers
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambient Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white text-slate-600 rounded-full shadow-md hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95"
        >
          <SettingsIcon size={24} />
        </button>
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-8 z-10">
        
        {/* Title */}
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Focus Flow</h1>
           <p className="text-slate-500 text-sm">保持专注，享受当下</p>
        </div>

        {/* Main Timer Display */}
        <div className="relative">
          <CircularProgress 
            totalSeconds={getTotalTimeForProgress()} 
            currentSeconds={globalTimeLeft}
            color={getProgressColor()}
            duration={status === TimerStatus.IDLE ? 0 : 1000}
          >
             <div className="text-center flex flex-col items-center">
               <span className={`text-5xl font-mono font-bold tracking-tighter ${status === TimerStatus.BREAK || status === TimerStatus.BREAK_PAUSED ? 'text-emerald-600' : 'text-slate-800'}`}>
                 {formatTime(globalTimeLeft)}
               </span>
               <span className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-xs">
                 {getStatusText()}
               </span>
             </div>
          </CircularProgress>

          {/* Micro Break Toast / Indicator */}
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full bg-indigo-600/90 flex items-center justify-center text-white backdrop-blur-sm transition-all duration-500 ${microBreakActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
          >
             <div className="text-center animate-pulse">
                <Volume2 size={48} className="mx-auto mb-2" />
                <p className="text-xl font-bold">深呼吸</p>
             </div>
          </div>
        </div>

        {/* Info Cards */}
        {status !== TimerStatus.IDLE && status !== TimerStatus.FINISHED && status !== TimerStatus.BREAK && status !== TimerStatus.BREAK_PAUSED && (
           <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 w-full flex justify-between items-center shadow-sm border border-white/50">
              <div className="flex flex-col">
                 <span className="text-xs text-slate-400 uppercase font-bold">下一次提醒</span>
                 <span className="text-lg font-mono text-slate-700">
                    {status === TimerStatus.RUNNING ? formatTime(nextBellCountdown) : '--:--'}
                 </span>
              </div>
              <div className="flex flex-col text-right">
                 <span className="text-xs text-slate-400 uppercase font-bold">随机范围</span>
                 <span className="text-sm font-medium text-slate-600">
                    {renderRandomRange()}
                 </span>
              </div>
           </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6 mt-4">
          {(status === TimerStatus.RUNNING || status === TimerStatus.BREAK) ? (
             <button 
               onClick={pauseTimer}
               className={`w-20 h-20 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${status === TimerStatus.BREAK ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-200/50' : 'bg-amber-400 hover:bg-amber-500 hover:shadow-amber-200/50'}`}
             >
               <Pause size={32} fill="currentColor" />
             </button>
          ) : (
             <button 
               onClick={startTimer}
               className={`w-20 h-20 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${status === TimerStatus.BREAK_PAUSED ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-200/50' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200/50'}`}
             >
               <Play size={32} fill="currentColor" className="ml-1" />
             </button>
          )}
          
          <button 
             onClick={resetTimer}
             className="w-14 h-14 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all active:scale-95"
          >
             <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
      />
      
      {/* Android Back Exit Toast */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg transition-opacity duration-300 z-50 pointer-events-none ${showExitToast ? 'opacity-100' : 'opacity-0'}`}>
         再按一次返回退出应用
      </div>
    </div>
  );
}
