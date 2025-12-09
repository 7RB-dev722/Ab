import React, { useMemo, useState } from 'react';
import { Product, ProductKey } from '../lib/supabase';
import { BarChart3, CheckCircle, XCircle, KeyRound, TrendingUp, DollarSign, ArrowUpDown, Calendar, PieChart, Activity, AlertTriangle, Package } from 'lucide-react';
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

const ProductKeyStats: React.FC<ProductKeyStatsProps> = ({ products, keys }) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // --- Advanced Calculations ---
  const statsData = useMemo(() => {
    const usedKeys = keys.filter(key => key.is_used);
    const availableKeysCount = keys.filter(key => !key.is_used).length;
    
    // 1. Product-level Stats
    const productStats = products.map(product => {
        const productKeys = keys.filter(key => key.product_id === product.id);
        const total = productKeys.length;
        const used = productKeys.filter(key => key.is_used).length;
        const available = total - used;
        
        // Calculate Revenue
        const normalizedTitle = product.title.toLowerCase().trim();
        let price = 0;
        if (NET_PRICES[normalizedTitle]) {
            price = NET_PRICES[normalizedTitle];
        } else if (normalizedTitle.includes('codm')) {
            price = 31.0;
        } else {
            // Fallback estimate if not in NET_PRICES (approximate from price)
            price = product.price * 0.85; 
        }
        const revenue = used * price;

        return {
            id: product.id,
            title: product.title,
            total,
            used,
            available,
            revenue,
            fillRate: total > 0 ? (used / total) * 100 : 0
        };
    });

    // 2. Total Revenue
    const totalRevenue = productStats.reduce((acc, curr) => acc + curr.revenue, 0);

    // 3. Sales History (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }).reverse();

    const salesTrend = last7Days.map(date => {
        const count = usedKeys.filter(k => k.used_at && k.used_at.startsWith(date)).length;
        const dayRevenue = usedKeys
            .filter(k => k.used_at && k.used_at.startsWith(date))
            .reduce((acc, key) => {
                const prod = products.find(p => p.id === key.product_id);
                if (!prod) return acc;
                const title = prod.title.toLowerCase().trim();
                return acc + (NET_PRICES[title] || (title.includes('codm') ? 31.0 : prod.price * 0.85));
            }, 0);
            
        return { date, count, revenue: dayRevenue };
    });

    const maxDailySales = Math.max(...salesTrend.map(d => d.revenue), 1); // Avoid division by zero

    return { 
        productStats, 
        totalRevenue, 
        totalUsedKeys: usedKeys.length, 
        totalAvailableKeys: availableKeysCount,
        salesTrend,
        maxDailySales
    };
  }, [products, keys]);

  const sortedStats = useMemo(() => {
    return [...statsData.productStats].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        comparison = a[sortField] - b[sortField];
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
      
      {/* 1. Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-slate-900 rounded-2xl p-6 border border-emerald-500/20 shadow-lg group hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> صافي الأرباح
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">${statsData.totalRevenue.toFixed(2)}</h3>
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
                        <Activity className="w-3 h-3" /> المفاتيح المباعة
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{statsData.totalUsedKeys}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Inventory Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-2xl p-6 border border-purple-500/20 shadow-lg group hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Package className="w-3 h-3" /> المخزون المتاح
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{statsData.totalAvailableKeys}</h3>
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
                    <p className="text-xs text-gray-400 mt-1">منتجات أوشكت على النفاذ</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
                    <XCircle className="w-6 h-6" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Sales Trend Chart (CSS Based) */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    تحليل المبيعات (آخر 7 أيام)
                </h3>
                <div className="text-xs text-gray-400 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <Calendar className="w-3 h-3" /> 
                    <span>تحديث تلقائي</span>
                </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
                {statsData.salesTrend.map((day, index) => {
                    const heightPercent = (day.revenue / statsData.maxDailySales) * 100;
                    const dateLabel = new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' });
                    const fullDate = new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs p-2 rounded-lg border border-slate-600 shadow-xl whitespace-nowrap z-10 pointer-events-none">
                                <div className="font-bold mb-1">{fullDate}</div>
                                <div className="text-green-400">${day.revenue.toFixed(1)}</div>
                                <div className="text-gray-400">{day.count} مفاتيح</div>
                            </div>
                            
                            {/* Bar */}
                            <div className="w-full bg-slate-800/50 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                <div 
                                    className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-lg transition-all duration-1000 ease-out hover:from-cyan-500 hover:to-blue-400 relative group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                >
                                    {heightPercent > 15 && (
                                        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/80 hidden sm:block">
                                            ${Math.round(day.revenue)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Label */}
                            <span className="text-xs text-gray-500 font-medium">{dateLabel}</span>
                        </div>
                    );
                })}
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
                  تفاصيل أداء المنتجات
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
                              الإيرادات <SortIcon field="revenue" />
                          </th>
                          <th className="p-4 text-center w-1/4">استهلاك المخزون</th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('available')}>
                              المتاح <SortIcon field="available" />
                          </th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('used')}>
                              المباع <SortIcon field="used" />
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
                                      <div className="font-bold text-white">{stat.title}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">ID: {stat.id.substring(0, 8)}</div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                                          ${stat.revenue.toFixed(2)}
                                      </span>
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
                                  <td className="p-4 text-center text-white font-medium">{stat.used}</td>
                              </tr>
                          );
                      })}
                      {sortedStats.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-500">لا توجد بيانات لعرضها.</td>
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
