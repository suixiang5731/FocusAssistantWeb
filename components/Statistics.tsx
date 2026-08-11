import React, { useMemo, useState, useEffect } from 'react';
import { FocusRecord, Tag } from '../types';
import { 
  format, 
  getHours, 
  eachDayOfInterval, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  addDays, 
  addWeeks, 
  addMonths, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, X, Clock, Flame, CalendarDays, Filter } from 'lucide-react';

interface StatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  records: FocusRecord[];
  tags: Tag[];
}

export const Statistics: React.FC<StatisticsProps> = ({ isOpen, onClose, records, tags }) => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear());
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSelectedDate(new Date());
      setHeatmapYear(new Date().getFullYear());
      setSelectedHeatmapDay(null);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  // --- Historical Available Years ---
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const recordYears = records.map(r => new Date(r.endTime).getFullYear());
    const yearSet = new Set<number>([currentYear, ...recordYears]);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [records]);

  // --- Date Range Calculations for Focus Details ---
  const dateRange = useMemo(() => {
    if (activeTab === 'day') {
      return {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate),
        label: format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })
      };
    } else if (activeTab === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return {
        start,
        end,
        label: `${format(start, 'M月d日')} - ${format(end, 'M月d日')} (${format(start, 'yyyy年')}第${format(start, 'w')}周)`
      };
    } else if (activeTab === 'month') {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return {
        start,
        end,
        label: format(selectedDate, 'yyyy年 M月')
      };
    } else {
      return {
        start: new Date(0),
        end: new Date(2099, 11, 31),
        label: '全部历史累计'
      };
    }
  }, [activeTab, selectedDate]);

  // Navigate date backwards/forwards
  const handlePrevDate = () => {
    if (activeTab === 'day') setSelectedDate(prev => addDays(prev, -1));
    else if (activeTab === 'week') setSelectedDate(prev => addWeeks(prev, -1));
    else if (activeTab === 'month') setSelectedDate(prev => addMonths(prev, -1));
  };

  const handleNextDate = () => {
    if (activeTab === 'day') setSelectedDate(prev => addDays(prev, 1));
    else if (activeTab === 'week') setSelectedDate(prev => addWeeks(prev, 1));
    else if (activeTab === 'month') setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleResetToToday = () => {
    setSelectedDate(new Date());
  };

  // Records within selected date range
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.endTime >= dateRange.start.getTime() && r.endTime <= dateRange.end.getTime());
  }, [records, dateRange]);

  // Summary stats
  const totalDurationSeconds = useMemo(() => records.reduce((acc, curr) => acc + curr.durationSeconds, 0), [records]);
  const rangeDurationSeconds = useMemo(() => filteredRecords.reduce((acc, curr) => acc + curr.durationSeconds, 0), [filteredRecords]);

  const todayRecords = useMemo(() => {
    const todayStart = startOfDay(new Date()).getTime();
    return records.filter(r => r.endTime >= todayStart);
  }, [records]);
  const todayDurationSeconds = useMemo(() => todayRecords.reduce((acc, curr) => acc + curr.durationSeconds, 0), [todayRecords]);

  const formatDurationText = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const formatDurationDigits = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return (
        <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {h}<span className="text-xs text-slate-400 font-normal mx-0.5">时</span>
          {m}<span className="text-xs text-slate-400 font-normal ml-0.5">分</span>
        </span>
      );
    }
    return (
      <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        {m}<span className="text-xs text-slate-400 font-normal ml-0.5">分</span>
      </span>
    );
  };

  // Pie Chart Data
  const pieData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const tagName = r.tagName || '未分类';
      data[tagName] = (data[tagName] || 0) + r.durationSeconds;
    });

    return Object.entries(data)
      .map(([name, value]) => {
         const tag = tags.find(t => t.name === name);
         return { name, value, color: tag ? tag.color : '#94a3b8' };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, tags]);

  // Bar Chart Data (Hourly Distribution for selected timeframe)
  const barData = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    filteredRecords.forEach(r => {
      const hour = getHours(r.startTime);
      hourCounts[hour] += r.durationSeconds;
    });
    
    return hourCounts.map((seconds, hour) => ({
      hour: `${hour}:00`,
      minutes: Math.round(seconds / 60),
    })).filter((_, i) => i >= 6 && i <= 23);
  }, [filteredRecords]);

  // Heatmap Data for selected year
  const heatmapData = useMemo(() => {
    const start = new Date(heatmapYear, 0, 1);
    const isCurrentYear = heatmapYear === new Date().getFullYear();
    const end = isCurrentYear ? new Date() : new Date(heatmapYear, 11, 31);

    const days = eachDayOfInterval({ start, end });
    
    const intensityMap: Record<string, number> = {};
    records.forEach(r => {
        const key = format(r.endTime, 'yyyy-MM-dd');
        intensityMap[key] = (intensityMap[key] || 0) + r.durationSeconds;
    });

    return days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const val = intensityMap[key] || 0;
        let level = 0;
        if (val > 0) level = 1;
        if (val > 20 * 60) level = 2;
        if (val > 60 * 60) level = 3;
        if (val > 150 * 60) level = 4;
        return { date: day, dateStr: key, seconds: val, level };
    });
  }, [records, heatmapYear]);

  // Records for clicked Heatmap Day
  const selectedDayRecords = useMemo(() => {
    if (!selectedHeatmapDay) return [];
    return records.filter(r => format(r.endTime, 'yyyy-MM-dd') === selectedHeatmapDay);
  }, [records, selectedHeatmapDay]);

  // All History List filtered by Tag
  const displayHistory = useMemo(() => {
    let list = records.slice().sort((a, b) => b.startTime - a.startTime);
    if (selectedTagFilter !== 'all') {
      list = list.filter(r => r.tagId === selectedTagFilter || r.tagName === selectedTagFilter);
    }
    return list;
  }, [records, selectedTagFilter]);

  if (!isOpen && !isVisible) return null;

  return (
    <div 
        className={`fixed inset-0 z-50 bg-slate-50 overflow-y-auto ${isOpen ? 'animate-modal-enter' : 'animate-modal-exit'}`}
        onAnimationEnd={handleAnimationEnd}
    >
      {/* Top Header Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 px-5 py-4 flex items-center justify-between border-b border-slate-200/60 shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="text-teal-600" size={20} />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">专注数据与复盘</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
        
        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">今日专注</div>
            <div>{formatDurationDigits(todayDurationSeconds)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{todayRecords.length} 次正念</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">选定区间专注</div>
            <div>{formatDurationDigits(rangeDurationSeconds)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{filteredRecords.length} 次正念</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">累计时长</div>
            <div>{formatDurationDigits(totalDurationSeconds)}</div>
            <div className="text-[11px] text-slate-400 mt-1">全历史记录</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">正念总次数</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{records.length}<span className="text-xs font-normal text-slate-400 ml-1">次</span></div>
            <div className="text-[11px] text-teal-600 font-medium mt-1">持续积累中</div>
          </div>
        </div>

        {/* Focus Details Card (with Date Navigator & Time Range Selector) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div>
               <h3 className="font-bold text-slate-900 text-base">专注分布详情</h3>
               <p className="text-xs text-slate-400 mt-0.5">按时间段查看不同标签的投入占比</p>
             </div>

             {/* Mode Selector Tabs */}
             <div className="flex bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto">
                {(['day', 'week', 'month', 'all'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          if (tab === 'all') setSelectedDate(new Date());
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {tab === 'day' ? '按日' : tab === 'week' ? '按周' : tab === 'month' ? '按月' : '全部'}
                    </button>
                ))}
             </div>
          </div>

          {/* Date Navigator Bar (Only show if not 'all') */}
          {activeTab !== 'all' && (
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 text-xs">
              <button 
                onClick={handlePrevDate}
                className="p-1 rounded-lg hover:bg-white hover:text-teal-700 transition-all text-slate-500 active:scale-90"
                title="查看前一区间"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2 font-medium text-slate-800">
                <CalendarDays size={14} className="text-teal-600 shrink-0" />
                <span className="truncate max-w-[200px]">{dateRange.label}</span>
                {!isToday(selectedDate) && (
                  <button 
                    onClick={handleResetToToday}
                    className="ml-1 text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md hover:bg-teal-100 font-semibold"
                  >
                    今天
                  </button>
                )}
              </div>

              <button 
                onClick={handleNextDate}
                className="p-1 rounded-lg hover:bg-white hover:text-teal-700 transition-all text-slate-500 active:scale-90"
                title="查看后一区间"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Pie Chart & Center Text */}
          {pieData.length > 0 ? (
            <div className="h-60 w-full relative pt-2">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={pieData}
                          innerRadius={62}
                          outerRadius={82}
                          paddingAngle={4}
                          dataKey="value"
                      >
                          {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${Math.round(value / 60)} 分钟`} />
                  </PieChart>
               </ResponsiveContainer>
               
               <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">区间总专注</div>
                   <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                      {formatDurationText(rangeDurationSeconds)}
                   </div>
               </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              该时间段内暂无专注记录，保持节奏，开始一次新的专注吧！
            </div>
          )}

          {/* Tag Distribution Legend List */}
          {pieData.length > 0 && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/70 text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-700 truncate">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 shrink-0 font-medium">{Math.round(item.value / 60)}分</span>
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* Hourly Best Focus Time Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
             <div className="flex items-center justify-between">
               <h3 className="font-bold text-slate-900 text-base">时段专注强度</h3>
               <span className="text-xs text-slate-400">小时分布 (6:00 - 23:00)</span>
             </div>

             <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <XAxis 
                            dataKey="hour" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            interval={2}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                            formatter={(value: number) => [`${value} 分钟`, '专注时长']}
                        />
                        <Bar dataKey="minutes" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Yearly Heatmap (with Year Selector) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Flame className="text-amber-500" size={18} />
                   <h3 className="font-bold text-slate-900 text-base">年度专注热力图</h3>
                 </div>

                 {/* Year Switcher */}
                 <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl">
                   <button
                     onClick={() => setHeatmapYear(prev => prev - 1)}
                     className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                     title="上一年"
                   >
                     <ChevronLeft size={14} />
                   </button>
                   <span className="text-xs font-bold text-slate-800 font-mono px-1">
                     {heatmapYear}年
                   </span>
                   <button
                     onClick={() => setHeatmapYear(prev => prev + 1)}
                     disabled={heatmapYear >= new Date().getFullYear()}
                     className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                     title="下一年"
                   >
                     <ChevronRight size={14} />
                   </button>
                 </div>
             </div>

             {/* Heatmap Grid */}
             <div className="overflow-x-auto custom-scrollbar pb-1">
               <div className="flex flex-wrap gap-1 min-w-[320px] justify-start">
                   {heatmapData.map((d, i) => {
                       const isSelected = selectedHeatmapDay === d.dateStr;
                       return (
                           <div 
                              key={i}
                              onClick={() => setSelectedHeatmapDay(isSelected ? null : d.dateStr)}
                              className={`w-3 h-3 rounded-[3px] transition-all cursor-pointer ${
                                  isSelected ? 'ring-2 ring-slate-900 ring-offset-1 z-10' : ''
                              } ${
                                  d.level === 0 ? 'bg-slate-100 hover:bg-slate-200' :
                                  d.level === 1 ? 'bg-teal-200 hover:bg-teal-300' :
                                  d.level === 2 ? 'bg-teal-400 hover:bg-teal-500' :
                                  d.level === 3 ? 'bg-teal-600 hover:bg-teal-700' :
                                  'bg-teal-800 hover:bg-teal-900'
                              }`}
                              title={`${d.dateStr}: 专注 ${Math.round(d.seconds / 60)} 分钟`}
                           ></div>
                       );
                   })}
               </div>
             </div>

             <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                 <span>点击特定日期卡片查看明细</span>
                 <div className="flex items-center gap-1.5">
                     <span>少</span>
                     <div className="w-2.5 h-2.5 bg-slate-100 rounded-[2px]"></div>
                     <div className="w-2.5 h-2.5 bg-teal-200 rounded-[2px]"></div>
                     <div className="w-2.5 h-2.5 bg-teal-400 rounded-[2px]"></div>
                     <div className="w-2.5 h-2.5 bg-teal-600 rounded-[2px]"></div>
                     <div className="w-2.5 h-2.5 bg-teal-800 rounded-[2px]"></div>
                     <span>多</span>
                 </div>
             </div>

             {/* Selected Heatmap Day Details popup */}
             {selectedHeatmapDay && (
               <div className="p-3 bg-teal-50/70 border border-teal-200/70 rounded-xl text-xs space-y-2 animate-modal-enter">
                  <div className="flex items-center justify-between font-bold text-teal-900">
                    <span>{selectedHeatmapDay} 专注记录</span>
                    <button onClick={() => setSelectedHeatmapDay(null)} className="text-teal-600 hover:text-teal-900">
                      <X size={14} />
                    </button>
                  </div>
                  {selectedDayRecords.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedDayRecords.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-teal-100">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tags.find(t => t.name === r.tagName)?.color || '#0d9488' }}></span>
                            <span className="text-slate-700 font-medium">{r.tagName}</span>
                            <span className="text-slate-400 text-[11px] font-mono">{format(r.startTime, 'HH:mm')} - {format(r.endTime, 'HH:mm')}</span>
                          </div>
                          <span className="font-mono font-semibold text-teal-700">{Math.round(r.durationSeconds / 60)} 分钟</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-teal-700/80">该日期未记录到专注周期。</p>
                  )}
               </div>
             )}
        </div>

        {/* All History Log List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                 <h3 className="font-bold text-slate-900 text-base">历史专注明细</h3>

                 {/* Tag Filter */}
                 <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-xs">
                    <Filter size={12} className="text-slate-400 ml-1" />
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all">所有标签</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                 </div>
             </div>

             <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                 {displayHistory.map(rec => (
                     <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition-colors text-xs sm:text-sm">
                         <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tags.find(t => t.name === rec.tagName)?.color || '#94a3b8' }}></span>
                            <div>
                               <div className="font-medium text-slate-800">{rec.tagName}</div>
                               <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                 {format(rec.startTime, 'yyyy-MM-dd HH:mm')} - {format(rec.endTime, 'HH:mm')}
                               </div>
                            </div>
                         </div>
                         <div className="font-mono font-bold text-slate-900">
                            {Math.round(rec.durationSeconds / 60)} <span className="text-xs font-normal text-slate-400">分钟</span>
                         </div>
                     </div>
                 ))}
                 {displayHistory.length === 0 && (
                   <div className="text-center text-slate-400 text-xs py-8">
                     暂无符合条件的历史专注记录
                   </div>
                 )}
             </div>
        </div>

      </div>
    </div>
  );
};