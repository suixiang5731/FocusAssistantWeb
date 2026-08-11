import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Disc, Waves, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { noiseEngine, NOISE_TYPES, NoiseType } from '../utils/sound';

export const NoiseControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [activeType, setActiveType] = useState<NoiseType>('rain');
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpenPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      noiseEngine.stop();
      setIsPlaying(false);
    } else {
      noiseEngine.start(activeType, volume);
      setIsPlaying(true);
    }
  };

  const handleSelectType = (type: NoiseType) => {
    setActiveType(type);
    if (isPlaying) {
      noiseEngine.start(type, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    noiseEngine.setVolume(newVol);
  };

  const currentNoiseObj = NOISE_TYPES.find(n => n.id === activeType) || NOISE_TYPES[0];

  return (
    <div className="relative" ref={panelRef}>
      {/* Toggle Bar Button */}
      <div className="flex items-center gap-1 bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs rounded-2xl p-1 transition-all">
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
            isPlaying 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
          title={isPlaying ? '关闭白噪声' : '开启白噪声'}
        >
          {isPlaying ? (
            <>
              <Volume2 size={15} className="animate-pulse shrink-0" />
              <span>白噪声开</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{currentNoiseObj.icon}</span>
            </>
          ) : (
            <>
              <VolumeX size={15} className="text-slate-400 shrink-0" />
              <span>白噪声</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpenPanel(!isOpenPanel)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="展开白噪声设置"
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Floating Control Popover */}
      {isOpenPanel && (
        <div className="absolute right-0 top-12 z-40 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3.5 animate-modal-enter">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-600" />
              <span>正念白噪声背景音</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Web Audio API</span>
          </div>

          {/* Sound Type Selection Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {NOISE_TYPES.map((nt) => (
              <button
                key={nt.id}
                type="button"
                onClick={() => handleSelectType(nt.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all ${
                  activeType === nt.id 
                    ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold shadow-2xs' 
                    : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{nt.icon}</span>
                <span>{nt.name}</span>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>音量调节</span>
              <span className="font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Main Toggle Button in Popover */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
              isPlaying 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX size={14} />
                <span>暂停当前白噪声</span>
              </>
            ) : (
              <>
                <Volume2 size={14} />
                <span>立即播放{currentNoiseObj.name}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
