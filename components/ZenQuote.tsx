import React, { useState, useEffect } from 'react';
import { Quote, fetchZenQuote } from '../utils/quote';
import { Quote as QuoteIcon, RefreshCw } from 'lucide-react';

export const ZenQuote: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getNewQuote = async () => {
    setIsLoading(true);
    const q = await fetchZenQuote();
    setQuote(q);
    setIsLoading(false);
  };

  useEffect(() => {
    getNewQuote();
  }, []);

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto my-0.5">
      <div className="bg-white/60 hover:bg-white/90 backdrop-blur-xs border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 shadow-2xs transition-all group relative overflow-hidden">
        <div className="flex items-start gap-2">
          <QuoteIcon size={13} className="text-teal-600/70 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-700 font-medium leading-relaxed tracking-tight">
              {quote ? quote.text : '正在读取禅意金句...'}
            </p>
            {quote?.from && (
              <p className="text-[10px] text-slate-400 font-medium text-right mt-0.5">
                —— {quote.from}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={getNewQuote}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="换一句专注鼓励短语"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin text-teal-600' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};
