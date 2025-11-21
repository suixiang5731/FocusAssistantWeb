import React, { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS, TimeUnit } from '../types';
import { X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

// Configuration to map value keys to their unit keys and base storage units
// base: 'min' means the value in Settings is stored as minutes
// base: 'sec' means the value in Settings is stored as seconds
const FIELD_CONFIG = {
  focusDurationMinutes: { unitKey: 'focusDurationUnit', base: 'min' },
  minIntervalMinutes: { unitKey: 'minIntervalUnit', base: 'min' },
  maxIntervalMinutes: { unitKey: 'maxIntervalUnit', base: 'min' },
  microBreakSeconds: { unitKey: 'microBreakUnit', base: 'sec' },
  longBreakMinutes: { unitKey: 'longBreakUnit', base: 'min' },
} as const;

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

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Create a clean copy to avoid reference issues
      // Ensure we have all default fields if loading from old state
      setLocalSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(JSON.stringify(settings)) });
    }
  }, [isOpen, settings]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  // Helper to convert between stored value and display value
  const getDisplayValue = (storedValue: number, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    if (baseUnit === displayUnit) {
        // Round to avoid floating point artifacts
        return Math.round(storedValue * 100) / 100;
    }
    // Base is min, Display is sec -> * 60
    if (baseUnit === 'min' && displayUnit === 'sec') return Math.round(storedValue * 60);
    // Base is sec, Display is min -> / 60
    if (baseUnit === 'sec' && displayUnit === 'min') return parseFloat((storedValue / 60).toFixed(2));
    
    return storedValue;
  };

  // Helper to calculate new stored value based on input
  const calculateStoredValueFromInput = (inputValue: string, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) return 0;

    if (baseUnit === displayUnit) return val;
    // Input is in Sec, Base is Min -> / 60
    if (baseUnit === 'min' && displayUnit === 'sec') return val / 60;
    // Input is in Min, Base is Sec -> * 60
    if (baseUnit === 'sec' && displayUnit === 'min') return val * 60;
    
    return val;
  };

  const updateSetting = (key: keyof Settings, val: string) => {
    const conf = FIELD_CONFIG[key as keyof typeof FIELD_CONFIG];
    if (!conf) return;

    const currentUnit = localSettings[conf.unitKey as keyof Settings] as TimeUnit;

    // Allow empty string for better typing experience
    if (val === '') {
        setLocalSettings(prev => ({ ...prev, [key]: NaN }));
        return;
    }
    
    const newValue = calculateStoredValueFromInput(val, conf.base, currentUnit);
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
  };

  const toggleUnit = (valueKey: keyof Settings) => {
    const conf = FIELD_CONFIG[valueKey as keyof typeof FIELD_CONFIG];
    if (!conf) return;

    const unitKey = conf.unitKey as keyof Settings;
    const currentUnit = localSettings[unitKey] as TimeUnit;
    const currentStoredValue = localSettings[valueKey] as number;
    
    // 1. Get the value currently displayed to the user
    const currentDisplayValue = getDisplayValue(currentStoredValue, conf.base, currentUnit);
    
    // 2. Determine new unit
    const nextUnit = currentUnit === 'min' ? 'sec' : 'min';

    // 3. Calculate what the stored value SHOULD be so that the display value remains the SAME
    // logic: treat 'currentDisplayValue' as if it is measured in 'nextUnit'
    let newStoredValue = 0;

    if (conf.base === 'min') {
        // Base storage is Minutes
        if (nextUnit === 'sec') {
            // User sees 'X', switches to 'Seconds'. Now 'X' means 'X seconds'.
            // Store 'X seconds' as minutes -> X / 60
            newStoredValue = currentDisplayValue / 60;
        } else {
            // User sees 'X', switches to 'Minutes'. Now 'X' means 'X minutes'.
            // Store 'X minutes' as minutes -> X
            newStoredValue = currentDisplayValue;
        }
    } else {
        // Base storage is Seconds (only microBreak)
        if (nextUnit === 'sec') {
             // User sees 'X', switches to 'Seconds'. Now 'X' means 'X seconds'.
             // Store 'X seconds' as seconds -> X
             newStoredValue = currentDisplayValue;
        } else {
             // User sees 'X', switches to 'Minutes'. Now 'X' means 'X minutes'.
             // Store 'X minutes' as seconds -> X * 60
             newStoredValue = currentDisplayValue * 60;
        }
    }

    setLocalSettings(prev => ({
      ...prev,
      [valueKey]: newStoredValue,
      [unitKey]: nextUnit
    }));
  };

  const handleSave = () => {
    // Ensure no NaNs are saved
    const cleanSettings = { ...localSettings };
    (Object.keys(cleanSettings) as Array<keyof Settings>).forEach(key => {
        const k = key as keyof Settings;
        if (typeof cleanSettings[k] === 'number' && isNaN(cleanSettings[k] as number)) {
             (cleanSettings as any)[k] = (DEFAULT_SETTINGS as any)[k];
        }
    });
    onUpdateSettings(cleanSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
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
                value={getDisplayValue(localSettings.focusDurationMinutes, 'min', localSettings.focusDurationUnit)}
                currentUnit={localSettings.focusDurationUnit}
                onChange={(val) => updateSetting('focusDurationMinutes', val)}
                onToggleUnit={() => toggleUnit('focusDurationMinutes')}
            />
            
            <InputRow 
                label="最小间隔" 
                value={getDisplayValue(localSettings.minIntervalMinutes, 'min', localSettings.minIntervalUnit)}
                currentUnit={localSettings.minIntervalUnit}
                onChange={(val) => updateSetting('minIntervalMinutes', val)}
                onToggleUnit={() => toggleUnit('minIntervalMinutes')}
            />

            <InputRow 
                label="最大间隔" 
                value={getDisplayValue(localSettings.maxIntervalMinutes, 'min', localSettings.maxIntervalUnit)}
                currentUnit={localSettings.maxIntervalUnit}
                min={getDisplayValue(localSettings.minIntervalMinutes, 'min', localSettings.maxIntervalUnit)} // Min validation might feel weird if units mixed, but okay for now
                onChange={(val) => updateSetting('maxIntervalMinutes', val)}
                onToggleUnit={() => toggleUnit('maxIntervalMinutes')}
            />

            <InputRow 
                label="微休息时间" 
                value={getDisplayValue(localSettings.microBreakSeconds, 'sec', localSettings.microBreakUnit)}
                currentUnit={localSettings.microBreakUnit}
                onChange={(val) => updateSetting('microBreakSeconds', val)}
                onToggleUnit={() => toggleUnit('microBreakSeconds')}
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
                value={getDisplayValue(localSettings.longBreakMinutes, 'min', localSettings.longBreakUnit)}
                currentUnit={localSettings.longBreakUnit}
                onChange={(val) => updateSetting('longBreakMinutes', val)}
                onToggleUnit={() => toggleUnit('longBreakMinutes')}
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