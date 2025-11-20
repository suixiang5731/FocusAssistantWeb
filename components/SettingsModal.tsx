import React from 'react';
import { Settings } from '../types';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof Settings, value: string | boolean) => {
    let parsedValue: number | boolean = value as boolean;
    
    if (typeof value === 'string') {
        // Allow empty string for typing
        if (value === '') {
            // We'll handle empty string by not updating state directly here if strictly typed number
            // But typically for controlled inputs we might need a local state buffer or accept the parse result
            // Here assuming the parent handles re-render, we pass 0 or keep current if invalid
            // Simple approach: parse, if NaN use 0
            parsedValue = parseInt(value, 10);
            if (isNaN(parsedValue)) parsedValue = 0;
        } else {
            parsedValue = parseInt(value, 10);
            if (isNaN(parsedValue)) parsedValue = 0;
        }
    }

    onUpdateSettings({
      ...settings,
      [key]: parsedValue,
    });
  };

  const InputRow = ({ label, value, unit, field, min = 1 }: { label: string, value: number, unit: string, field: keyof Settings, min?: number }) => (
    <div className="flex items-center justify-between py-1 group">
      <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">{label}</label>
      <div className="flex items-center justify-end gap-3 w-[180px]">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={min}
          value={value.toString()} // Convert to string to remove leading zeros naturally
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-24 text-center bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-lg font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-slate-300"
        />
        <span className="text-base font-medium text-slate-400 w-10 text-right">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 ease-out" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out max-h-[90vh] flex flex-col">
        
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
                value={settings.focusDurationMinutes} 
                unit="分钟" 
                field="focusDurationMinutes" 
            />
            
            <InputRow 
                label="最小间隔" 
                value={settings.minIntervalMinutes} 
                unit="分钟" 
                field="minIntervalMinutes" 
            />

            <InputRow 
                label="最大间隔" 
                value={settings.maxIntervalMinutes} 
                unit="分钟" 
                field="maxIntervalMinutes" 
                min={settings.minIntervalMinutes}
            />

            <InputRow 
                label="微休息时间" 
                value={settings.microBreakSeconds} 
                unit="秒" 
                field="microBreakSeconds" 
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
                value={settings.longBreakMinutes} 
                unit="分钟" 
                field="longBreakMinutes" 
            />

            {/* Toggle */}
            <div className="flex items-center justify-between py-1 group">
               <label className="text-slate-700 font-medium text-base sm:text-lg group-hover:text-indigo-600 transition-colors duration-200">休息倒计时</label>
               <div className="flex items-center justify-end w-[180px] pr-2">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showBreakCountdown} 
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
                onClick={onClose}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3 sm:py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 active:shadow-none"
            >
                完成设置
            </button>
        </div>
      </div>
    </div>
  );
};