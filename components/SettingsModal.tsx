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
        parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) parsedValue = 0;
    }

    onUpdateSettings({
      ...settings,
      [key]: parsedValue,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-center">
          <h2 className="text-xl font-bold text-slate-800">计时选项</h2>
          <button 
            onClick={onClose}
            className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          
          {/* Focus Time */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-slate-900">专注时间 :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={settings.focusDurationMinutes}
                onChange={(e) => handleChange('focusDurationMinutes', e.target.value)}
                className="w-24 text-center border border-slate-300 rounded-lg py-2 px-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-lg font-semibold text-slate-900">分钟</span>
            </div>
          </div>

          {/* Min Interval */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-slate-900">最小间隔 :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={settings.minIntervalMinutes}
                onChange={(e) => handleChange('minIntervalMinutes', e.target.value)}
                className="w-24 text-center border border-slate-300 rounded-lg py-2 px-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-lg font-semibold text-slate-900">分钟</span>
            </div>
          </div>

          {/* Max Interval */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-slate-900">最大间隔 :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={settings.minIntervalMinutes}
                value={settings.maxIntervalMinutes}
                onChange={(e) => handleChange('maxIntervalMinutes', e.target.value)}
                className="w-24 text-center border border-slate-300 rounded-lg py-2 px-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-lg font-semibold text-slate-900">分钟</span>
            </div>
          </div>

          {/* Micro Break */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-slate-900">微休息时间 :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={settings.microBreakSeconds}
                onChange={(e) => handleChange('microBreakSeconds', e.target.value)}
                className="w-24 text-center border border-slate-300 rounded-lg py-2 px-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-lg font-semibold text-slate-900">秒</span>
            </div>
          </div>

          <div className="h-px bg-slate-200 my-4 border-dashed border-b"></div>

          {/* Long Break */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-slate-900">休息时间 :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={settings.longBreakMinutes}
                onChange={(e) => handleChange('longBreakMinutes', e.target.value)}
                className="w-24 text-center border border-slate-300 rounded-lg py-2 px-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-lg font-semibold text-slate-900">分钟</span>
            </div>
          </div>

          {/* Break Toggle */}
          <div className="flex items-center justify-between">
             <label className="text-lg font-semibold text-slate-900">休息倒计时 :</label>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.showBreakCountdown} 
                  onChange={(e) => handleChange('showBreakCountdown', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

        </div>
        
        <div className="bg-slate-50 px-6 py-4 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
            >
                完成
            </button>
        </div>
      </div>
    </div>
  );
};