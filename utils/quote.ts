export interface Quote {
  text: string;
  from: string;
}

export const FALLBACK_ZEN_QUOTES: Quote[] = [
  { text: "万物皆有裂痕，那是光照进来的地方。", from: "莱昂纳德·科恩" },
  { text: "不慌不忙，正念专注，当下即是修行。", from: "禅语" },
  { text: "心如止水，鉴常照物，静胜躁，寒胜热。", from: "《道德经》" },
  { text: "流水不争先，争的是滔滔不绝。", from: "老子" },
  { text: "极简不是剥离，而是聚焦最重要的事情。", from: "正念" },
  { text: "专注于眼前的呼吸，让万虑归于平静。", from: "禅修" },
  { text: "一口气，一念间，身心皆沉淀。", from: "正念专注" },
  { text: "宁静致远，淡泊明志。", from: "诸葛亮" },
  { text: "致虚极，守静笃。万物生发，吾以观复。", from: "老子" },
  { text: "日拱一卒无有尽，功不唐捐终入海。", from: "胡适" },
];

export async function fetchZenQuote(): Promise<Quote> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Fetch from Hitokoto API (c=d哲学, c=i诗词, c=k文学, c=h网易云, c=j网易云短句)
    const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&c=h&c=j', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.hitokoto) {
        const fromWho = data.from_who ? `${data.from_who}` : '';
        const fromSource = data.from ? `《${data.from}》` : '';
        const author = [fromWho, fromSource].filter(Boolean).join(' ') || '一言';
        return {
          text: data.hitokoto,
          from: author,
        };
      }
    }
  } catch (err) {
    // Silent catch on network timeout / CORS, fall back to random preset
  }

  // Fallback to random preset
  const randomIndex = Math.floor(Math.random() * FALLBACK_ZEN_QUOTES.length);
  return FALLBACK_ZEN_QUOTES[randomIndex];
}
