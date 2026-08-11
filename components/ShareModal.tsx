import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, Copy, Download, Check, Share2, Sparkles, Flame, Clock, Quote, RefreshCw } from 'lucide-react';
import { Tag } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds: number;
  tagName: string;
  tagColor?: string;
  todayTotalSeconds: number;
}

const MINDFULNESS_QUOTES = [
  "专注不是排除干扰，而是不给干扰以余地。",
  "不慌不忙，正念当下。",
  "心如止水，专注于此时此刻的每一分。",
  "每一个深呼吸，都是重聚精神的开始。",
  "万物皆有其时，专注自会开花。",
  "日拱一卒，功不唐捐；积少成多，静水流深。",
  "行到水穷处，坐看云起时。",
  "倾听当下的呼吸，让心绪重归平静。",
  "专于一事，精于一业，成于持之以恒。"
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  durationSeconds,
  tagName,
  tagColor = '#0d9488',
  todayTotalSeconds
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<string>(() => 
    MINDFULNESS_QUOTES[Math.floor(Math.random() * MINDFULNESS_QUOTES.length)]
  );
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Fetch a new quote from public Quote API with timeout & fallback
  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.hitokoto && data.hitokoto.length <= 45) {
          setCurrentQuote(data.hitokoto);
          setIsLoadingQuote(false);
          return;
        }
      }
    } catch (e) {
      // ignore network errors / timeouts
    }

    // Local fallback
    const randomLocal = MINDFULNESS_QUOTES[Math.floor(Math.random() * MINDFULNESS_QUOTES.length)];
    setCurrentQuote(randomLocal);
    setIsLoadingQuote(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuote();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const todayHours = (todayTotalSeconds / 3600).toFixed(1);

  const handleNextQuote = () => {
    fetchQuote();
  };

  // Format text for quick text sharing
  const getShareText = () => {
    return `🧘【Focus Flow 专注日记】
📅 日期：${format(new Date(), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
⏱️ 本次专注：${minutes} 分钟 (${tagName})
🔥 今日累计正念：${todayHours} 小时
💬 "${currentQuote}"
-- 来自 Focus Flow 正念专注`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback copy
      const textArea = document.createElement("textarea");
      textArea.value = getShareText();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Generate poster image via Canvas API directly
  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 600;
      const height = 820;
      canvas.width = width * 2; // high DPI scale
      canvas.height = height * 2;
      ctx.scale(2, 2);

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Card Container Window
      const margin = 40;
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      
      // Draw rounded rectangle
      const radius = 24;
      ctx.beginPath();
      ctx.roundRect(margin, margin, cardW, cardH, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // reset shadow

      // Header Brand
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Focus Flow', margin + 36, margin + 56);

      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('正念专注成果卡片', margin + 36, margin + 78);

      // Accent Tag Chip
      const tagText = `🏷️ ${tagName}`;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      const tagWidth = ctx.measureText(tagText).width + 24;

      ctx.fillStyle = tagColor + '18'; // opacity
      ctx.beginPath();
      ctx.roundRect(margin + 36, margin + 110, Math.max(100, tagWidth), 32, 10);
      ctx.fill();

      ctx.fillStyle = tagColor;
      ctx.fillText(tagText, margin + 48, margin + 131);

      // Main Big Duration Number + Unit (FIX OVERLAP BUG)
      const numStr = `${minutes}`;
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      const numWidth = ctx.measureText(numStr).width;

      ctx.fillStyle = '#0f172a';
      ctx.fillText(numStr, margin + 36, margin + 230);

      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('分钟专注', margin + 36 + numWidth + 14, margin + 220);

      // Divider Line
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin + 36, margin + 270);
      ctx.lineTo(margin + cardW - 36, margin + 270);
      ctx.stroke();

      // Stats Section
      ctx.font = '600 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`🔥 今日正念已累计: ${todayHours} 小时`, margin + 36, margin + 310);

      // Quote Section Box
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(margin + 36, margin + 345, cardW - 72, 130, 16);
      ctx.fill();

      ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#475569';
      
      // Wrap quote text nicely if long
      const maxTextWidth = cardW - 110;
      const quoteText = `"${currentQuote}"`;
      
      if (ctx.measureText(quoteText).width > maxTextWidth) {
        // Draw two lines
        const mid = Math.floor(quoteText.length / 2);
        const line1 = quoteText.substring(0, mid);
        const line2 = quoteText.substring(mid);
        ctx.fillText(line1, margin + 56, margin + 400);
        ctx.fillText(line2, margin + 56, margin + 430);
      } else {
        ctx.fillText(quoteText, margin + 56, margin + 415);
      }

      // Footer Info
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(format(new Date(), 'yyyy.MM.dd  HH:mm'), margin + 36, margin + 530);

      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0d9488';
      ctx.fillText('保持节奏 · 专注当下', margin + cardW - 160, margin + 530);

      // Trigger download
      const imageUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `FocusFlow-专注卡片-${format(new Date(), 'yyyyMMdd-HHmm')}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to generate poster', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-backdrop-enter">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200/80 space-y-5 animate-modal-enter relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2">
          <Share2 className="text-teal-600" size={20} />
          <h3 className="font-extrabold text-slate-900 text-lg">专注成果卡片</h3>
        </div>

        {/* Visual Share Card Preview */}
        <div 
          className="bg-gradient-to-br from-stone-50 to-slate-100 p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm tracking-tight">
              <Sparkles size={16} className="text-teal-600" />
              <span>Focus Flow</span>
            </div>
            <span 
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: `${tagColor}15`, color: tagColor }}
            >
              {tagName}
            </span>
          </div>

          <div className="py-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">本次正念时长</div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-slate-900 tracking-tight">{minutes}</span>
              <span className="text-sm font-bold text-slate-500">分钟专注</span>
            </div>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-amber-500" />
                <span>今日累计正念: <strong className="text-slate-900 font-mono">{todayHours}</strong> 小时</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100 flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 text-slate-600 italic text-[11px] leading-relaxed">
                <Quote size={12} className="text-teal-600 shrink-0 mt-0.5" />
                <span>"{currentQuote}"</span>
              </div>
              <button 
                onClick={handleNextQuote}
                disabled={isLoadingQuote}
                className={`shrink-0 flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 rounded-md text-[10px] font-semibold transition-colors border border-slate-200/60 ${isLoadingQuote ? 'opacity-70' : ''}`}
                title="在线随机更换专注语"
              >
                <RefreshCw size={10} className={isLoadingQuote ? 'animate-spin text-teal-600' : ''} />
                <span>{isLoadingQuote ? '获取中...' : '换一句'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>{format(new Date(), 'yyyy.MM.dd HH:mm')}</span>
            <span className="text-teal-700 font-bold">保持节奏 · 专注当下</span>
          </div>
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200/80 transition-all active:scale-98"
          >
            {copiedText ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span>已复制文案</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-slate-600" />
                <span>复制分享文本</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-50"
          >
            <Download size={14} className="text-teal-400" />
            <span>{isGeneratingImage ? '生成中...' : '下载卡片海报'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

