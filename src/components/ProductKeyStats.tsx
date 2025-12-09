import React, { useMemo, useState } from 'react';
import { Product, ProductKey } from '../lib/supabase';
import { BarChart3, CheckCircle, XCircle, KeyRound, TrendingUp, DollarSign, ArrowUpDown, Calendar, PieChart, Activity, AlertTriangle, Package, Filter, CalendarRange, ArrowRight, ChevronDown, Clock } from 'lucide-react';
import WithdrawalCalculator from './WithdrawalCalculator';

interface ProductKeyStatsProps {
  products: Product[];
  keys: ProductKey[];
}

// Using lowercase keys for robust matching
const NET_PRICES: Record<string, number> = {
    "sinki tdm": 48.5,
    "cheatloop exclusive": 48.5,
    "cheatloop call of duty mobile": 31.0,
    "cheatloop esp": 30.0,
    "sinki esp": 30.0,
    "cheatloop normal": 42.75,
    "sinki gold": 42.75,
};

type SortField = 'title' | 'total' | 'available' | 'used' | 'revenue';
type SortDirection = 'asc' | 'desc';
type TimeRange = '24h' | '3days' | 'week' | 'month' | '2months' | '3months' | 'custom';

// Modern Date Input Component
const ModernDateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    return (
        <div className="relative group">
            <div className="absolute -top-2 right-3 bg-slate-800 px-1 text-[10px] text-cyan-400 font-bold z-10">
                {label}
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-600 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors h-10 w-40">
                <input 
                    type="date" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-full bg-transparent text-white px-3 text-sm focus:outline-none font-mono text-center uppercase tracking-wider"
                    style={{ colorScheme: 'dark' }}
                />
            </div>
        </div>
    );
};

