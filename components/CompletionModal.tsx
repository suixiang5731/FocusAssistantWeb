import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Share2, Coffee, ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { Tag } from '../types';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds: number;
  tagName: string;
  tagColor?: string;
  todayTotalSeconds: number;
  onStartBreak: () => void;
  onOpenShare: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  durationSeconds,
  tagName,
  tagColor = '#0d9488',
  todayTotalSeconds,
  onStartBreak,
  onOpenShare
}) => {

  useEffect(() => {
    if (isOpen) {
      // Trigger canvas confetti fireworks burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#0f766e', '#f59e0b', '#38bdf8', '#10b981']
        });

        // Second subtle burst after 300ms
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#0d9488', '#38bdf8']
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f59e0b', '#10b981']
          });
        }, 250);
      } catch (err) {
        console.error('Confetti trigger failed', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const todayHours = (todayTotalSeconds / 3600).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-backdrop-enter">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/90 text-center space-y-5 animate-completion-pop relative overflow-hidden">
        
        {/* Decorative Top Ambient Flare */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Animated Checkmark Circle */}
        <div className="mx-auto w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500/30 flex items-center justify-center text-teal-600 shadow-xs animate-pulse">
          <Check size={32} strokeWidth={3} />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/70 rounded-full text-xs font-bold">
            <Trophy size={13} />
            <span>专注周期达成</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
            太棒了，完成一次正念！
          </h3>
          <p className="text-xs text-slate-500">
            保持专注律动，感受身心的宁静与高效。
          </p>
        </div>

        {/* Stats Summary Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">本次专注</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: tagColor }}
              />
              <span>{tagName}</span>
              <span className="font-mono text-base text-teal-700 ml-1">{minutes} 分钟</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">今日累计正念</span>
            <span className="font-mono font-bold text-slate-900">{todayHours} 小时</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onStartBreak}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Coffee size={16} className="text-amber-400" />
            <span>开启 5 分钟正念休息</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenShare}
              className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100/80 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/60 transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} className="text-teal-600" />
              <span>一键海报</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/60 transition-all active:scale-98 flex items-center justify-center gap-1"
            >
              <span>收起复盘</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
