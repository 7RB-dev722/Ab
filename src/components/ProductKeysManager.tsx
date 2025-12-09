import React, { useState, useMemo } from 'react';
import { Product, ProductKey, productKeysService } from '../lib/supabase';
import { Plus, Trash2, Filter, Undo2, CheckCircle, Copy, Search, X, KeyRound, BarChart3, AlertCircle, Mail, Calendar, Terminal, ShieldCheck, ShieldAlert, Layers } from 'lucide-react';

interface ProductKeysManagerProps {
  products: Product[];
  keys: ProductKey[];
  onKeysUpdate: () => void;
  saving: boolean;
  setSaving: (s: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
}

const ProductKeysManager: React.FC<ProductKeysManagerProps> = ({ products, keys, onKeysUpdate, saving, setSaving, setError, setSuccess }) => {
  const [newKeysData, setNewKeysData] = useState({ productId: '', keys: '' });
  const [filters, setFilters] = useState({ productId: 'all', status: 'all' });
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);

  // Calculate Stats
  const stats = useMemo(() => {
    const total = keys.length;
    const used = keys.filter(k => k.is_used).length;
    const available = total - used;
    return { total, used, available };
  }, [keys]);

  const handleAddKeys = async () => {
    if (!newKeysData.productId || !newKeysData.keys.trim()) {
      setError('الرجاء اختيار منتج وإدخال مفتاح واحد على الأقل.');
      return;
    }
    const keysArray = newKeysData.keys.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      setError('الرجاء إدخال مفاتيح صالحة.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const insertedCount = await productKeysService.addKeys(newKeysData.productId, keysArray);
      const totalAttempted = keysArray.length;
      const skippedCount = totalAttempted - insertedCount;

      let successMessage = `تمت إضافة ${insertedCount} مفتاح جديد بنجاح.`;
      if (skippedCount > 0) {
        successMessage += ` تم تجاهل ${skippedCount} مفتاح مكرر.`;
      }
      
      setSuccess(successMessage);
      setNewKeysData({ productId: '', keys: '' });
      setIsAddMode(false);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتاح؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.deleteKey(keyId);
        setSuccess('تم حذف المفتاح بنجاح.');
        onKeysUpdate();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleReturnKey = async (keyId: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد إرجاع هذا المفتاح؟ سيصبح متاحًا للاستخدام مرة أخرى.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.returnKey(keyId);
        setSuccess('تم إرجاع المفتاح بنجاح.');
        onKeysUpdate();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleCopyKey = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue).then(() => {
      setCopiedKey(keyValue);
      setSuccess('تم النسخ!');
      setTimeout(() => {
        setCopiedKey(null);
        setSuccess(null);
      }, 2000);
    }).catch(err => {
      console.warn("Clipboard API failed", err);
      setError('فشل النسخ');
    });
  };

  const filteredKeys = useMemo(() => {
    return keys
      .filter(key => {
        const productMatch = filters.productId === 'all' || key.product_id === filters.productId;
        const statusMatch = filters.status === 'all' || (filters.status === 'used' ? key.is_used : !key.is_used);
        
        const searchTermLower = keySearchTerm.toLowerCase();
        const searchMatch = !keySearchTerm ||
          (key.key_value && key.key_value.toLowerCase().includes(searchTermLower)) ||
          (key.used_by_email && key.used_by_email.toLowerCase().includes(searchTermLower));
        
        return productMatch && statusMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.is_used !== b.is_used) {
            return a.is_used ? 1 : -1; // Available first
        }
        if (a.is_used && a.used_at && b.used_at) {
            return new Date(b.used_at).getTime() - new Date(a.used_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [keys, filters, keySearchTerm]);

  const handleToggleKeySelection = (keyId: string) => {
    setSelectedKeys(prev => 
      prev.includes(keyId) 
        ? prev.filter(id => id !== keyId)
        : [...prev, keyId]
    );
  };

  const handleSelectAllKeys = (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedKeys(filteredKeys.map(k => k.id));
    } else {
      setSelectedKeys([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف ${selectedKeys.length} من المفاتيح المحددة؟`)) return;
    setSaving(true);
    setError(null);
    try {
      await productKeysService.deleteKeys(selectedKeys);
      setSuccess(`تم حذف ${selectedKeys.length} مفتاح بنجاح.`);
      setSelectedKeys([]);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnSelected = async () => {
    if (!window.confirm(`هل أنت متأكد أنك تريد إرجاع ${selectedKeys.length} من المفاتيح المحددة؟`)) return;
    setSaving(true);
    setError(null);
    try {
      await productKeysService.returnKeys(selectedKeys);
      setSuccess(`تم إرجاع ${selectedKeys.length} مفتاح بنجاح.`);
      setSelectedKeys([]);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.title || 'منتج غير معروف';

  return (
    <div className="space-y-8">
      
      {/* 1. Modern Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Keys */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg group hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-blue-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <Layers className="w-4 h-4" /> إجمالي المفاتيح
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.total}</h3>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-blue-400 shadow-inner">
                      <KeyRound className="w-6 h-6" />
                  </div>
              </div>
          </div>

          {/* Available Keys */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg group hover:border-green-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-green-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> متاح للبيع
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.available}</h3>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-green-400 shadow-inner">
                      <CheckCircle className="w-6 h-6" />
                  </div>
              </div>
          </div>

          {/* Used Keys */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-red-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> مستخدم
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.used}</h3>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-red-400 shadow-inner">
                      <AlertCircle className="w-6 h-6" />
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Add Keys Section (Terminal Style) */}
      {isAddMode ? (
        <div className="bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/20 animate-fade-in-up overflow-hidden">
            <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    <span className="font-mono">System.AddKeys()</span>
                </h3>
                <button onClick={() => setIsAddMode(false)} className="text-gray-400 hover:text-white transition-colors bg-slate-700 hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Target Product</label>
                        <select 
                            value={newKeysData.productId} 
                            onChange={(e) => setNewKeysData({ ...newKeysData, productId: e.target.value })} 
                            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750"
                        >
                            <option value="">-- Select Product --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                        <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> تعليمات</h4>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                            <li>الصق المفاتيح في الحقل المقابل.</li>
                            <li>يجب أن يكون كل مفتاح في سطر منفصل.</li>
                            <li>سيقوم النظام تلقائيًا بإزالة المسافات الزائدة.</li>
                            <li>المفاتيح المكررة سيتم تجاهلها.</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Key Data Stream</label>
                    <textarea 
                        value={newKeysData.keys} 
                        onChange={(e) => setNewKeysData({ ...newKeysData, keys: e.target.value })} 
                        className="flex-1 w-full p-4 bg-black/40 border border-slate-600 rounded-xl text-green-400 focus:outline-none focus:border-green-500 font-mono text-sm resize-none shadow-inner" 
                        placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY"
                    ></textarea>
                </div>
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                <button onClick={() => setIsAddMode(false)} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium text-sm">إلغاء الأمر</button>
                <button onClick={handleAddKeys} disabled={saving} className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20 font-bold text-sm">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>تنفيذ الإضافة</span>
                </button>
            </div>
        </div>
      ) : (
          <div className="flex justify-end">
              <button onClick={() => setIsAddMode(true)} className="group relative overflow-hidden rounded-xl bg-cyan-600 px-6 py-3 text-white shadow-lg transition-all hover:bg-cyan-500 hover:shadow-cyan-500/25 active:scale-95">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="flex items-center gap-2 font-bold relative z-10">
                      <Plus className="w-5 h-5" />
                      إضافة مفاتيح جديدة
                  </span>
              </button>
          </div>
      )}
      
      {/* 3. Floating Filter Bar */}
      <div className="sticky top-4 z-30 mx-auto max-w-full">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Left: Selection Info & Bulk Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-700">
                      <input 
                          type="checkbox" 
                          id="selectAllKeys"
                          className="w-5 h-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 cursor-pointer" 
                          checked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0} 
                          onChange={(e) => handleSelectAllKeys(e.target.checked)} 
                          disabled={filteredKeys.length === 0}
                      />
                      <label htmlFor="selectAllKeys" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
                          {selectedKeys.length > 0 ? `تم تحديد ${selectedKeys.length}` : 'تحديد الكل'}
                      </label>
                  </div>

                  {selectedKeys.length > 0 && (
                      <div className="flex items-center gap-2 animate-fade-in-up">
                          <button onClick={handleReturnSelected} disabled={saving} className="p-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors" title="إرجاع المحدد">
                              <Undo2 className="w-5 h-5" />
                          </button>
                          <button onClick={handleDeleteSelected} disabled={saving} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors" title="حذف المحدد">
                              <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                  )}
              </div>

              {/* Right: Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <div className="relative group">
                      <select 
                          value={filters.productId} 
                          onChange={e => setFilters({...filters, productId: e.target.value})} 
                          className="appearance-none pl-4 pr-10 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-slate-800 min-w-[140px]"
                      >
                          <option value="all">كل المنتجات</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                  </div>

                  <div className="relative group">
                      <select 
                          value={filters.status} 
                          onChange={e => setFilters({...filters, status: e.target.value})} 
                          className="appearance-none pl-4 pr-10 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-slate-800"
                      >
                          <option value="all">كل الحالات</option>
                          <option value="available">متاح</option>
                          <option value="used">مستخدم</option>
                      </select>
                  </div>

                  <div className="relative flex-1 md:flex-none min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input 
                          type="text" 
                          placeholder="بحث..." 
                          value={keySearchTerm} 
                          onChange={e => setKeySearchTerm(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder-gray-500" 
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* 4. Keys Grid (Data Chips Design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredKeys.map(key => (
              <div 
                  key={key.id} 
                  className={`
                    group relative bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 flex flex-col gap-3 overflow-hidden
                    ${selectedKeys.includes(key.id) ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-700 hover:border-slate-500 hover:shadow-lg'}
                  `}
              >
                  {/* Decorative Corner */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${key.is_used ? 'from-red-500/10' : 'from-green-500/10'} to-transparent -mr-8 -mt-8 rounded-full blur-xl`}></div>

                  {/* Header */}
                  <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <input 
                              type="checkbox" 
                              className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 cursor-pointer flex-shrink-0" 
                              checked={selectedKeys.includes(key.id)} 
                              onChange={() => handleToggleKeySelection(key.id)} 
                          />
                          <div className="min-w-0">
                              <h4 className="text-gray-300 font-medium text-xs truncate" title={getProductName(key.product_id)}>
                                  {getProductName(key.product_id)}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`w-2 h-2 rounded-full ${key.is_used ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}></span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${key.is_used ? 'text-red-400' : 'text-green-400'}`}>
                                      {key.is_used ? 'مستخدم' : 'متاح'}
                                  </span>
                              </div>
                          </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {key.is_used ? (
                              <button onClick={() => handleReturnKey(key.id)} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="إرجاع">
                                  <Undo2 className="w-4 h-4" />
                              </button>
                          ) : (
                              <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="حذف">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Key Value Display */}
                  <div className="bg-black/40 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between gap-2 group-hover:border-slate-600 transition-colors relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 opacity-50"></div>
                      <div className="flex items-center gap-2 overflow-hidden pl-2">
                          <KeyRound className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <code className="text-cyan-100 font-mono text-sm truncate select-all tracking-wider">{key.key_value}</code>
                      </div>
                      <button onClick={() => handleCopyKey(key.key_value)} className="text-gray-500 hover:text-white p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0" title="نسخ">
                          {copiedKey === key.key_value ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                  </div>

                  {/* Footer Info */}
                  {key.is_used && (
                      <div className="mt-auto pt-2 border-t border-slate-700/30 flex flex-col gap-1.5 text-[11px] text-gray-500">
                          <div className="flex items-center gap-1.5 text-gray-400 w-full">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate hover:text-white transition-colors select-all">{key.used_by_email || 'غير معروف'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>{key.used_at ? new Date(key.used_at).toLocaleDateString('en-GB') : '-'}</span>
                              </div>
                              <span className="font-mono text-slate-600">{key.used_at ? new Date(key.used_at).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                          </div>
                      </div>
                  )}
                  
                  {!key.is_used && (
                      <div className="mt-auto pt-2 border-t border-slate-700/30 flex items-center justify-between text-[11px] text-gray-600">
                          <span>تاريخ الإضافة:</span>
                          <span className="font-mono">{new Date(key.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                  )}
              </div>
          ))}
      </div>

      {filteredKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-800/20 rounded-3xl border border-slate-700/50 border-dashed">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <KeyRound className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لا توجد مفاتيح</h3>
              <p className="text-gray-500 max-w-md text-center px-4">
                  {keySearchTerm ? 'لا توجد نتائج تطابق بحثك. حاول استخدام كلمات مفتاحية مختلفة.' : 'المخزون فارغ حالياً. قم بإضافة مفاتيح جديدة للبدء.'}
              </p>
              {keySearchTerm && (
                  <button onClick={() => setKeySearchTerm('')} className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      مسح البحث
                  </button>
              )}
          </div>
      )}
    </div>
  );
};

export default ProductKeysManager;