const ProductKeyStats: React.FC<ProductKeyStatsProps> = ({ products, keys }) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Date Filtering State
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- Advanced Calculations ---
  const statsData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); // End of today/now

    // 1. Determine Date Range
    if (timeRange === 'custom') {
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '24h') {
        // Exact last 24 hours
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
    } else {
        // Day-based ranges
        const daysToSubtract = 
            timeRange === '3days' ? 2 : // Today + 2 previous days
            timeRange === 'week' ? 6 : 
            timeRange === 'month' ? 29 : 
            timeRange === '2months' ? 59 : 
            timeRange === '3months' ? 89 : 6;
        
        startDate.setDate(now.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // 2. Filter Keys by Date Range
    const keysInPeriod = keys.filter(key => {
        if (!key.is_used || !key.used_at) return false;
        const usedDate = new Date(key.used_at);
        return usedDate >= startDate && usedDate <= endDate;
    });

    const availableKeysCount = keys.filter(key => !key.is_used).length;
    
    // 3. Product-level Stats (Based on Filtered Keys)
    const productStats = products.map(product => {
        const productKeysTotal = keys.filter(key => key.product_id === product.id);
        const productKeysUsedInPeriod = keysInPeriod.filter(key => key.product_id === product.id);
        
        const totalInventory = productKeysTotal.length;
        const usedTotal = productKeysTotal.filter(k => k.is_used).length;
        const available = totalInventory - usedTotal;
        
        const usedInPeriod = productKeysUsedInPeriod.length;

        // Calculate Revenue
        const normalizedTitle = product.title.toLowerCase().trim();
        let price = 0;
        if (NET_PRICES[normalizedTitle]) {
            price = NET_PRICES[normalizedTitle];
        } else if (normalizedTitle.includes('codm')) {
            price = 31.0;
        } else {
            price = product.price * 0.85; 
        }
        const revenue = usedInPeriod * price;

        return {
            id: product.id,
            title: product.title,
            image: product.image,
            total: totalInventory,
            usedAllTime: usedTotal,
            available,
            usedInPeriod,
            revenue,
            fillRate: totalInventory > 0 ? (usedTotal / totalInventory) * 100 : 0
        };
    });

    // 4. Total Revenue
    const totalRevenue = productStats.reduce((acc, curr) => acc + curr.revenue, 0);

    // 5. Sales Trend Generation (Hourly for 24h, Daily for others)
    const salesTrend = [];
    
    if (timeRange === '24h') {
        // Hourly Breakdown
        let currentHour = new Date(startDate);
        // Round down to nearest hour for cleaner start
        currentHour.setMinutes(0, 0, 0);

        while (currentHour <= endDate) {
            const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000);
            
            const keysInThisHour = keysInPeriod.filter(k => {
                const kDate = new Date(k.used_at!);
                return kDate >= currentHour && kDate < nextHour;
            });

            const hourRevenue = keysInThisHour.reduce((acc, key) => {
                const prod = products.find(p => p.id === key.product_id);
                if (!prod) return acc;
                const title = prod.title.toLowerCase().trim();
                return acc + (NET_PRICES[title] || (title.includes('codm') ? 31.0 : prod.price * 0.85));
            }, 0);

            salesTrend.push({
                label: currentHour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                fullLabel: currentHour.toLocaleString('en-GB', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }),
                count: keysInThisHour.length,
                revenue: hourRevenue,
                isHourly: true
            });

            currentHour = nextHour;
        }
    } else {
        // Daily Breakdown
        let currentDay = new Date(startDate);
        // Reset to start of day
        currentDay.setHours(0, 0, 0, 0);

        const safetyLimit = new Date(endDate);
        safetyLimit.setHours(23, 59, 59, 999);

        while (currentDay <= safetyLimit) {
            const dayStr = currentDay.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const keysInThisDay = keysInPeriod.filter(k => {
                if (!k.used_at) return false;
                // Simple string comparison for date part is safer/faster for days
                return k.used_at.startsWith(dayStr);
            });

            const dayRevenue = keysInThisDay.reduce((acc, key) => {
                const prod = products.find(p => p.id === key.product_id);
                if (!prod) return acc;
                const title = prod.title.toLowerCase().trim();
                return acc + (NET_PRICES[title] || (title.includes('codm') ? 31.0 : prod.price * 0.85));
            }, 0);

            salesTrend.push({
                label: currentDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                fullLabel: currentDay.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                count: keysInThisDay.length,
                revenue: dayRevenue,
                isHourly: false
            });

            currentDay.setDate(currentDay.getDate() + 1);
        }
    }

    const maxTrendValue = Math.max(...salesTrend.map(d => d.revenue), 1);
    const averageRevenue = totalRevenue / (salesTrend.length || 1);

    return { 
        productStats, 
        totalRevenue, 
        totalUsedKeysInPeriod: keysInPeriod.length, 
        totalAvailableKeys: availableKeysCount,
        salesTrend,
        maxTrendValue,
        averageRevenue,
        startDate,
        endDate
    };
  }, [products, keys, timeRange, customStartDate, customEndDate]);

  const sortedStats = useMemo(() => {
    return [...statsData.productStats].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'used') {
          comparison = a.usedInPeriod - b.usedInPeriod;
      } else {
        comparison = (a[sortField as keyof typeof a] as number) - (b[sortField as keyof typeof b] as number);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [statsData.productStats, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600 inline-block ml-1 opacity-50" />;
    return <ArrowUpDown className={`w-3 h-3 text-cyan-400 inline-block ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* 0. Advanced Date Filter Bar */}
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-lg flex flex-col xl:flex-row gap-6 items-center justify-between sticky top-4 z-30">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                  <CalendarRange className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h3 className="text-white font-bold text-lg">تحليل المبيعات</h3>
                  <p className="text-gray-400 text-xs font-mono flex items-center gap-2 mt-1">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {timeRange === '24h' 
                            ? statsData.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'}) 
                            : statsData.startDate.toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-cyan-500">→</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {timeRange === '24h' ? 'الآن' : statsData.endDate.toLocaleDateString('en-GB')}
                      </span>
                  </p>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center xl:justify-end flex-1 w-full">
              <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full no-scrollbar">
                  {[
                      { id: '24h', label: '24 ساعة' },
                      { id: '3days', label: '3 أيام' },
                      { id: 'week', label: 'أسبوع' },
                      { id: 'month', label: 'شهر' },
                      { id: '2months', label: 'شهرين' },
                      { id: '3months', label: '3 أشهر' },
                      { id: 'custom', label: 'مخصص' },
                  ].map((range) => (
                      <button
                          key={range.id}
                          onClick={() => setTimeRange(range.id as TimeRange)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                              timeRange === range.id 
                                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
                          }`}
                      >
                          {range.label}
                      </button>
                  ))}
              </div>

              {timeRange === 'custom' && (
                  <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-700 animate-fade-in-up">
                      <ModernDateInput label="من" value={customStartDate} onChange={setCustomStartDate} />
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <ModernDateInput label="إلى" value={customEndDate} onChange={setCustomEndDate} />
                  </div>
              )}
          </div>
      </div>

      {/* 1. Hero Stats Cards (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-slate-900 rounded-2xl p-6 border border-emerald-500/20 shadow-lg group hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> أرباح الفترة
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">${statsData.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[10px] text-emerald-500/70 mt-1 font-mono">
                        Avg: ${statsData.averageRevenue.toFixed(1)} / {timeRange === '24h' ? 'hour' : 'day'}
                    </p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Sales Count Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-slate-900 rounded-2xl p-6 border border-blue-500/20 shadow-lg group hover:border-blue-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> مبيعات الفترة
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{statsData.totalUsedKeysInPeriod}</h3>
                    <p className="text-[10px] text-blue-500/70 mt-1">
                        مفتاح تم بيعه
                    </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Inventory Card (Static - Current State) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-2xl p-6 border border-purple-500/20 shadow-lg group hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Package className="w-3 h-3" /> المخزون الحالي
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{statsData.totalAvailableKeys}</h3>
                    <p className="text-[10px] text-purple-500/70 mt-1">
                        مفتاح متاح للبيع الآن
                    </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                    <KeyRound className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Low Stock Alert */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-900/40 to-slate-900 rounded-2xl p-6 border border-red-500/20 shadow-lg group hover:border-red-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> تنبيه المخزون
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                        {statsData.productStats.filter(p => p.available < 5).length}
                    </h3>
                    <p className="text-[10px] text-red-500/70 mt-1">منتجات أوشكت على النفاذ</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
                    <XCircle className="w-6 h-6" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Enhanced Sales Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    المسار الزمني للمبيعات
                </h3>
                <div className="text-xs text-gray-400 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    {timeRange === '24h' ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    <span>{statsData.salesTrend.length} {timeRange === '24h' ? 'ساعة' : 'يوم'}</span>
                </div>
            </div>
            
            <div className="flex-1 w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                <div className="h-64 flex items-end gap-2 px-2" style={{ minWidth: `${Math.max(100, statsData.salesTrend.length * (timeRange === '24h' ? 40 : 20))}px`, width: '100%' }}>
                    {statsData.salesTrend.map((point, index) => {
                        const heightPercent = (point.revenue / statsData.maxTrendValue) * 100;
                        
                        // Determine bar width based on dataset size
                        const barWidthClass = statsData.salesTrend.length > 60 ? 'w-2' : statsData.salesTrend.length > 30 ? 'w-3' : 'flex-1 max-w-[50px]';

                        return (
                            <div key={index} className={`flex flex-col items-center gap-2 group relative ${barWidthClass} h-full justify-end`}>
                                {/* Tooltip */}
                                <div className="absolute bottom-[calc(100%+10px)] mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-xs p-3 rounded-xl border border-slate-600 shadow-2xl whitespace-nowrap z-20 pointer-events-none left-1/2 -translate-x-1/2 transform translate-y-2 group-hover:translate-y-0">
                                    <div className="font-bold mb-1 border-b border-slate-600 pb-1 text-cyan-300">{point.fullLabel}</div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">الإيرادات:</span>
                                        <span className="text-green-400 font-mono font-bold">${point.revenue.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">المبيعات:</span>
                                        <span className="text-white font-mono">{point.count}</span>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                </div>
                                
                                {/* Bar */}
                                <div className="w-full bg-slate-800/40 rounded-t-lg relative flex items-end overflow-hidden hover:bg-slate-800/60 transition-colors h-full">
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-700 ease-out relative 
                                            ${point.revenue > 0 
                                                ? 'bg-gradient-to-t from-cyan-600 via-blue-500 to-purple-500 group-hover:from-cyan-500 group-hover:via-blue-400 group-hover:to-purple-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                                : 'bg-slate-800'}`}
                                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                    >
                                        {/* Top Glow */}
                                        {point.revenue > 0 && (
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Label (Show periodically if too many days) */}
                                {(statsData.salesTrend.length <= 14 || index % (timeRange === '24h' ? 3 : 5) === 0) && (
                                    <span className="text-[10px] text-gray-500 font-mono rotate-0 whitespace-nowrap mt-1">{point.label}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* 3. Withdrawal Calculator (Integrated) */}
        <div className="lg:col-span-1 h-full">
            <WithdrawalCalculator totalSales={statsData.totalRevenue} />
        </div>
      </div>

      {/* 4. Detailed Product Table */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  تفاصيل أداء المنتجات (للفترة المحددة)
              </h3>
              <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> متوفر
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> منخفض
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> نفذ
                  </div>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                      <tr>
                          <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                              المنتج <SortIcon field="title" />
                          </th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('revenue')}>
                              إيرادات الفترة <SortIcon field="revenue" />
                          </th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('used')}>
                              مبيعات الفترة <SortIcon field="used" />
                          </th>
                          <th className="p-4 text-center w-1/5">حالة المخزون</th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('available')}>
                              المتاح حالياً <SortIcon field="available" />
                          </th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                      {sortedStats.map((stat) => {
                          // Inventory Health Color
                          let progressColor = 'bg-blue-500';
                          if (stat.available === 0) progressColor = 'bg-red-500';
                          else if (stat.available < 5) progressColor = 'bg-yellow-500';
                          else progressColor = 'bg-green-500';

                          return (
                              <tr key={stat.id} className="hover:bg-slate-800/30 transition-colors group">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                              {stat.image ? (
                                                  <img src={stat.image} alt={stat.title} className="w-full h-full object-cover" />
                                              ) : (
                                                  <Package className="w-5 h-5 text-slate-500" />
                                              )}
                                          </div>
                                          <div>
                                              <div className="font-bold text-white">{stat.title}</div>
                                              <div className="text-xs text-gray-500 mt-0.5">ID: {stat.id.substring(0, 8)}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                                          ${stat.revenue.toFixed(2)}
                                      </span>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="text-white font-bold">{stat.usedInPeriod}</span>
                                      <span className="text-gray-500 text-xs ml-1">/ {stat.usedAllTime}</span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                              <div 
                                                  className={`h-full ${progressColor} rounded-full transition-all duration-1000`} 
                                                  style={{ width: `${stat.fillRate}%` }}
                                              ></div>
                                          </div>
                                          <span className="text-xs text-gray-400 w-8 text-left">{Math.round(stat.fillRate)}%</span>
                                      </div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${stat.available > 0 ? (stat.available < 5 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20') : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                          {stat.available}
                                      </span>
                                  </td>
                              </tr>
                          );
                      })}
                      {sortedStats.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد بيانات لعرضها.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default ProductKeyStats;
