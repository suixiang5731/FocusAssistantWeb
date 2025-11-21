import React, { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '../types';
import { X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

type TimeUnit = 'min' | 'sec';

interface UnitState {
  focusDuration: TimeUnit;
  minInterval: TimeUnit;
  maxInterval: TimeUnit;
  microBreak: TimeUnit;
  longBreak: TimeUnit;
}

const DEFAULT_UNITS: UnitState = {
  focusDuration: 'min',
  minInterval: 'min',
  maxInterval: 'min',
  microBreak: 'sec',
  longBreak: 'min',
};

// Extract InputRow to outside
interface InputRowProps {
  label: string;
  value: number;
  currentUnit: TimeUnit;
  min?: number;
  onChange: (val: string) => void;
  onToggleUnit: () => void;
}

const InputRow: React.FC<InputRowProps> = ({ label, value, currentUnit, min = 0, onChange, onToggleUnit }) => (
  <div className="flex items-center justify-between py-1 group">
    <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">{label}</label>
    <div className="flex items-center justify-end gap-3 w-[180px]">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={currentUnit === 'min' ? "0.1" : "1"}
        value={isNaN(value) ? '' : value.toString()} 
        onChange={(e) => onChange(e.target.value)}
        className="w-24 text-center bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-lg font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-slate-300"
      />
      <button 
        onClick={onToggleUnit}
        className="w-10 text-right text-base font-medium text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer select-none focus:outline-none active:scale-95"
        title="点击切换单位"
      >
        {currentUnit === 'min' ? '分钟' : '秒'}
      </button>
    </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [units, setUnits] = useState<UnitState>(DEFAULT_UNITS);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Create a clean copy to avoid reference issues
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [isOpen, settings]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  // Helper to convert between stored value and display value
  // baseUnit: the unit used in the Settings interface (e.g., 'min' for focusDurationMinutes)
  const getDisplayValue = (storedValue: number, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    if (baseUnit === displayUnit) {
        // Round to avoid ugly floats like 1.000000001
        return Math.round(storedValue * 100) / 100;
    }
    if (baseUnit === 'min' && displayUnit === 'sec') return Math.round(storedValue * 60);
    if (baseUnit === 'sec' && displayUnit === 'min') return parseFloat((storedValue / 60).toFixed(2));
    return storedValue;
  };

  // Helper to convert input string back to stored value
  const calculateNewStoredValue = (inputValue: string, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) return 0; // Return 0 instead of NaN to keep state valid

    if (baseUnit === displayUnit) return val;
    if (baseUnit === 'min' && displayUnit === 'sec') return val / 60;
    if (baseUnit === 'sec' && displayUnit === 'min') return val * 60;
    return val;
  };

  const updateSetting = (key: keyof Settings, val: string, baseUnit: TimeUnit, displayUnit: TimeUnit) => {
    // Allow empty string for better typing experience, handled in InputRow value prop
    if (val === '') {
        setLocalSettings(prev => ({ ...prev, [key]: NaN }));
        return;
    }
    const newValue = calculateNewStoredValue(val, baseUnit, displayUnit);
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
  };

  const toggleUnit = (key: keyof UnitState) => {
    setUnits(prev => ({
      ...prev,
      [key]: prev[key] === 'min' ? 'sec' : 'min'
    }));
  };

  const handleSave = () => {
    // Ensure no NaNs are saved
    const cleanSettings = { ...localSettings };
    (Object.keys(cleanSettings) as Array<keyof Settings>).forEach(key => {
        if (typeof cleanSettings[key] === 'number' && isNaN(cleanSettings[key] as number)) {
             (cleanSettings as any)[key] = (DEFAULT_SETTINGS as any)[key];
        }
    });
    onUpdateSettings(cleanSettings);
    onClose();
  };

  const handleReset = () => {
    // Deep copy defaults to ensure state update triggers re-render
    setLocalSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    setUnits({ ...DEFAULT_UNITS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`} 
      />
      
      <div 
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isOpen ? 'animate-modal-enter' : 'animate-modal-exit'}`}
        onAnimationEnd={handleAnimationEnd}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">计时选项</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all p-2 rounded-full active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <InputRow 
                label="专注时间" 
                value={getDisplayValue(localSettings.focusDurationMinutes, 'min', units.focusDuration)}
                currentUnit={units.focusDuration}
                onChange={(val) => updateSetting('focusDurationMinutes', val, 'min', units.focusDuration)}
                onToggleUnit={() => toggleUnit('focusDuration')}
            />
            
            <InputRow 
                label="最小间隔" 
                value={getDisplayValue(localSettings.minIntervalMinutes, 'min', units.minInterval)}
                currentUnit={units.minInterval}
                onChange={(val) => updateSetting('minIntervalMinutes', val, 'min', units.minInterval)}
                onToggleUnit={() => toggleUnit('minInterval')}
            />

            <InputRow 
                label="最大间隔" 
                value={getDisplayValue(localSettings.maxIntervalMinutes, 'min', units.maxInterval)}
                currentUnit={units.maxInterval}
                min={getDisplayValue(localSettings.minIntervalMinutes, 'min', units.maxInterval)}
                onChange={(val) => updateSetting('maxIntervalMinutes', val, 'min', units.maxInterval)}
                onToggleUnit={() => toggleUnit('maxInterval')}
            />

            <InputRow 
                label="微休息时间" 
                value={getDisplayValue(localSettings.microBreakSeconds, 'sec', units.microBreak)}
                currentUnit={units.microBreak}
                onChange={(val) => updateSetting('microBreakSeconds', val, 'sec', units.microBreak)}
                onToggleUnit={() => toggleUnit('microBreak')}
            />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">休息设置</span>
            </div>
          </div>

          <div className="space-y-4">
            <InputRow 
                label="长休息时间" 
                value={getDisplayValue(localSettings.longBreakMinutes, 'min', units.longBreak)}
                currentUnit={units.longBreak}
                onChange={(val) => updateSetting('longBreakMinutes', val, 'min', units.longBreak)}
                onToggleUnit={() => toggleUnit('longBreak')}
            />

            {/* Toggle */}
            <div className="flex items-center justify-between py-1 group">
               <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">休息倒计时</label>
               <div className="flex items-center justify-end w-[180px] pr-2">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localSettings.showBreakCountdown} 
                      onChange={(e) => setLocalSettings(prev => ({...prev, showBreakCountdown: e.target.checked}))}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 hover:bg-slate-300 transition-colors"></div>
                </label>
               </div>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-10">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 px-4 py-2.5 rounded-xl transition-all active:scale-95 font-medium"
                title="恢复默认设置"
            >
                <RotateCcw size={18} />
                <span>重置</span>
            </button>

            <button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 active:shadow-none"
            >
                保存设置
            </button>
        </div>
      </div>
    </div>
  );
};
