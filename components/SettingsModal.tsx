import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

// Extract InputRow to outside of the main component to prevent re-mounting on every render
// This fixes the issue where the input loses focus after typing one character
interface InputRowProps {
  label: string;
  value: number;
  unit: string;
  min?: number;
  onChange: (val: string) => void;
}

const InputRow: React.FC<InputRowProps> = ({ label, value, unit, min = 1, onChange }) => (
  <div className="flex items-center justify-between py-1 group">
    <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">{label}</label>
    <div className="flex items-center justify-end gap-3 w-[180px]">
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        value={value.toString()} 
        onChange={(e) => onChange(e.target.value)}
        className="w-24 text-center bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-lg font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-slate-300"
      />
      <span className="text-base font-medium text-slate-400 w-10 text-right">{unit}</span>
    </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  // State to keep component mounted during exit animation
  const [isVisible, setIsVisible] = useState(false);
  // Local state to buffer changes before saving
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  // Sync local settings with global settings whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  // Only unmount if closed AND not visible (animation finished)
  if (!isOpen && !isVisible) return null;

  const handleChange = (key: keyof Settings, value: string | boolean) => {
    let parsedValue: number | boolean = value as boolean;
    
    if (typeof value === 'string') {
        if (value === '') {
             // Handle empty input gracefully (e.g. treat as 0 during typing)
            parsedValue = 0;
        } else {
            parsedValue = parseInt(value, 10);
            if (isNaN(parsedValue)) parsedValue = 0;
        }
    }

    setLocalSettings(prev => ({
      ...prev,
      [key]: parsedValue,
    }));
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur and animation - Click event REMOVED */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`} 
      />
      
      {/* Modal Content with animation */}
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

        {/* Body - Scrollable */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <InputRow 
                label="专注时间" 
                value={localSettings.focusDurationMinutes} 
                unit="分钟" 
                onChange={(val) => handleChange('focusDurationMinutes', val)}
            />
            
            <InputRow 
                label="最小间隔" 
                value={localSettings.minIntervalMinutes} 
                unit="分钟" 
                onChange={(val) => handleChange('minIntervalMinutes', val)}
            />

            <InputRow 
                label="最大间隔" 
                value={localSettings.maxIntervalMinutes} 
                unit="分钟" 
                min={localSettings.minIntervalMinutes}
                onChange={(val) => handleChange('maxIntervalMinutes', val)}
            />

            <InputRow 
                label="微休息时间" 
                value={localSettings.microBreakSeconds} 
                unit="秒" 
                onChange={(val) => handleChange('microBreakSeconds', val)}
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
                value={localSettings.longBreakMinutes} 
                unit="分钟" 
                onChange={(val) => handleChange('longBreakMinutes', val)}
            />

            {/* Toggle */}
            <div className="flex items-center justify-between py-1 group">
               <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">休息倒计时</label>
               <div className="flex items-center justify-end w-[180px] pr-2">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localSettings.showBreakCountdown} 
                      onChange={(e) => handleChange('showBreakCountdown', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 hover:bg-slate-300 transition-colors"></div>
                </label>
               </div>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end sticky bottom-0 z-10">
            <button 
                onClick={handleSave}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3 sm:py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 active:shadow-none"
            >
                保存设置
            </button>
        </div>
      </div>
    </div>
  );
};
