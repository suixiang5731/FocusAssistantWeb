import React, { useMemo, useState } from 'react';
import { FocusRecord, Tag } from '../types';
import { X, ChevronRight, Calendar } from 'lucide-react';
import { format, isSameDay, startOfDay, subDays, getHours, startOfYear, eachDayOfInterval, endOfDay, addDays, isSameMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { zhCN } from 'date-fns/locale';

interface StatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  records: FocusRecord[];
  tags: Tag[];
}

export const Statistics: React.FC<StatisticsProps> = ({ isOpen, onClose, records, tags }) => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');

  // --- Derived Data ---

  const todayRecords = useMemo(() => {
    const today = startOfDay(new Date());
    return records.filter(r => r.endTime >= today.getTime());
  }, [records]);

  const totalDurationSeconds = useMemo(() => records.reduce((acc, curr) => acc + curr.durationSeconds, 0), [records]);
  const todayDurationSeconds = useMemo(() => todayRecords.reduce((acc, curr) => acc + curr.durationSeconds, 0), [todayRecords]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return <><span className="text-2xl font-bold text-indigo-600">{h}</span><span className="text-sm text-slate-500 ml-1 mr-2">h</span><span className="text-2xl font-bold text-indigo-600">{m}</span><span className="text-sm text-slate-500 ml-1">m</span></>;
    return <><span className="text-2xl font-bold text-indigo-600">{m}</span><span className="text-sm text-slate-500 ml-1">m</span></>;
  };

  const formatDurationSimple = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // --- Chart Data: Pie (Category Distribution) ---
  const pieData = useMemo(() => {
    const data: Record<string, number> = {};
    let targetRecords = records;
    
    // Filter based on simple tab logic (Day = Today, Week = Last 7 days, Month = Last 30 days)
    const now = new Date();
    if (activeTab === 'day') {
        targetRecords = todayRecords;
    } else if (activeTab === 'week') {
        const start = subDays(now, 7).getTime();
        targetRecords = records.filter(r => r.endTime >= start);
    } else {
        const start = subDays(now, 30).getTime();
        targetRecords = records.filter(r => r.endTime >= start);
    }

    targetRecords.forEach(r => {
      const tagName = r.tagName || 'Uncategorized';
      data[tagName] = (data[tagName] || 0) + r.durationSeconds;
    });

    return Object.entries(data)
      .map(([name, value]) => {
         const tag = tags.find(t => t.name === name);
         return { name, value, color: tag ? tag.color : '#94a3b8' };
      })
      .sort((a, b) => b.value - a.value);
  }, [records, todayRecords, activeTab, tags]);

  // --- Chart Data: Bar (Best Hours) ---
  const barData = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    records.forEach(r => {
      const hour = getHours(r.startTime);
      hourCounts[hour] += r.durationSeconds; // Aggregate duration or count? Usually duration for "Best Focus Time"
    });
    
    // Format for Recharts
    return hourCounts.map((seconds, hour) => ({
      hour: `${hour}:00`,
      minutes: Math.round(seconds / 60),
    })).filter((_, i) => i >= 6 && i <= 23); // Show 6AM to 11PM usually
  }, [records]);

  // --- Chart Data: Heatmap ---
  const heatmapData = useMemo(() => {
    // Generate last 365 days or current year
    const end = new Date();
    const start = startOfYear(end); 
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
        if (val > 30 * 60) level = 2;
        if (val > 120 * 60) level = 3;
        if (val > 240 * 60) level = 4;
        return { date: day, level };
    });
  }, [records]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-modal-enter">
      {/* Header */}
      <div className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-20 px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button className="text-slate-500 opacity-0">取消</button>
        <h2 className="text-lg font-bold text-slate-800">数据统计</h2>
        <button 
          onClick={onClose}
          className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          完成
        </button>
      </div>

      <div className="p-4 space-y-6 pb-20">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">今日专注</div>
            <div className="flex items-baseline">
                {formatDuration(todayDurationSeconds)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">今日周期</div>
            <div className="text-2xl font-bold text-indigo-600 flex items-center">
              {todayRecords.length} <span className="text-sm text-slate-400 ml-1 font-normal">个</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">总专注</div>
            <div className="flex items-baseline">
               {formatDuration(totalDurationSeconds)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">总周期</div>
            <div className="text-2xl font-bold text-indigo-600 flex items-center">
              {records.length} <span className="text-sm text-slate-400 ml-1 font-normal">个</span>
            </div>
          </div>
        </div>

        {/* Recent Record List Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
             <div className="text-sm font-bold text-slate-800 mb-3">专注记录 (最近3条)</div>
             <div className="space-y-3">
                 {records.slice().reverse().slice(0, 3).map(rec => (
                     <div key={rec.id} className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tags.find(t => t.name === rec.tagName)?.color || '#cbd5e1' }}></span>
                            <span className="text-slate-600">{format(rec.startTime, 'MM-dd HH:mm')}</span>
                            <span className="text-slate-400 text-xs">- {format(rec.endTime, 'HH:mm')}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">{rec.tagName}</span>
                            <span className="font-medium text-indigo-600">{formatDurationSimple(rec.durationSeconds)}</span>
                         </div>
                     </div>
                 ))}
                 {records.length === 0 && <div className="text-center text-slate-400 text-sm py-2">暂无记录</div>}
             </div>
        </div>

        {/* Focus Details (Pie Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-slate-800">专注详情</h3>
             <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(['day', 'week', 'month'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        {tab === 'day' ? '今天' : tab === 'week' ? '本周' : '本月'}
                    </button>
                ))}
             </div>
          </div>
          
          <div className="h-64 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${Math.round(value / 60)} 分钟`} />
                </PieChart>
             </ResponsiveContainer>
             {/* Center Text */}
             <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                 <div className="text-2xl font-bold text-slate-800">
                    {activeTab === 'day' ? formatDurationSimple(todayDurationSeconds) : 
                     formatDurationSimple(pieData.reduce((a,b) => a + b.value, 0))}
                 </div>
             </div>
          </div>

          {/* Custom Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-500">{formatDurationSimple(item.value)}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* Best Focus Time (Bar Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
             <h3 className="font-bold text-slate-800 mb-4">最佳专注时间</h3>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <XAxis 
                            dataKey="hour" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            interval={3} // Show every 3rd label
                        />
                        <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Yearly Heatmap */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800">年度热力图</h3>
                 <span className="text-xs text-slate-400">{format(new Date(), 'yyyy')}</span>
             </div>
             <div className="flex flex-wrap gap-1 justify-center">
                 {/* Rendering a simplified heatmap: just boxes */}
                 {heatmapData.map((d, i) => (
                     <div 
                        key={i}
                        className={`w-2.5 h-2.5 rounded-[2px] ${
                            d.level === 0 ? 'bg-slate-100' :
                            d.level === 1 ? 'bg-blue-200' :
                            d.level === 2 ? 'bg-blue-400' :
                            d.level === 3 ? 'bg-blue-600' :
                            'bg-blue-800'
                        }`}
                        title={`${format(d.date, 'yyyy-MM-dd')}`}
                     ></div>
                 ))}
             </div>
             <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-slate-400">
                 <span>Less</span>
                 <div className="w-2 h-2 bg-slate-100 rounded-[1px]"></div>
                 <div className="w-2 h-2 bg-blue-200 rounded-[1px]"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-[1px]"></div>
                 <div className="w-2 h-2 bg-blue-600 rounded-[1px]"></div>
                 <div className="w-2 h-2 bg-blue-800 rounded-[1px]"></div>
                 <span>More</span>
             </div>
        </div>

      </div>
    </div>
  );
};