import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plus, Edit, Trash2, X, LogOut, Package, DollarSign, RefreshCw, Tag, AlertCircle, CheckCircle, ImageIcon, Eye, EyeOff, Home, UploadCloud, LayoutDashboard, Image as LucideImage, Settings, Link as LinkIcon, Palette, PlayCircle, QrCode, Users, CreditCard, Send, Mail, Printer, MessageSquare, ExternalLink, FileText, KeyRound, Clock, Search, Filter, TimerOff, Save, Copy, Calendar, Hourglass, GripVertical, Bell, BellRing, Radio, Zap, Wifi, BarChart3, Server, MoreVertical, ChevronDown, ChevronUp, AlertTriangle, ShoppingCart, Globe, Scissors, Download, List, History, Smartphone, Hash, Activity, Layers, ShieldCheck, ShieldAlert, Terminal, ImagePlus, MousePointerClick, Check, CalendarRange, ArrowRight, UserPlus } from 'lucide-react';
import { productService, categoryService, winningPhotosService, settingsService, purchaseImagesService, purchaseIntentsService, testSupabaseConnection, Product, Category, WinningPhoto, SiteSetting, PurchaseImage, PurchaseIntent, supabase, invoiceTemplateService, InvoiceTemplateData, ProductKey, productKeysService } from '../lib/supabase';
import { Link } from 'react-router-dom';
import SiteContentEditor from './SiteContentEditor';
import InvoiceEditor from './InvoiceEditor';
import ProductKeysManager from './ProductKeysManager';
import ProductKeyStats from './ProductKeyStats';
import UserManagement from './UserManagement';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useSettings } from '../contexts/SettingsContext';
import InvoiceTemplate, { InvoiceTheme } from './InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

const WINNING_PHOTO_PRODUCTS = ['Cheatloop PUBG', 'Cheatloop CODM', 'Sinki'];

type AdminTab = 'dashboard' | 'products' | 'categories' | 'photos' | 'purchase-images' | 'purchase-intents' | 'content' | 'settings' | 'invoice-templates' | 'keys' | 'key-stats' | 'users' | 'expired-keys';

const ADMIN_TABS_CONFIG = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'categories', label: 'الأقسام', icon: Tag },
  { id: 'keys', label: 'إدارة المفاتيح', icon: KeyRound },
  { id: 'key-stats', label: 'الإحصائيات', icon: BarChart3 },
  { id: 'expired-keys', label: 'متابعة الاشتراكات', icon: TimerOff },
  { id: 'users', label: 'المستخدمين', icon: Users },
  { id: 'photos', label: 'صور الفوز', icon: LucideImage },
  { id: 'purchase-images', label: 'صور الدفع', icon: QrCode },
  { id: 'purchase-intents', label: 'طلبات الشراء', icon: CreditCard },
  { id: 'content', label: 'تخصيص الموقع', icon: Palette },
  { id: 'invoice-templates', label: 'قوالب الفواتير', icon: FileText },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

// Invoice Themes Configuration
const INVOICE_THEMES: Record<string, InvoiceTheme & { name: string }> = {
  navy: { 
    name: 'أزرق داكن (افتراضي)', 
    backgroundColor: '#0f1724', 
    textColor: '#e6eef8', 
    panelColor: '#1e293b', 
    borderColor: '#334155', 
    mutedColor: '#94a3b8' 
  },
  midnight: { 
    name: 'أسود ليلي', 
    backgroundColor: '#000000', 
    textColor: '#ffffff', 
    panelColor: '#121212', 
    borderColor: '#333333', 
    mutedColor: '#888888' 
  },
  white: { 
    name: 'أبيض (قياسي)', 
    backgroundColor: '#ffffff', 
    textColor: '#0f1724', 
    panelColor: '#f1f5f9', 
    borderColor: '#e2e8f0', 
    mutedColor: '#64748b' 
  },
  royal: { 
    name: 'أزرق ملكي', 
    backgroundColor: '#172554', 
    textColor: '#f0f9ff', 
    panelColor: '#1e3a8a', 
    borderColor: '#1d4ed8', 
    mutedColor: '#93c5fd' 
  },
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.51, now);

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.start(now);
    osc.stop(now + 1.2);

  } catch (e) {
    console.error("Audio context not supported or blocked", e);
  }
};

const SortableTabButton = ({ id, label, icon: Icon, active, onClick }: { id: string, label: string, icon: React.ElementType, active: boolean, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1, touchAction: 'manipulation' };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-grab active:cursor-grabbing select-none rounded-t-lg ${active ? 'text-cyan-300 border-b-2 border-cyan-400 bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-700 border-b-2 border-transparent'}`}>
      <Icon className="w-5 h-5" /><span>{label}</span>
    </div>
  );
};

// Modern Checkbox Component (Shared)
const ModernCheckbox = ({ checked, onChange, id }: { checked: boolean, onChange: () => void, id?: string }) => (
  <label htmlFor={id} className="relative flex items-center justify-center w-6 h-6 cursor-pointer group">
    <input 
      id={id}
      type="checkbox" 
      className="peer sr-only" 
      checked={checked} 
      onChange={onChange}
    />
    <div className={`
      absolute inset-0 rounded-lg border-2 transition-all duration-300 ease-out
      ${checked 
        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-100' 
        : 'bg-slate-800/50 border-slate-600 group-hover:border-slate-500'
      }
    `}></div>
    <Check 
      className={`
        w-3.5 h-3.5 text-white z-10 transition-all duration-300 
        ${checked ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}
      `} 
      strokeWidth={3}
    />
  </label>
);

// Modern Countdown Timer with Progress Bar and Seconds
const CountdownTimer = ({ expiryDate, totalDurationDays = 30 }: { expiryDate: Date, totalDurationDays?: number }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number, isExpired: boolean} | null>(null);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();
            
            // Calculate progress percentage
            const totalDurationMs = totalDurationDays * 24 * 60 * 60 * 1000;
            const elapsed = totalDurationMs - diff;
            const rawProgress = (elapsed / totalDurationMs) * 100;
            setProgress(Math.min(Math.max(rawProgress, 0), 100));

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        };
        calculate();
        const timer = setInterval(calculate, 1000); // Update every second
        return () => clearInterval(timer);
    }, [expiryDate, totalDurationDays]);

    if (!timeLeft) return <span className="text-gray-500 text-xs">Loading...</span>;

    if (timeLeft.isExpired) {
        return (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-500/30 w-fit">
                <AlertCircle className="w-4 h-4" />
                <span className="font-bold font-mono">EXPIRED</span>
            </div>
        );
    }

    // Determine color based on remaining days
    let colorClass = 'bg-cyan-500';
    let textClass = 'text-cyan-400';
    if (timeLeft.days <= 3) {
        colorClass = 'bg-red-500';
        textClass = 'text-red-400';
    } else if (timeLeft.days <= 7) {
        colorClass = 'bg-yellow-500';
        textClass = 'text-yellow-400';
    }

    return (
        <div className="w-full min-w-[200px]">
            <div className={`flex justify-between items-end mb-1 font-mono text-sm font-bold ${textClass}`}>
                <div className="flex gap-2">
                    <span>{timeLeft.days}d</span>
                    <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
                    <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                    <span className="text-white opacity-80">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
                </div>
            </div>
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-linear relative`} 
                    style={{ width: `${100 - progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

const PhotoItem: React.FC<any> = ({ photo, isSelected, onSelectToggle, onDelete, saving }) => (
    <div className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-transparent'}`}>
        <img src={photo.image_url} alt={photo.description} className="w-full h-40 object-cover bg-slate-700" onClick={() => onSelectToggle(photo.id)} />
        <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={() => onSelectToggle(photo.id)}>
            {isSelected && <CheckCircle className="w-8 h-8 text-cyan-400" />}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(photo); }} disabled={saving} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 z-10">
            <Trash2 className="w-4 h-4" />
        </button>
        {photo.description && <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-white truncate">{photo.description}</div>}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700">
        <span className="text-gray-300 font-medium">{label}</span>
        <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${enabled ? 'bg-cyan-600' : 'bg-slate-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [winningPhotos, setWinningPhotos] = useState<WinningPhoto[]>([]);
  const [purchaseImages, setPurchaseImages] = useState<PurchaseImage[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplateData[]>([]);
  const [productKeys, setProductKeys] = useState<ProductKey[]>([]);
  const { settings: siteSettings, loading: settingsLoading, refreshSettings } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetProduct, setMoveTargetProduct] = useState('');
  const [photoProductFilter, setPhotoProductFilter] = useState<string>('all');
  const [newPurchaseImage, setNewPurchaseImage] = useState<{ file: File | null; name: string }>({ file: null, name: '' });
  const [invoiceModalIntent, setInvoiceModalIntent] = useState<PurchaseIntent | null>(null);
  const [productKeyForInvoice, setProductKeyForInvoice] = useState<string | null>(null);
  const [isUsingManualKey, setIsUsingManualKey] = useState(false);
  const [manualKeyError, setManualKeyError] = useState<string | null>(null);
  const [selectedPurchaseIntents, setSelectedPurchaseIntents] = useState<string[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [purchaseIntentFilter, setPurchaseIntentFilter] = useState<'pending' | 'completed'>('pending');
  const [purchaseIntentSearchTerm, setPurchaseIntentSearchTerm] = useState('');
  const [selectedInvoiceTheme, setSelectedInvoiceTheme] = useState<string>('navy');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [tabsOrder, setTabsOrder] = useState<string[]>(ADMIN_TABS_CONFIG.map(t => t.id));
  const [subscriptionFilter, setSubscriptionFilter] = useState<{ productId: string; targetDate: string; searchTerm: string; viewMode: 'list' | 'grouped' }>({ productId: 'all', targetDate: '', searchTerm: '', viewMode: 'list' });
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [newIntentData, setNewIntentData] = useState({ productId: '', email: '', phone: '' });
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({ title: '', price: 0, features: [''], description: '', buy_link: '', image: '', video_link: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null });
  const [newWinningPhotos, setNewWinningPhotos] = useState<{ files: File[]; productName: string; description: string }>({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // Privacy states for Invoice Modal
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [showInvoiceKeyInput, setShowInvoiceKeyInput] = useState(false);

  const winningPhotoFileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const purchaseImageFileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ... (Effects and other hooks remain the same)
  const availableKeysCount = useMemo(() => { return products.reduce((acc, product) => { const count = productKeys.filter(key => key.product_id === product.id && !key.is_used).length; acc[product.id] = count; return acc; }, {} as Record<string, number>); }, [products, productKeys]);
  const { pendingIntents, completedIntents } = useMemo(() => { const keyMap = new Map<string, ProductKey>(); productKeys.forEach(key => { if (key.purchase_intent_id) { keyMap.set(key.purchase_intent_id, key); } }); const pending: PurchaseIntent[] = []; const completed: (PurchaseIntent & { productKey: ProductKey })[] = []; purchaseIntents.forEach(intent => { const associatedKey = keyMap.get(intent.id); if (associatedKey) { completed.push({ ...intent, productKey: associatedKey }); } else { pending.push(intent); } }); return { pendingIntents: pending, completedIntents: completed }; }, [purchaseIntents, productKeys]);
  const filteredIntents = useMemo(() => { const searchTerm = purchaseIntentSearchTerm.toLowerCase(); if (!searchTerm) { return { pending: pendingIntents, completed: completedIntents }; } const filterPending = (intent: PurchaseIntent) => intent.email.toLowerCase().includes(searchTerm); const filterCompleted = (intent: PurchaseIntent & { productKey?: ProductKey }) => intent.email.toLowerCase().includes(searchTerm) || (intent.productKey?.key_value || '').toLowerCase().includes(searchTerm); return { pending: pendingIntents.filter(filterPending), completed: completedIntents.filter(filterCompleted) }; }, [pendingIntents, completedIntents, purchaseIntentSearchTerm]);
  const intentsToDisplay = purchaseIntentFilter === 'pending' ? filteredIntents.pending : filteredIntents.completed;
  
  const subscriptionTrackingList = useMemo(() => { 
      const targetDate = subscriptionFilter.targetDate ? new Date(subscriptionFilter.targetDate) : null; 
      if (targetDate) { targetDate.setHours(0, 0, 0, 0); } 
      
      return productKeys.filter(key => { 
          if (!key.is_used || !key.used_at) return false; 
          if (subscriptionFilter.productId !== 'all' && key.product_id !== subscriptionFilter.productId) { return false; } 
          if (subscriptionFilter.searchTerm) { 
              const searchLower = subscriptionFilter.searchTerm.toLowerCase(); 
              const emailMatch = key.used_by_email?.toLowerCase().includes(searchLower); 
              const keyMatch = key.key_value.toLowerCase().includes(searchLower); 
              if (!emailMatch && !keyMatch) return false; 
          } 
          const usedDate = new Date(key.used_at); 
          const expiryDate = new Date(usedDate); 
          expiryDate.setDate(expiryDate.getDate() + 30); 
          const expiryDateOnly = new Date(expiryDate); 
          expiryDateOnly.setHours(0, 0, 0, 0); 
          if (targetDate) { return expiryDateOnly.getTime() === targetDate.getTime(); } 
          return true; 
      }).sort((a, b) => { 
          const dateA = new Date(a.used_at!).getTime(); 
          const dateB = new Date(b.used_at!).getTime(); 
          return dateA - dateB; 
      }); 
  }, [productKeys, subscriptionFilter]);

  const groupedSubscriptions = useMemo(() => {
      if (subscriptionFilter.viewMode !== 'grouped') return {};
      
      const groups: Record<string, ProductKey[]> = {};
      subscriptionTrackingList.forEach(key => {
          const email = key.used_by_email || 'Unknown';
          if (!groups[email]) {
              groups[email] = [];
          }
          groups[email].push(key);
      });
      return groups;
  }, [subscriptionTrackingList, subscriptionFilter.viewMode]);

  useEffect(() => {
    checkConnection();
    if (typeof Notification !== 'undefined') {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!settingsLoading) {
      setSettings(siteSettings);
      if (siteSettings.admin_tabs_order) {
        const savedOrder = siteSettings.admin_tabs_order.split(',');
        const allTabs = ADMIN_TABS_CONFIG.map(t => t.id);
        const validSavedOrder = savedOrder.filter(id => allTabs.includes(id));
        const missingTabs = allTabs.filter(id => !validSavedOrder.includes(id));
        setTabsOrder([...validSavedOrder, ...missingTabs]);
      }
    }
  }, [siteSettings, settingsLoading]);

  // Reset privacy states when modal closes
  useEffect(() => {
      if (!invoiceModalIntent) {
          setRevealedKeys(new Set());
          setShowInvoiceKeyInput(false);
      }
  }, [invoiceModalIntent]);

  const toggleKeyReveal = (id: string) => {
      setRevealedKeys(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleIncomingIntents = useCallback((newIntents: PurchaseIntent[]) => {
    setPurchaseIntents(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const trulyNew = newIntents.filter(i => !existingIds.has(i.id));
      if (trulyNew.length === 0) return prev;
      const updatedList = [...trulyNew, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const now = Date.now();
      trulyNew.forEach(intent => {
        const created = new Date(intent.created_at).getTime();
        if (now - created < 60000) {
             const notificationTitle = `لديك طلب شراء ${intent.product_title}`;
             setSuccess(notificationTitle);
             playNotificationSound();
             if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                 if ('serviceWorker' in navigator) {
                     navigator.serviceWorker.ready.then(registration => {
                         registration.showNotification(notificationTitle, {
                             body: `${intent.email} - ${intent.country}`,
                             icon: '/cheatloop copy.png',
                             tag: `intent-${intent.id}`,
                             vibrate: [200, 100, 200],
                             renotify: true,
                             requireInteraction: true,
                             data: { url: '/admin' }
                         });
                     });
                 } else {
                     try { new Notification(notificationTitle, { body: `${intent.email} - ${intent.country}`, icon: '/cheatloop copy.png', tag: `intent-${intent.id}`, requireInteraction: true }); } catch(e) { console.error(e); }
                 }
             }
             setTimeout(() => setSuccess(null), 8000);
        }
      });
      return updatedList;
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const intentsChannel = supabase.channel('public:purchase_intents').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_intents', }, (payload) => { if (payload.eventType === 'INSERT') { handleIncomingIntents([payload.new as PurchaseIntent]); } else if (payload.eventType === 'UPDATE') { const updatedIntent = payload.new as PurchaseIntent; setPurchaseIntents((prev) => prev.map((intent) => (intent.id === updatedIntent.id ? updatedIntent : intent))); } else if (payload.eventType === 'DELETE') { const deletedId = payload.old.id; setPurchaseIntents((prev) => prev.filter((intent) => intent.id !== deletedId)); } }).subscribe();
    const keysChannel = supabase.channel('public:product_keys').on('postgres_changes', { event: '*', schema: 'public', table: 'product_keys', }, async () => { const latestKeys = await productKeysService.getKeys(); setProductKeys(latestKeys); }).subscribe();
    const poller = setInterval(async () => { if (!supabase) return; try { const { data, error } = await supabase.from('purchase_intents').select('*').order('created_at', { ascending: false }).limit(20); if (data && !error) { handleIncomingIntents(data); } } catch (e) { console.error("Polling error", e); } }, 1000);
    return () => { supabase.removeChannel(intentsChannel); supabase.removeChannel(keysChannel); clearInterval(poller); };
  }, [handleIncomingIntents]);

  // ... (Push notification logic and data loading logic remain the same)
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    if (!supabase) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey || vapidPublicKey.includes('YOUR_VAPID') || vapidPublicKey.includes('Y****************')) {
            setError("لم يتم إعداد مفاتيح VAPID في ملف .env. يرجى تشغيل سكربت التوليد أولاً.");
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        
        if (!p256dh || !auth) return;

        const p256dhStr = btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh) as any));
        const authStr = btoa(String.fromCharCode.apply(null, new Uint8Array(auth) as any));

        const { error } = await supabase.from('admin_push_subscriptions').upsert({
            endpoint: subscription.endpoint,
            p256dh: p256dhStr,
            auth: authStr
        }, { onConflict: 'endpoint' });

        if (error) {
            console.error("Failed to save push subscription:", error);
        } else {
            console.log("Push subscription saved successfully");
        }

    } catch (err) {
        console.error("Failed to subscribe to push notifications:", err);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
        alert('This browser does not support desktop notifications');
        return;
    }
    
    try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            setSuccess('تم تفعيل الإشعارات بنجاح!');
            playNotificationSound();
            await subscribeToPush();
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('تم تفعيل الإشعارات', { 
                        body: 'ستصلك تنبيهات عند وجود طلبات شراء جديدة حتى إذا كان المتصفح في الخلفية.',
                        icon: '/cheatloop copy.png',
                        vibrate: [200, 100, 200]
                    });
                });
            } else {
                new Notification('تم تفعيل الإشعارات', { body: 'ستصلك تنبيهات عند وجود طلبات شراء جديدة.' });
            }
            setTimeout(() => setSuccess(null), 3000);
        }
    } catch (e) {
        console.error("Permission request failed", e);
    }
  };

  const sendTestNotification = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('تجربة الإشعارات (محلي)', {
          body: 'هذا إشعار تجريبي محلي للتأكد من أن المتصفح يدعم الإشعارات.',
          icon: '/cheatloop copy.png',
          vibrate: [200, 100, 200]
        });
        setSuccess('تم إرسال إشعار تجريبي محلي.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError('فشل إرسال الإشعار التجريبي');
    }
  };

  const handleSimulateServerPush = async () => {
    try {
      setSaving(true);
      // Insert a fake purchase intent to trigger the webhook
      const fakeProduct = products[0];
      if (!fakeProduct) {
          setError("لا يوجد منتجات لإنشاء طلب تجريبي.");
          return;
      }

      await purchaseIntentsService.addIntent({
        product_id: fakeProduct.id,
        product_title: `[TEST] ${fakeProduct.title}`,
        country: 'Test Land',
        email: 'test-notification@admin.local',
        phone_number: '0000000000'
      });
      
      setSuccess('تم إرسال طلب تجريبي للقاعدة. إذا كان الويب هوك (Webhook) والوظيفة السحابية (Edge Function) يعملان، ستصلك إشعار الآن.');
      setTimeout(() => setSuccess(null), 8000);
    } catch (e: any) {
      setError(`فشل في إرسال الطلب التجريبي: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (isConnected) {
        await loadData();
      } else {
        setError('Failed to connect to the database. Please check your Supabase settings.');
      }
    } catch (err) {
      console.error('Connection check failed:', err);
      setConnectionStatus('disconnected');
      setError('Failed to connect to the database.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await refreshSettings();
      const [productsData, categoriesData, winningPhotosData, purchaseImagesData, purchaseIntentsData, invoiceTemplatesData, productKeysData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        winningPhotosService.getPhotos(),
        purchaseImagesService.getAll(),
        purchaseIntentsService.getAll(),
        invoiceTemplateService.getAll(),
        productKeysService.getKeys(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setWinningPhotos(winningPhotosData);
      setPurchaseImages(purchaseImagesData);
      setPurchaseIntents(purchaseIntentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setInvoiceTemplates(invoiceTemplatesData);
      setProductKeys(productKeysData);
      setSuccess('Data loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data from the database.');
    } finally {
      setLoading(false);
    }
  };

  // ... (Handlers remain the same)
  const handleTabDragEnd = async (event: DragEndEvent) => { const { active, over } = event; if (over && active.id !== over.id) { const oldIndex = tabsOrder.indexOf(active.id as string); const newIndex = tabsOrder.indexOf(over.id as string); const newOrder = arrayMove(tabsOrder, oldIndex, newIndex); setTabsOrder(newOrder); try { await settingsService.updateSettings([{ key: 'admin_tabs_order', value: newOrder.join(',') }]); } catch (err) { console.error("Failed to save tab order:", err); } } };
  const handleWinningPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { const selectedFiles = Array.from(e.target.files); if (selectedFiles.length > 10) { setError('You can upload a maximum of 10 photos at a time.'); setNewWinningPhotos({ ...newWinningPhotos, files: selectedFiles.slice(0, 10) }); } else { setError(null); setNewWinningPhotos({ ...newWinningPhotos, files: selectedFiles }); } } };
  const handleAddWinningPhotos = async () => { if (newWinningPhotos.files.length === 0) { setError('Please select at least one image file.'); return; } if (!supabase) { setError('Supabase client is not available.'); return; } setSaving(true); setError(null); try { const uploadPromises = newWinningPhotos.files.map(file => { const filePath = `public/${Date.now()}-${file.name.replace(/\s/g, '_')}`; return supabase.storage.from('winning-photos').upload(filePath, file); }); const uploadResults = await Promise.all(uploadPromises); const uploadErrors = uploadResults.filter(result => result.error); if (uploadErrors.length > 0) { throw new Error(`Failed to upload some photos: ${uploadErrors.map(e => e.error?.message).join(', ')}`); } const photosToInsert = uploadResults.map(result => { const { data: { publicUrl } } = supabase.storage.from('winning-photos').getPublicUrl(result.data!.path); return { image_url: publicUrl, product_name: newWinningPhotos.productName, description: newWinningPhotos.description, }; }); await winningPhotosService.addPhotos(photosToInsert); await loadData(); setNewWinningPhotos({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' }); if (winningPhotoFileInputRef.current) { winningPhotoFileInputRef.current.value = ''; } setSuccess(`Successfully added ${photosToInsert.length} photos!`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to add winning photos.'); } finally { setSaving(false); } };
  const handleDeleteWinningPhoto = async (photo: WinningPhoto) => { if (!confirm('Are you sure you want to delete this photo?')) return; setSaving(true); setError(null); try { await winningPhotosService.deletePhotos([photo]); await loadData(); setSuccess('Winning photo deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete winning photo.'); } finally { setSaving(false); } };
  const handleDeleteSelected = async () => { if (!confirm(`Are you sure you want to delete ${selectedPhotos.length} selected photos? This action cannot be undone.`)) return; setSaving(true); setError(null); try { const photosToDelete = winningPhotos.filter(p => selectedPhotos.includes(p.id)); await winningPhotosService.deletePhotos(photosToDelete); await loadData(); setSuccess(`${selectedPhotos.length} photos deleted successfully.`); setSelectedPhotos([]); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete selected photos.'); } finally { setSaving(false); } };
  const handleMoveSelected = async () => { if (!moveTargetProduct) { setError('Please select a destination product.'); return; } setSaving(true); setError(null); try { await winningPhotosService.movePhotos(selectedPhotos, moveTargetProduct); await loadData(); setSuccess(`${selectedPhotos.length} photos moved successfully.`); setSelectedPhotos([]); setShowMoveModal(false); setMoveTargetProduct(''); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to move photos.'); } finally { setSaving(false); } };
  const handleTogglePhotoSelection = (photoId: string) => { setSelectedPhotos(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]); };
  const handleSelectAllForProduct = (productName: string, shouldSelect: boolean) => { const photoIdsForProduct = winningPhotos.filter(p => p.product_name === productName).map(p => p.id); if (shouldSelect) { setSelectedPhotos(prev => [...new Set([...prev, ...photoIdsForProduct])]); } else { setSelectedPhotos(prev => prev.filter(id => !photoIdsForProduct.includes(id))); } };
  const handleSaveSettings = async () => { try { setSaving(true); setError(null); const settingsToUpdate: SiteSetting[] = Object.entries(settings).map(([key, value]) => ({ key, value })); await settingsService.updateSettings(settingsToUpdate); setSuccess('Settings saved successfully!'); refreshSettings(); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to save settings.'); } finally { setSaving(false); } };
  const handleToggleProductVisibility = async (productId: string, currentHiddenStatus: boolean) => { try { setSaving(true); setError(null); await productService.updateProduct(productId, { is_hidden: !currentHiddenStatus }); await loadData(); setSuccess(`Product successfully ${!currentHiddenStatus ? 'hidden' : 'shown'}`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error toggling product visibility:', err); setError(err.message || 'Failed to change product visibility.'); } finally { setSaving(false); } };
  const handleSelectImage = (imagePath: string) => { setNewProduct({ ...newProduct, image: imagePath }); setImageUploadFile(null); setImagePreviewUrl(null); if (productImageInputRef.current) { productImageInputRef.current.value = ''; } setShowImageSelector(false); setSuccess('Image selected successfully.'); setTimeout(() => setSuccess(null), 3000); };
  const handleRemoveImage = () => { setNewProduct({ ...newProduct, image: '' }); setImageUploadFile(null); setImagePreviewUrl(null); if (productImageInputRef.current) { productImageInputRef.current.value = ''; } };
  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setImageUploadFile(file); const reader = new FileReader(); reader.onloadend = () => { setImagePreviewUrl(reader.result as string); }; reader.readAsDataURL(file); setNewProduct({ ...newProduct, image: '' }); } };
  const handleAddCategory = async () => { if (!newCategoryName.trim()) { setError('Please enter a category name.'); return; } try { setSaving(true); setError(null); await categoryService.addCategory(newCategoryName); await loadData(); setNewCategoryName(''); setIsAddingCategory(false); setSuccess('Category added successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error adding category:', err); setError(err.message || 'Failed to add category.'); } finally { setSaving(false); } };
  const handleDeleteCategory = async (id: string) => { if (!confirm('Are you sure you want to delete this category? All associated products will also be deleted.')) return; try { setSaving(true); setError(null); await categoryService.deleteCategory(id); await loadData(); setSuccess('Category deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error deleting category:', err); setError(err.message || 'Failed to delete category.'); } finally { setSaving(false); } };
  const handleCategoryChange = (categoryId: string) => { const selectedCategory = categories.find(c => c.id === categoryId); setNewProduct({ ...newProduct, category_id: categoryId, category: selectedCategory?.slug as 'pubg' | 'codm' || 'pubg' }); };
  const handleProductSubmit = async (isUpdate: boolean) => { if (!newProduct.title || !newProduct.price || (!newProduct.buy_link && !newProduct.purchase_image_id) || !newProduct.category_id) { setError('Please fill all required fields: Name, Price, Category, and either a Buy Link or a Purchase Image.'); return; } try { setSaving(true); setError(null); let imageUrl = newProduct.image; if (imageUploadFile) { if (!supabase) throw new Error("Supabase client not available"); const filePath = `public/${Date.now()}-${imageUploadFile.name.replace(/\s/g, '_')}`; const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageUploadFile); if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`); const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath); imageUrl = publicUrl; } const productPayload: Partial<Product> = { ...newProduct, image: imageUrl, features: newProduct.features.filter(f => f.trim() !== ''), buy_link: newProduct.purchase_image_id ? '' : newProduct.buy_link, purchase_image_id: newProduct.buy_link ? null : newProduct.purchase_image_id }; if (isUpdate) { await productService.updateProduct(editingProduct!, productPayload); } else { await productService.addProduct(productPayload as any); } await loadData(); resetProductForm(); if (isUpdate) { setEditingProduct(null); } else { setIsAddingProduct(false); } setSuccess(`Product ${isUpdate ? 'updated' : 'added'} successfully.`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error(`Error ${isUpdate ? 'updating' : 'adding'} product:`, err); setError(err.message || `Failed to ${isUpdate ? 'update' : 'add'} product.`); } finally { setSaving(false); } };
  const handleAddProduct = () => handleProductSubmit(false);
  const handleUpdateProduct = () => handleProductSubmit(true);
  const handleDeleteProduct = async (id: string) => { if (!confirm('Are you sure you want to delete this product?')) return; try { setSaving(true); setError(null); await productService.deleteProduct(id); await loadData(); setSuccess('Product deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error deleting product:', err); setError(err.message || 'Failed to delete product.'); } finally { setSaving(false); } };
  const handleEditProduct = (product: Product) => { setEditingProduct(product.id); resetProductForm(); setNewProduct({ title: product.title, price: product.price, features: product.features, description: product.description, buy_link: product.buy_link, image: product.image || '', video_link: product.video_link || '', is_popular: product.is_popular || false, category: product.category, category_id: product.category_id || '', is_hidden: product.is_hidden || false, purchase_image_id: product.purchase_image_id || null }); };
  const resetProductForm = () => { setNewProduct({ title: '', price: 0, features: [''], description: '', buy_link: '', image: '', video_link: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null }); setImageUploadFile(null); setImagePreviewUrl(null); if (productImageInputRef.current) productImageInputRef.current.value = ''; };
  const addFeature = () => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] });
  const updateFeature = (index: number, value: string) => { const updatedFeatures = [...newProduct.features]; updatedFeatures[index] = value; setNewProduct({ ...newProduct, features: updatedFeatures }); };
  const removeFeature = (index: number) => { const updatedFeatures = newProduct.features.filter((_, i) => i !== index); setNewProduct({ ...newProduct, features: updatedFeatures }); };
  const handlePurchaseImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setNewPurchaseImage({ ...newPurchaseImage, file: e.target.files[0] }); } };
  const handleAddPurchaseImage = async () => { if (!newPurchaseImage.file || !newPurchaseImage.name) { setError('Please provide a name and select an image file.'); return; } if (!supabase) { setError('Supabase client is not available.'); return; } setSaving(true); setError(null); try { const filePath = `public/${Date.now()}-${newPurchaseImage.file.name.replace(/\s/g, '_')}`; const { error: uploadError } = await supabase.storage.from('purchase-images').upload(filePath, newPurchaseImage.file); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('purchase-images').getPublicUrl(filePath); await purchaseImagesService.addImage(newPurchaseImage.name, publicUrl); await loadData(); setNewPurchaseImage({ file: null, name: '' }); if (purchaseImageFileInputRef.current) { purchaseImageFileInputRef.current.value = ''; } setSuccess('Purchase image added successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to add purchase image.'); } finally { setSaving(false); } };
  const handleDeletePurchaseImage = async (image: PurchaseImage) => { if (!confirm(`Are you sure you want to delete the image "${image.name}"?`)) return; setSaving(true); setError(null); try { await purchaseImagesService.deleteImage(image); await loadData(); setSuccess('Purchase image deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete purchase image.'); } finally { setSaving(false); } };
  const handleTogglePurchaseIntentSelection = (intentId: string) => { setSelectedPurchaseIntents(prev => prev.includes(intentId) ? prev.filter(id => id !== intentId) : [...prev, intentId]); };
  const handleSelectAllPurchaseIntents = (shouldSelect: boolean) => { const intentsToSelect = (purchaseIntentFilter === 'pending' ? filteredIntents.pending : filteredIntents.completed).map(i => i.id); if (shouldSelect) { setSelectedPurchaseIntents(prev => [...new Set([...prev, ...intentsToSelect])]); } else { setSelectedPurchaseIntents(prev => prev.filter(id => !intentsToSelect.includes(id))); } };
  const handleDeleteSelectedPurchaseIntents = async () => { if (selectedPurchaseIntents.length === 0) return; if (!confirm(`هل أنت متأكد من حذف ${selectedPurchaseIntents.length} طلبات محددة؟ لا يمكن التراجع عن هذا الإجراء.`)) return; setSaving(true); setError(null); try { await purchaseIntentsService.deleteIntents(selectedPurchaseIntents); await loadData(); setSuccess(`${selectedPurchaseIntents.length} طلبات تم حذفها بنجاح.`); setSelectedPurchaseIntents([]); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'فشل حذف الطلبات المحددة.'); } finally { setSaving(false); } };
  const handleDeletePurchaseIntent = async (id: string) => { if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return; setSaving(true); setError(null); try { await purchaseIntentsService.deleteIntents([id]); await loadData(); setSuccess('تم حذف الطلب بنجاح'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete intent'); } finally { setSaving(false); } };
  const handleCreateManualIntent = async (e: React.FormEvent) => { e.preventDefault(); if (!newIntentData.productId || !newIntentData.email) { setError("الرجاء تحديد منتج وإدخال بريد إلكتروني."); return; } const selectedProduct = products.find(p => p.id === newIntentData.productId); if (!selectedProduct) { setError("المنتج المحدد غير صالح."); return; } setSaving(true); setError(null); try { await purchaseIntentsService.addIntent({ product_id: selectedProduct.id, product_title: selectedProduct.title, country: 'MANUAL_ENTRY', email: newIntentData.email, phone_number: newIntentData.phone || '', }); setSuccess('تم إنشاء طلب الشراء بنجاح!'); setIsCreatingIntent(false); setNewIntentData({ productId: '', email: '', phone: '' }); await loadData(); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'فشل إنشاء طلب الشراء.'); } finally { setSaving(false); } };
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.title || 'Unknown Product';
  const getFilteredImages = () => selectedImageCategory === 'all' ? AVAILABLE_IMAGES : AVAILABLE_IMAGES.filter(img => img.category === selectedImageCategory);
  const groupedWinningPhotos = WINNING_PHOTO_PRODUCTS.reduce((acc, productName) => { acc[productName] = winningPhotos.filter(p => p.product_name === productName); return acc; }, {} as Record<string, WinningPhoto[]>);
  const getProductForIntent = (intent: PurchaseIntent | null) => { if (!intent) return undefined; return products.find(p => p.id === intent.product_id); };
  const generateInvoiceHTML = (intent: PurchaseIntent, key: string) => { if (!intent) return ''; const productForIntent = getProductForIntent(intent); const brand = productForIntent?.title.toLowerCase().includes('sinki') ? 'sinki' : 'cheatloop'; const template = invoiceTemplates.find(t => t.brand_name === brand); const theme = INVOICE_THEMES[selectedInvoiceTheme]; const html = ReactDOMServer.renderToStaticMarkup( <InvoiceTemplate intent={intent} productKey={key} siteSettings={siteSettings} productPrice={productForIntent ? productForIntent.price : 'N/A'} templateData={template} theme={theme} /> ); return `<!DOCTYPE html>${html}`; };
  const handleInternalPrint = () => { if (iframeRef.current?.contentWindow) { iframeRef.current.contentWindow.print(); } else { setError("Could not access the invoice content for printing."); } setShowPrintOptions(false); };
  const handleExternalPrint = () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("Please enter or draw a product key first."); return; } const invoiceHTML = generateInvoiceHTML(invoiceModalIntent, productKeyForInvoice); const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.write(invoiceHTML); printWindow.document.close(); printWindow.focus(); } else { setError("Could not open new window. Please check your browser's popup blocker settings."); } setShowPrintOptions(false); };
  const handleUseManualKey = async () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("Please enter a product key first."); return; } setIsUsingManualKey(true); setError(null); setManualKeyError(null); try { await productKeysService.useManualKey( invoiceModalIntent.product_id, productKeyForInvoice, invoiceModalIntent.email, invoiceModalIntent.id ); setSuccess('Key has been successfully processed!'); await loadData(); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { if (err.message.includes('This key has already been used')) { setManualKeyError('هذا المفتاح مستخدم بالفعل.'); } else { setError(err.message); } } finally { setIsUsingManualKey(false); } };
  const handleCopyText = (text: string) => {
    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setSuccess('تم النسخ!');
                setTimeout(() => { setSuccess(null); }, 2000);
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            // Fallback for older browsers or restricted environments
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                
                // Robust fallback styling
                textArea.style.position = "fixed";
                textArea.style.left = "0";
                textArea.style.top = "0";
                textArea.style.opacity = "0";
                textArea.style.pointerEvents = "none";
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    setSuccess('تم النسخ!');
                    setTimeout(() => { setSuccess(null); }, 2000);
                } else {
                    console.error('Fallback copy failed', err);
                    setError('فشل النسخ');
                }
            } catch (fallbackErr) {
                console.error('Fallback copy failed', fallbackErr);
                setError('فشل النسخ');
            }
        }
    };
    copyToClipboard();
  };
  
  const generateInvoiceText = (intent: PurchaseIntent, key: string) => {
    const productForIntent = getProductForIntent(intent);
    const price = productForIntent ? `$${productForIntent.price}` : 'N/A';
    const date = new Date().toLocaleDateString('en-GB');
    const siteName = siteSettings.site_name || 'Cheatloop';

    // Unicode Bold Helper (Mathematical Sans-Serif Bold)
    const toBold = (text: string) => {
      const diffUpper = 0x1D5D4 - 0x41; // 𝗔
      const diffLower = 0x1D5EE - 0x61; // 𝗮
      const diffDigit = 0x1D7EC - 0x30; // 𝟬
      return text.split('').map(char => {
        const n = char.charCodeAt(0);
        if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(n + diffUpper);
        if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(n + diffLower);
        if (n >= 0x30 && n <= 0x39) return String.fromCodePoint(n + diffDigit);
        return char;
      }).join('');
    };

    // Removed center alignment helper for left alignment
    const separatorLine = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    return `
${toBold(siteName.toUpperCase())}
Gaming Tools Store
${separatorLine}

${toBold("INVOICE DETAILS")}

Product: ${intent.product_title}
Price: ${price}
Date: ${date}

${separatorLine}

${toBold("CUSTOMER")}

${intent.email}
${intent.phone_number || ""}
${intent.country}

${separatorLine}

${toBold("LICENSE KEY")}

${key}

${separatorLine}

Thank you for your purchase!
If you have any questions, contact us on Discord:
https://discord.gg/pcgamers
`;
  };

  const handleSendGmail = () => {
    if (!invoiceModalIntent || !productKeyForInvoice) {
      setError("يرجى التأكد من وجود بيانات الفاتورة ومفتاح المنتج.");
      return;
    }

    const body = generateInvoiceText(invoiceModalIntent, productKeyForInvoice);
    const subject = `Invoice for ${invoiceModalIntent.product_title} - Order #${invoiceModalIntent.id.substring(0, 8)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${invoiceModalIntent.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(gmailUrl, '_blank');
  };

  const handleCopyInvoiceText = async () => {
    if (!invoiceModalIntent || !productKeyForInvoice) return;
    const text = generateInvoiceText(invoiceModalIntent, productKeyForInvoice);
    
    try {
        await navigator.clipboard.writeText(text);
        setSuccess("تم نسخ نص الفاتورة بنجاح!");
        setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
        // Fallback for older browsers or restricted environments
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            
            // Robust fallback styling
            textArea.style.position = "fixed";
            textArea.style.left = "0";
            textArea.style.top = "0";
            textArea.style.opacity = "0";
            textArea.style.pointerEvents = "none";
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                setSuccess("تم نسخ نص الفاتورة بنجاح!");
                setTimeout(() => setSuccess(null), 3000);
            } else {
                console.error("Clipboard write failed (fallback)", err);
                setError("فشل نسخ النص.");
            }
        } catch (fallbackErr) {
            console.error("Clipboard write failed (all methods)", fallbackErr);
            setError("فشل نسخ النص.");
        }
    }
  };

  const handleDownloadInvoiceImage = async () => {
    if (!iframeRef.current?.contentDocument?.body) {
        setError("تعذر الوصول إلى محتوى الفاتورة.");
        return;
    }

    setSaving(true);
    try {
        // Clone the invoice content to a temporary container for capturing
        const element = iframeRef.current.contentDocument.body;
        
        // Use html2canvas to capture the iframe content
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: null // Keep transparency if any
        });

        // Create download link
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Invoice-${invoiceModalIntent?.id.substring(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess("تم تحميل صورة الفاتورة بنجاح!");
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        console.error("Failed to generate image:", err);
        setError("فشل إنشاء الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
        setSaving(false);
    }
  };

  if (connectionStatus === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">
            {connectionStatus === 'checking' ? 'Checking connection...' : 'Loading admin panel...'}
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
          <p className="text-gray-300 mb-6">Could not connect to the database. Please check your Supabase settings.</p>
          <button onClick={checkConnection} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 p-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Cheatloop Admin</h1>
            <div className="flex items-center space-x-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3 text-green-400" /><span className="text-green-400 text-xs font-bold">Connected</span></div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"><Home className="w-5 h-5" /></Link>
            <button onClick={loadData} disabled={loading} className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="container mx-auto pb-12">
        <div className="border-b border-slate-700/50 mb-6">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleTabDragEnd}
          >
            <SortableContext 
              items={tabsOrder} 
              strategy={horizontalListSortingStrategy}
            >
              <nav className="flex space-x-1 overflow-x-auto pb-0 pt-4 px-4 no-scrollbar" aria-label="Tabs">
                {tabsOrder.map((tabId) => {
                  const tabConfig = ADMIN_TABS_CONFIG.find(t => t.id === tabId);
                  if (!tabConfig) return null;
                  return (
                    <SortableTabButton
                      key={tabConfig.id}
                      id={tabConfig.id}
                      label={tabConfig.label}
                      icon={tabConfig.icon}
                      active={activeTab === tabConfig.id}
                      onClick={() => setActiveTab(tabConfig.id as AdminTab)}
                    />
                  );
                })}
              </nav>
            </SortableContext>
          </DndContext>
        </div>

        <div className="px-6 relative min-h-[calc(100vh-200px)]">
          {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center flex items-center justify-center space-x-2 sticky top-20 z-50 backdrop-blur-md shadow-lg animate-fade-in-up"><CheckCircle className="w-5 h-5" /><span>{success}</span></div>}
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center flex items-center justify-center space-x-2 animate-fade-in-up"><AlertCircle className="w-5 h-5" /><span>{error}</span><button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-red-200">✕</button></div>}

          {/* Dashboard Tab - Modernized */}
          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-lg group hover:border-cyan-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-500/20"></div>
                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className="text-cyan-400 font-medium text-sm mb-1 flex items-center gap-2">
                              <Package className="w-4 h-4" /> إجمالي المنتجات
                          </p>
                          <h3 className="text-4xl font-bold text-white tracking-tight">{products.length}</h3>
                      </div>
                      <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-cyan-400 shadow-inner">
                          <Package className="w-6 h-6" />
                      </div>
                  </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-lg group hover:border-purple-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>
                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className="text-purple-400 font-medium text-sm mb-1 flex items-center gap-2">
                              <Tag className="w-4 h-4" /> الأقسام
                          </p>
                          <h3 className="text-4xl font-bold text-white tracking-tight">{categories.length}</h3>
                      </div>
                      <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-purple-400 shadow-inner">
                          <Tag className="w-6 h-6" />
                      </div>
                  </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-lg group hover:border-yellow-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20"></div>
                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className="text-yellow-400 font-medium text-sm mb-1 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" /> صور الفوز
                          </p>
                          <h3 className="text-4xl font-bold text-white tracking-tight">{winningPhotos.length}</h3>
                      </div>
                      <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-yellow-400 shadow-inner">
                          <ImageIcon className="w-6 h-6" />
                      </div>
                  </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-lg group hover:border-green-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className="text-green-400 font-medium text-sm mb-1 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" /> طلبات الشراء
                          </p>
                          <h3 className="text-4xl font-bold text-white tracking-tight">{purchaseIntents.length}</h3>
                      </div>
                      <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-green-400 shadow-inner">
                          <CreditCard className="w-6 h-6" />
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* ... (Other tabs remain unchanged) */}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'keys' && <ProductKeysManager products={products} keys={productKeys} onKeysUpdate={loadData} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
          {activeTab === 'key-stats' && <ProductKeyStats products={products} keys={productKeys} />}
          {activeTab === 'expired-keys' && (
            <div className="space-y-8 animate-fade-in-up">
                {/* ... (Expired keys content remains same) */}
                {/* Modern Header & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 rounded-3xl p-6 shadow-lg group hover:border-blue-500/40 transition-all duration-300">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-blue-400 font-medium text-sm mb-1 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> إجمالي المشتركين
                                </p>
                                <h3 className="text-4xl font-bold text-white tracking-tight">{subscriptionTrackingList.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                                <Activity className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-yellow-900/20 to-slate-900 border border-yellow-500/20 rounded-3xl p-6 shadow-lg group hover:border-yellow-500/40 transition-all duration-300">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-yellow-400 font-medium text-sm mb-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> ينتهي قريباً (3 أيام)
                                </p>
                                <h3 className="text-4xl font-bold text-white tracking-tight">
                                    {subscriptionTrackingList.filter(k => {
                                        const usedDate = new Date(k.used_at!);
                                        const expiryDate = new Date(usedDate);
                                        expiryDate.setDate(expiryDate.getDate() + 30);
                                        const now = new Date();
                                        const diff = expiryDate.getTime() - now.getTime();
                                        const daysLeft = diff / (1000 * 60 * 60 * 24);
                                        return daysLeft > 0 && daysLeft <= 3;
                                    }).length}
                                </h3>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400 border border-yellow-500/20">
                                <Hourglass className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-red-900/20 to-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-lg group hover:border-red-500/40 transition-all duration-300">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-red-400 font-medium text-sm mb-1 flex items-center gap-2">
                                    <TimerOff className="w-4 h-4" /> منتهي الصلاحية
                                </p>
                                <h3 className="text-4xl font-bold text-white tracking-tight">
                                    {subscriptionTrackingList.filter(k => {
                                        const usedDate = new Date(k.used_at!);
                                        const expiryDate = new Date(usedDate);
                                        expiryDate.setDate(expiryDate.getDate() + 30);
                                        return new Date() > expiryDate;
                                    }).length}
                                </h3>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 border border-red-500/20">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Filter Bar - Sticky */}
                <div className="sticky top-4 z-30 mx-auto w-full">
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl flex flex-col xl:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg min-w-[100px]">
                            <Filter className="w-5 h-5" />
                            <span>تصفية</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end w-full xl:w-auto">
                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700">
                                <button 
                                    onClick={() => setSubscriptionFilter({...subscriptionFilter, viewMode: 'list'})} 
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subscriptionFilter.viewMode === 'list' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <List className="w-4 h-4" />
                                    <span>القائمة</span>
                                </button>
                                <button 
                                    onClick={() => setSubscriptionFilter({...subscriptionFilter, viewMode: 'grouped'})} 
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subscriptionFilter.viewMode === 'grouped' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <History className="w-4 h-4" />
                                    <span>سجل المستخدمين</span>
                                </button>
                            </div>

                            {/* Product Filter */}
                            <div className="relative group">
                                <select 
                                    value={subscriptionFilter.productId} 
                                    onChange={e => setSubscriptionFilter({...subscriptionFilter, productId: e.target.value})} 
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-slate-800 min-w-[160px]"
                                >
                                    <option value="all">كل المنتجات</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-cyan-400 transition-colors" />
                            </div>

                            {/* Date Filter */}
                            <div className="relative group flex items-center">
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={subscriptionFilter.targetDate} 
                                        onChange={e => setSubscriptionFilter({...subscriptionFilter, targetDate: e.target.value})} 
                                        className="pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-slate-800 uppercase tracking-wider"
                                        style={{ colorScheme: 'dark' }} 
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-cyan-400 transition-colors" />
                                </div>
                                {subscriptionFilter.targetDate && (
                                    <button onClick={() => setSubscriptionFilter({...subscriptionFilter, targetDate: ''})} className="ml-2 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="مسح التاريخ">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input 
                                    type="text" 
                                    placeholder="بحث بالإيميل أو المفتاح..." 
                                    value={subscriptionFilter.searchTerm} 
                                    onChange={e => setSubscriptionFilter({...subscriptionFilter, searchTerm: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder-gray-500" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {subscriptionFilter.viewMode === 'list' ? (
                    /* List View (Cards) */
                    <div className="grid grid-cols-1 gap-4">
                        {subscriptionTrackingList.map(key => {
                            const usedDate = new Date(key.used_at!);
                            const expiryDate = new Date(usedDate);
                            expiryDate.setDate(expiryDate.getDate() + 30);
                            const now = new Date();
                            const isExpired = expiryDate < now;
                            return (
                                <div 
                                    key={key.id} 
                                    className={`
                                        group relative bg-slate-900/80 backdrop-blur-sm border rounded-2xl p-0 transition-all duration-300 overflow-hidden
                                        ${isExpired ? 'border-red-500/30 hover:border-red-500/50' : 'border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'}
                                    `}
                                >
                                    <div className="flex flex-col md:flex-row items-stretch">
                                        {/* Status Strip */}
                                        <div className={`w-full md:w-2 bg-gradient-to-b ${isExpired ? 'from-red-500 to-red-700' : 'from-cyan-500 to-blue-600'}`}></div>
                                        
                                        <div className="flex-1 p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                                            {/* Product & User Info */}
                                            <div className="space-y-3 min-w-[250px]">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isExpired ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50'}`}>
                                                            {isExpired ? 'منتهي' : 'نشط'}
                                                        </span>
                                                        <h3 className="text-white font-bold text-lg truncate">{getProductName(key.product_id)}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm group-hover:text-white transition-colors">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate select-all font-mono">{key.used_by_email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Key Info */}
                                            <div className="w-full lg:w-auto bg-slate-950/50 p-3 rounded-xl border border-slate-800 group-hover:border-slate-700 transition-colors flex items-center justify-between gap-4 min-w-[280px]">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-1.5 bg-slate-800 rounded-lg">
                                                        <KeyRound className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <code className="text-cyan-100 font-mono text-sm truncate select-all tracking-wider">{key.key_value}</code>
                                                </div>
                                                <button onClick={() => handleCopyText(key.key_value)} className="text-gray-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors" title="نسخ المفتاح">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Dates & Timer */}
                                            <div className="flex flex-wrap gap-6 items-center w-full lg:w-auto justify-between lg:justify-end">
                                                <div className="flex flex-col gap-1 text-xs text-gray-500 font-mono">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-12">Start:</span>
                                                        <span className="text-gray-300">{usedDate.toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-12">End:</span>
                                                        <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-white'}`}>{expiryDate.toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="min-w-[200px]">
                                                    <CountdownTimer expiryDate={expiryDate} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Grouped View (Enhanced) */
                    <div className="space-y-6">
                        {Object.entries(groupedSubscriptions)
                            .sort(([, keysA], [, keysB]) => keysB.length - keysA.length)
                            .map(([email, keys]) => (
                            <div key={email} className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:border-slate-600 transition-all">
                                {/* Group Header */}
                                <div className="p-5 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Mail className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg select-all">{email}</h3>
                                            <p className="text-gray-400 text-xs mt-1">سجل المشتريات الكامل</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center min-w-[80px]">
                                            <span className="text-xs text-gray-500 font-bold uppercase">الطلبات</span>
                                            <span className="text-xl font-bold text-white">{keys.length}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Detailed Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-950/50 text-gray-400 border-b border-slate-800">
                                            <tr>
                                                <th className="p-4 font-medium w-1/4">المنتج</th>
                                                <th className="p-4 font-medium w-1/4">المفتاح</th>
                                                <th className="p-4 font-medium">الفترة</th>
                                                <th className="p-4 font-medium w-1/4">الوقت المتبقي</th>
                                                <th className="p-4 font-medium text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {keys.map(key => {
                                                const usedDate = new Date(key.used_at!);
                                                const expiryDate = new Date(usedDate);
                                                expiryDate.setDate(expiryDate.getDate() + 30);
                                                const now = new Date();
                                                const isExpired = expiryDate < now;
                                                return (
                                                    <tr key={key.id} className="hover:bg-slate-800/30 transition-colors group">
                                                        <td className="p-4">
                                                            <div className="font-bold text-white">{getProductName(key.product_id)}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2 bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                                                                <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                                                                <code className="text-cyan-400 font-mono text-xs tracking-wider select-all">{key.key_value}</code>
                                                                <button onClick={() => handleCopyText(key.key_value)} className="text-gray-500 hover:text-white transition-colors ml-1" title="نسخ">
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col text-xs font-mono text-gray-400">
                                                                <span>{usedDate.toLocaleDateString('en-GB')}</span>
                                                                <span className="text-gray-600">↓</span>
                                                                <span className={isExpired ? 'text-red-400' : 'text-white'}>{expiryDate.toLocaleDateString('en-GB')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <CountdownTimer expiryDate={expiryDate} />
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {isExpired ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                                                    <TimerOff className="w-3.5 h-3.5" /> منتهي
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                                    <CheckCircle className="w-3.5 h-3.5" /> نشط
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {subscriptionTrackingList.length === 0 && (
                    <div className="text-center py-24 bg-slate-800/20 rounded-3xl border border-slate-700/50 border-dashed">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <TimerOff className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">لا توجد نتائج</h3>
                        <p className="text-gray-500 max-w-md mx-auto text-lg">
                            {subscriptionFilter.targetDate 
                                ? 'لا توجد اشتراكات تنتهي في التاريخ المحدد.' 
                                : 'لا توجد اشتراكات نشطة تطابق معايير البحث الحالية.'}
                        </p>
                        <button 
                            onClick={() => setSubscriptionFilter({ productId: 'all', targetDate: '', searchTerm: '', viewMode: 'list' })}
                            className="mt-8 px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-bold shadow-lg"
                        >
                            مسح جميع الفلاتر
                        </button>
                    </div>
                )}
            </div>
          )}
          {activeTab === 'content' && <SiteContentEditor settings={settings} onSettingsChange={setSettings} onSave={handleSaveSettings} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
          {activeTab === 'invoice-templates' && <InvoiceEditor />}
          {/* Purchase Intents Tab - Modernized */}
          {activeTab === 'purchase-intents' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* ... (Top stats and filter bar remain same) ... */}
              {/* Top Stats Cards - Redesigned */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/20 rounded-3xl p-6 shadow-lg group hover:border-purple-500/40 transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <p className="text-purple-400 font-medium text-sm mb-1 flex items-center gap-2">
                                  <Clock className="w-4 h-4" /> قيد الانتظار
                              </p>
                              <h3 className="text-4xl font-bold text-white tracking-tight">{pendingIntents.length}</h3>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                              <Clock className="w-8 h-8" />
                          </div>
                      </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/20 rounded-3xl p-6 shadow-lg group hover:border-green-500/40 transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <p className="text-green-400 font-medium text-sm mb-1 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> مكتمل
                              </p>
                              <h3 className="text-4xl font-bold text-white tracking-tight">{completedIntents.length}</h3>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20">
                              <CheckCircle className="w-8 h-8" />
                          </div>
                      </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 rounded-3xl p-6 shadow-lg group hover:border-blue-500/40 transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <p className="text-blue-400 font-medium text-sm mb-1 flex items-center gap-2">
                                  <ShoppingCart className="w-4 h-4" /> إجمالي الطلبات
                              </p>
                              <h3 className="text-4xl font-bold text-white tracking-tight">{purchaseIntents.length}</h3>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                              <ShoppingCart className="w-8 h-8" />
                          </div>
                      </div>
                  </div>
              </div>

              {/* Control & Filter Bar - Sticky & Glassmorphism */}
              <div className="sticky top-4 z-30 mx-auto w-full">
                  <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl flex flex-col xl:flex-row gap-4 items-center justify-between">
                      {/* Left: Title & Status Toggles */}
                      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700">
                              <button 
                                  onClick={() => { setPurchaseIntentFilter('pending'); setPurchaseIntentSearchTerm(''); }} 
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${purchaseIntentFilter === 'pending' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                              >
                                  <Clock className="w-4 h-4" />
                                  <span>قيد الانتظار</span>
                                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${purchaseIntentFilter === 'pending' ? 'bg-slate-900/20' : 'bg-slate-800'}`}>{pendingIntents.length}</span>
                              </button>
                              <button 
                                  onClick={() => { setPurchaseIntentFilter('completed'); setPurchaseIntentSearchTerm(''); }} 
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${purchaseIntentFilter === 'completed' ? 'bg-green-500 text-slate-900 shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                              >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>مكتمل</span>
                                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${purchaseIntentFilter === 'completed' ? 'bg-slate-900/20' : 'bg-slate-800'}`}>{completedIntents.length}</span>
                              </button>
                          </div>

                          {/* Bulk Actions */}
                          {selectedPurchaseIntents.length > 0 && (
                              <div className="flex items-center gap-2 animate-fade-in-up">
                                  <div className="h-8 w-px bg-slate-700 mx-2"></div>
                                  <span className="text-sm text-gray-400 font-medium">{selectedPurchaseIntents.length} محدد</span>
                                  <button onClick={handleDeleteSelectedPurchaseIntents} disabled={saving} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg transition-colors text-sm font-bold">
                                      <Trash2 className="w-4 h-4" />
                                      <span>حذف</span>
                                  </button>
                              </div>
                          )}
                      </div>

                      {/* Right: Actions & Search */}
                      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                          {/* Notifications Toggle */}
                          {notificationPermission === 'granted' ? (
                              <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-medium">
                                  <Bell className="w-4 h-4" />
                                  <span>الإشعارات مفعلة</span>
                              </div>
                          ) : (
                              <button onClick={requestNotificationPermission} className="flex items-center space-x-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                                  <BellRing className="w-4 h-4" />
                                  <span>تفعيل الإشعارات</span>
                              </button>
                          )}

                          <button onClick={() => setIsCreatingIntent(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/20 font-bold text-sm">
                              <Plus className="w-4 h-4" />
                              <span>طلب يدوي</span>
                          </button>

                          <div className="relative group w-full md:w-64">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                              <input 
                                  type="text" 
                                  placeholder="بحث..." 
                                  value={purchaseIntentSearchTerm} 
                                  onChange={(e) => setPurchaseIntentSearchTerm(e.target.value)} 
                                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder-gray-500" 
                              />
                          </div>
                      </div>
                  </div>
                  
                  {/* Select All Bar */}
                  <div className="mt-2 px-2 flex items-center gap-2">
                      <ModernCheckbox 
                        id="selectAllIntents"
                        checked={selectedPurchaseIntents.length === intentsToDisplay.length && intentsToDisplay.length > 0} 
                        onChange={() => handleSelectAllPurchaseIntents(selectedPurchaseIntents.length !== intentsToDisplay.length)} 
                      />
                      <label htmlFor="selectAllIntents" className="text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-cyan-400 transition-colors">تحديد الكل في هذه القائمة</label>
                  </div>
              </div>

              {/* Intents List - Modern Cards */}
              <div className="grid grid-cols-1 gap-4">
                  {intentsToDisplay.map((intent) => {
                      const product = products.find(p => p.id === intent.product_id);
                      return (
                      <div 
                          key={intent.id} 
                          className={`
                            group relative bg-slate-900/80 backdrop-blur-sm border rounded-2xl p-0 transition-all duration-300 overflow-hidden
                            ${selectedPurchaseIntents.includes(intent.id) ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-700 hover:border-slate-500 hover:shadow-xl'}
                          `}
                      >
                          <div className="flex flex-col md:flex-row items-stretch">
                              {/* Status Strip & Checkbox */}
                              <div className={`w-full md:w-16 flex flex-row md:flex-col items-center justify-center gap-4 p-4 border-b md:border-b-0 md:border-r border-slate-700/50 ${purchaseIntentFilter === 'completed' ? 'bg-green-900/10' : 'bg-purple-900/10'}`}>
                                  <ModernCheckbox 
                                    checked={selectedPurchaseIntents.includes(intent.id)} 
                                    onChange={() => handleTogglePurchaseIntentSelection(intent.id)} 
                                  />
                                  <div className={`p-2 rounded-full ${purchaseIntentFilter === 'completed' ? 'text-green-400 bg-green-500/10' : 'text-purple-400 bg-purple-500/10'}`}>
                                      {purchaseIntentFilter === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                  </div>
                              </div>

                              {/* Main Content */}
                              <div className="flex-1 p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                                  {/* Product & User Info */}
                                  <div className="space-y-3 min-w-[300px]">
                                      <div>
                                          <h4 className="text-white font-bold text-lg flex items-center gap-3">
                                              {/* Product Icon */}
                                              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                  {product?.image ? (
                                                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                                  ) : (
                                                      <Package className="w-5 h-5 text-slate-500" />
                                                  )}
                                              </div>
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                      {intent.product_title}
                                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-gray-400 border border-slate-700">{intent.country}</span>
                                                  </div>
                                              </div>
                                          </h4>
                                          <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                              <Mail className="w-3.5 h-3.5" />
                                              <span className="font-mono select-all hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => handleCopyText(intent.email)} title="نسخ البريد">{intent.email}</span>
                                          </div>
                                          {intent.phone_number && (
                                              <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                                                  <Smartphone className="w-3 h-3" />
                                                  <span className="font-mono">{intent.phone_number}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  {/* Key & Date Info */}
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span className="font-mono">{new Date(intent.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Baghdad' })}</span>
                                          <span className="text-slate-600">|</span>
                                          <span className="font-mono" dir="ltr">
                                              {new Date(intent.created_at).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                                  timeZone: 'Asia/Baghdad'
                                              })}
                                          </span>
                                      </div>
                                      
                                      {purchaseIntentFilter === 'completed' && (intent as any).productKey && (
                                          <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                                              <KeyRound className="w-3.5 h-3.5 text-green-500" />
                                              <code className="text-green-400 font-mono text-sm tracking-wider select-all">{(intent as any).productKey.key_value}</code>
                                          </div>
                                      )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                                      <button 
                                          onClick={() => { setInvoiceModalIntent(intent); const key = (intent as any).productKey; setProductKeyForInvoice(key ? key.key_value : null); }} 
                                          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl transition-colors text-sm font-bold group/btn"
                                      >
                                          <Send className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform rtl:group-hover/btn:-translate-x-1" />
                                          <span>الفاتورة</span>
                                      </button>
                                      <button 
                                          onClick={() => handleDeletePurchaseIntent(intent.id)} 
                                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20" 
                                          title="حذف الطلب"
                                      >
                                          <Trash2 className="w-5 h-5" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )})}
              </div>

              {intentsToDisplay.length === 0 && (
                  <div className="text-center py-24 bg-slate-800/20 rounded-3xl border border-slate-700/50 border-dashed">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <CreditCard className="w-12 h-12 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">لا توجد طلبات</h3>
                      <p className="text-gray-500 max-w-md mx-auto text-lg">
                          {purchaseIntentSearchTerm ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد طلبات في هذه القائمة حالياً.'}
                      </p>
                      {purchaseIntentSearchTerm && (
                          <button onClick={() => setPurchaseIntentSearchTerm('')} className="mt-6 text-cyan-400 hover:text-cyan-300 font-medium">
                              مسح البحث
                          </button>
                      )}
                  </div>
              )}
            </div>
          )}
          {/* ... (Photos, Settings, Purchase Images tabs - content remains same) */}
          {activeTab === 'purchase-images' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* ... (Purchase images content) */}
              <div className="bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/20 overflow-hidden">
                <div className="bg-slate-800/80 p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-cyan-400" />
                        <span>إضافة صورة دفع جديدة</span>
                    </h3>
                </div>
                <div className="p-6 grid md:grid-cols-3 gap-6 items-end">
                  <div><label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">اسم الصورة *</label><input type="text" value={newPurchaseImage.name} onChange={(e) => setNewPurchaseImage({ ...newPurchaseImage, name: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="مثال: زين كاش QR" /></div>
                  <div><label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">ملف الصورة *</label><input type="file" ref={purchaseImageFileInputRef} onChange={handlePurchaseImageFileChange} accept="image/png, image/jpeg, image/webp, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20" /></div>
                  <div><button onClick={handleAddPurchaseImage} disabled={saving} className="w-full flex justify-center items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-bold shadow-lg shadow-green-600/20"><UploadCloud className="w-5 h-5" /><span>{saving ? 'جاري الرفع...' : 'إضافة الصورة'}</span></button></div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-purple-400"/> إدارة صور الدفع ({purchaseImages.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {purchaseImages.map(image => (
                  <div key={image.id} className="relative group bg-slate-800 rounded-xl p-3 border border-slate-700 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                    <img src={image.image_url} alt={image.name} className="w-full h-40 object-contain rounded-lg bg-slate-900/50" />
                    <p className="text-white text-sm font-medium mt-3 truncate text-center">{image.name}</p>
                    <button onClick={() => handleDeletePurchaseImage(image)} disabled={saving} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-xl text-white hover:bg-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 shadow-lg" title="حذف الصورة"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'photos' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* ... (Photos content) */}
              <div className="bg-slate-900 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 overflow-hidden">
                <div className="bg-slate-800/80 p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-yellow-400" />
                        <span>رفع صور فوز جديدة</span>
                    </h3>
                </div>
                <div className="p-6 grid md:grid-cols-3 gap-6">
                  <div><label htmlFor="winning-photo-upload" className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">ملفات الصور (حتى 10) *</label><input type="file" id="winning-photo-upload" ref={winningPhotoFileInputRef} multiple onChange={handleWinningPhotoFileChange} accept="image/png, image/jpeg, image/webp, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-300 hover:file:bg-yellow-500/20"/>{newWinningPhotos.files.length > 0 && <p className="text-xs text-gray-400 mt-2">{newWinningPhotos.files.length} صور محددة.</p>}</div>
                  <div><label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">المنتج المرتبط *</label><select value={newWinningPhotos.productName} onChange={(e) => setNewWinningPhotos({...newWinningPhotos, productName: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-yellow-500">{WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">الوصف (اختياري)</label><input type="text" value={newWinningPhotos.description} onChange={(e) => setNewWinningPhotos({...newWinningPhotos, description: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-yellow-500" placeholder="وصف قصير للصور"/></div>
                </div>
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end"><button onClick={handleAddWinningPhotos} disabled={saving} className="flex items-center space-x-2 px-8 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-bold shadow-lg shadow-yellow-600/20"><UploadCloud className="w-5 h-5"/><span>{saving ? 'جاري الرفع...' : 'رفع الصور المحددة'}</span></button></div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-cyan-400"/> إدارة الصور ({winningPhotos.length})</h3>
                  {selectedPhotos.length > 0 && (
                      <div className="flex gap-2 animate-fade-in-up">
                          <button onClick={() => setShowMoveModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">نقل ({selectedPhotos.length})</button>
                          <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors">حذف ({selectedPhotos.length})</button>
                      </div>
                  )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 bg-slate-900/50 backdrop-blur-sm p-3 rounded-xl max-w-2xl mx-auto border border-slate-700">
                <button onClick={() => setPhotoProductFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${photoProductFilter === 'all' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>الكل</button>
                {WINNING_PHOTO_PRODUCTS.map(productName => (<button key={productName} onClick={() => setPhotoProductFilter(productName)} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${photoProductFilter === productName ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>{productName}</button>))}
              </div>
              <div className="space-y-12">
                {Object.entries(groupedWinningPhotos).filter(([productName]) => photoProductFilter === 'all' || productName === photoProductFilter).map(([productName, photos]) => { const allInGroupSelected = photos.length > 0 && photos.every(p => selectedPhotos.includes(p.id)); return ( <div key={productName} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700"><div className="flex items-center justify-between mb-4"><h4 className="text-lg font-bold text-cyan-400">{productName} ({photos.length})</h4><div className="flex items-center space-x-2"><input type="checkbox" id={`select-all-${productName}`} checked={allInGroupSelected} onChange={(e) => handleSelectAllForProduct(productName, e.target.checked)} className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 cursor-pointer" /><label htmlFor={`select-all-${productName}`} className="text-sm text-gray-300 cursor-pointer select-none">تحديد الكل</label></div></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{photos.map(photo => (<PhotoItem key={photo.id} photo={photo} onDelete={handleDeleteWinningPhoto} saving={saving} isSelected={selectedPhotos.includes(photo.id)} onSelectToggle={handleTogglePhotoSelection} />))}</div>{photos.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد صور لهذا المنتج.</p>}</div> ) })}
              </div>
            </div>
          )}
          {/* ... (Settings, Products, Categories tabs remain the same) */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl mx-auto animate-fade-in-up">
              {/* ... (Settings content) */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg"><h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2"><LinkIcon className="w-5 h-5 text-cyan-400"/><span>روابط التواصل الاجتماعي</span></h2><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-2">رابط Discord</label><input type="url" value={settings.discord_url || ''} onChange={(e) => setSettings({...settings, discord_url: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="https://discord.gg/..."/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">رابط WhatsApp</label><input type="url" value={settings.whatsapp_url || ''} onChange={(e) => setSettings({...settings, whatsapp_url: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="https://api.whatsapp.com/send?phone=..."/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">رابط Telegram (للتواصل)</label><input type="url" value={settings.telegram_url || ''} onChange={(e) => setSettings({...settings, telegram_url: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="https.me/..."/></div><div><label className="block text-sm font-medium text-gray-300 mb-2">رابط Telegram (لتأكيد الشراء)</label><input type="url" value={settings.telegram_purchase_url || ''} onChange={(e) => setSettings({...settings, telegram_purchase_url: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="https.me/..."/> <p className="text-xs text-gray-400 mt-2">يستخدم لزر "لقد دفعت". إذا ترك فارغاً، سيتم استخدام رابط التواصل الرئيسي.</p></div></div></div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg"><h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2"><Package className="w-5 h-5 text-purple-400"/><span>عرض بطاقة المنتج</span></h2><div className="space-y-6"><div><label className="block text-sm font-medium text-gray-300 mb-2">حجم البطاقة</label><RadioGroup value={settings.product_card_size || 'default'} onValueChange={(value) => setSettings({ ...settings, product_card_size: value })} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="compact" id="size-compact" /><Label htmlFor="size-compact" className="text-gray-300">مدمج</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="default" id="size-default" /><Label htmlFor="size-default" className="text-gray-300">افتراضي</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="large" id="size-large" /><Label htmlFor="size-large" className="text-gray-300">كبير</Label></div></RadioGroup></div><div className="border-t border-slate-700 pt-6"><label className="block text-sm font-medium text-gray-300 mb-2">نص الملاحظة المهمة</label><textarea value={settings.product_card_note || ''} onChange={(e) => setSettings({...settings, product_card_note: e.target.value})} rows={3} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="مثال: بعد الشراء، تواصل معنا لاستلام المفتاح" /></div><ToggleSwitch label="عرض الملاحظة المهمة في البطاقة" enabled={settings.show_product_card_note !== 'false'} onChange={(enabled) => setSettings({...settings, show_product_card_note: String(enabled)})} /><ToggleSwitch label="عرض زر واتساب في البطاقة" enabled={settings.show_whatsapp_button === 'true'} onChange={(enabled) => setSettings({...settings, show_whatsapp_button: String(enabled)})} /><ToggleSwitch label="عرض زر تيليجرام في البطاقة" enabled={settings.show_telegram_button === 'true'} onChange={(enabled) => setSettings({...settings, show_telegram_button: String(enabled)})} /><ToggleSwitch label="عرض جميع أزرار واتساب في الموقع" enabled={settings.show_all_whatsapp_buttons !== 'false'} onChange={(enabled) => setSettings({...settings, show_all_whatsapp_buttons: String(enabled)})} /></div></div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg"><h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2"><CreditCard className="w-5 h-5 text-green-400"/><span>إعدادات صفحة الدفع</span></h2><div className="space-y-6"><ToggleSwitch label="عرض زر 'لقد دفعت'" enabled={settings.show_i_have_paid_button !== 'false'} onChange={(enabled) => setSettings({...settings, show_i_have_paid_button: String(enabled)})} /></div></div>
              <div className="flex justify-end sticky bottom-6 z-20"><button onClick={handleSaveSettings} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-purple-600/20 font-bold text-lg">{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button></div>
            </div>
          )}
          {activeTab === 'products' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* ... (Products content) */}
              <div className="flex justify-end">
                  {!isAddingProduct && !editingProduct && (
                      <button onClick={() => setIsAddingProduct(true)} className="group relative overflow-hidden rounded-xl bg-cyan-600 px-6 py-3 text-white shadow-lg transition-all hover:bg-cyan-500 hover:shadow-cyan-500/25 active:scale-95">
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                          <span className="flex items-center gap-2 font-bold relative z-10">
                              <Plus className="w-5 h-5" />
                              إضافة منتج جديد
                          </span>
                      </button>
                  )}
              </div>

              {(isAddingProduct || editingProduct) && ( 
                  <div className="bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/20 overflow-hidden animate-fade-in-up">
                      {/* ... (Product form content) ... */}
                      <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Terminal className="w-5 h-5 text-cyan-400" />
                              <span className="font-mono">{editingProduct ? 'System.EditProduct()' : 'System.AddProduct()'}</span>
                          </h3>
                          <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); resetProductForm(); }} className="text-gray-400 hover:text-white transition-colors bg-slate-700 hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded-lg">
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">اسم المنتج *</label>
                              <input type="text" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="أدخل اسم المنتج" required/>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">السعر ($) *</label>
                              <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="0.00" required/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">القسم *</label>
                              <select value={newProduct.category_id} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" required>
                                  <option value="">اختر القسم</option>{categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                              </select>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">طريقة الشراء *</label>
                              <div className="flex space-x-4 rtl:space-x-reverse bg-slate-800 p-2 rounded-xl border border-slate-700">
                                  <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg transition-all ${newProduct.purchase_image_id === null ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-slate-700'}`}>
                                      <input type="radio" name="purchase_method" checked={newProduct.purchase_image_id === null} onChange={() => setNewProduct({...newProduct, purchase_image_id: null})} className="hidden" /> 
                                      <LinkIcon className="w-4 h-4" />
                                      <span>رابط خارجي</span>
                                  </label>
                                  <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg transition-all ${newProduct.purchase_image_id !== null ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-slate-700'}`}>
                                      <input type="radio" name="purchase_method" checked={newProduct.purchase_image_id !== null} onChange={() => setNewProduct({...newProduct, buy_link: '', purchase_image_id: ''})} className="hidden" /> 
                                      <QrCode className="w-4 h-4" />
                                      <span>صورة QR</span>
                                  </label>
                              </div>
                          </div>
                          {newProduct.purchase_image_id === null ? ( 
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">رابط الشراء *</label>
                                  <input type="url" value={newProduct.buy_link} onChange={(e) => setNewProduct({...newProduct, buy_link: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="https://..." required/>
                              </div> 
                          ) : ( 
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">صورة الدفع *</label>
                                  <select value={newProduct.purchase_image_id || ''} onChange={(e) => setNewProduct({...newProduct, purchase_image_id: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" required>
                                      <option value="">اختر صورة الدفع</option>{purchaseImages.map((img) => (<option key={img.id} value={img.id}>{img.name}</option>))}
                                  </select>
                              </div> 
                          )}
                          <div>
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">رابط فيديو الشرح</label>
                              <input type="url" value={newProduct.video_link || ''} onChange={(e) => setNewProduct({...newProduct, video_link: e.target.value})} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="رابط يوتيوب (اختياري)"/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">صورة المنتج</label>
                              <div className="mt-2 flex items-center space-x-6 rtl:space-x-reverse bg-slate-800 p-4 rounded-xl border border-slate-700">
                                  <div className="shrink-0">
                                      <img className="h-20 w-20 object-contain rounded-lg border border-slate-600 bg-slate-900" src={imagePreviewUrl || newProduct.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100/1f2937/38bdf8?text=No+Image'} alt="Product preview"/>
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                          <button type="button" onClick={() => productImageInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm border border-slate-600">
                                              <UploadCloud className="w-4 h-4" /><span>رفع</span>
                                          </button>
                                          <input ref={productImageInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleProductImageFileChange}/>
                                          <button type="button" onClick={() => setShowImageSelector(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm border border-slate-600">
                                              <ImageIcon className="w-4 h-4" /><span>مكتبة</span>
                                          </button>
                                          {(newProduct.image || imageUploadFile) && (
                                              <button type="button" onClick={handleRemoveImage} className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl transition-colors text-sm border border-red-900/30">
                                                  <Trash2 className="w-4 h-4" /><span>حذف</span>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center space-x-6 rtl:space-x-reverse bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group">
                                  <input type="checkbox" checked={newProduct.is_popular} onChange={(e) => setNewProduct({...newProduct, is_popular: e.target.checked})} className="w-5 h-5 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500 cursor-pointer transition-all"/>
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-purple-400 transition-colors">منتج شائع (Popular)</span>
                              </label>
                              <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group">
                                  <input type="checkbox" checked={newProduct.is_hidden} onChange={(e) => setNewProduct({...newProduct, is_hidden: e.target.checked})} className="w-5 h-5 text-red-600 bg-slate-900 border-slate-600 rounded focus:ring-red-500 cursor-pointer transition-all"/>
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-red-400 transition-colors">مخفي (Hidden)</span>
                              </label>
                          </div>
                      </div>
                      <div className="p-6 border-t border-slate-800">
                          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">الوصف</label>
                          <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows={3} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="أدخل وصف المنتج"/>
                      </div>
                      <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">المميزات</label>
                          {newProduct.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                                  <input type="text" value={feature} onChange={(e) => updateFeature(index, e.target.value)} className="flex-1 p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-slate-750" placeholder="ميزة المنتج"/>
                                  {newProduct.features.length > 1 && (<button onClick={() => removeFeature(index)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><X className="w-5 h-5" /></button>)}
                              </div>
                          ))}
                          <button onClick={addFeature} className="text-cyan-400 hover:text-cyan-300 text-sm font-bold mt-2 flex items-center gap-1"><Plus className="w-4 h-4"/> إضافة ميزة أخرى</button>
                      </div>
                      <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end space-x-4 rtl:space-x-reverse">
                          <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); resetProductForm(); }} disabled={saving} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50 font-bold">إلغاء</button>
                          <button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} disabled={saving} className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-bold shadow-lg shadow-cyan-600/20">
                              {saving ? 'جاري الحفظ...' : (editingProduct ? 'تحديث المنتج' : 'إضافة المنتج')}
                          </button>
                      </div>
                  </div> 
              )}

              <div className="bg-slate-900 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-right">
                          <thead className="bg-slate-800/80 text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-slate-700">
                              <tr>
                                  <th className="p-5">المنتج</th>
                                  <th className="p-5">السعر</th>
                                  <th className="p-5">القسم</th>
                                  <th className="p-5">طريقة الشراء</th>
                                  <th className="p-5">الحالة</th>
                                  <th className="p-5 text-center">الإجراءات</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {products.map((product) => (
                                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors group">
                                      <td className="p-5">
                                          <div className="flex items-center gap-4">
                                              <div className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                                                  {product.image ? <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}/> : <Package className="w-6 h-6 text-slate-600"/>}
                                              </div>
                                              <div>
                                                  <p className="text-white font-bold text-base">{product.title}</p>
                                                  <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">{product.features.slice(0, 2).join(', ')}...</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-5">
                                          <span className="text-cyan-400 font-mono font-bold text-lg">${product.price}</span>
                                      </td>
                                      <td className="p-5">
                                          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-gray-300 text-xs font-medium">
                                              {getCategoryName(product.category_id || '')}
                                          </span>
                                      </td>
                                      <td className="p-5">
                                          {product.purchase_image_id ? 
                                              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium"><QrCode className="w-4 h-4"/><span>QR Code</span></div> : 
                                              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium"><LinkIcon className="w-4 h-4"/><span>رابط</span></div>
                                          }
                                      </td>
                                      <td className="p-5">
                                          <div className="flex gap-2">
                                              {product.is_popular && (<span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded text-xs font-bold">شائع</span>)}
                                              {product.is_hidden && (<span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-bold">مخفي</span>)}
                                              {!product.is_popular && !product.is_hidden && (<span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-bold">نشط</span>)}
                                          </div>
                                      </td>
                                      <td className="p-5">
                                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleToggleProductVisibility(product.id, product.is_hidden || false)} disabled={saving} className="p-2 bg-slate-800 hover:bg-yellow-500/10 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors border border-slate-700 hover:border-yellow-500/30" title={product.is_hidden ? 'إظهار' : 'إخفاء'}>
                                                  {product.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                              </button>
                                              <button onClick={() => handleEditProduct(product)} disabled={saving} className="p-2 bg-slate-800 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/30" title="تعديل">
                                                  <Edit className="w-4 h-4" />
                                              </button>
                                              <button onClick={() => handleDeleteProduct(product.id)} disabled={saving} className="p-2 bg-slate-800 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-500/30" title="حذف">
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* ... (Categories content) */}
              <div className="bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/20 overflow-hidden">
                  <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Tag className="w-5 h-5 text-purple-400" />
                          <span>إدارة الأقسام</span>
                      </h3>
                      {!isAddingCategory && (
                          <button onClick={() => setIsAddingCategory(true)} className="text-purple-400 hover:text-purple-300 text-sm font-bold flex items-center gap-1">
                              <Plus className="w-4 h-4" /> إضافة قسم
                          </button>
                      )}
                  </div>
                  
                  {isAddingCategory && ( 
                      <div className="p-6 bg-slate-800/30 border-b border-slate-700 animate-fade-in-up">
                          <div className="flex items-center gap-4 max-w-2xl">
                              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500" placeholder="أدخل اسم القسم الجديد"/>
                              <button onClick={handleAddCategory} disabled={saving} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-bold shadow-lg shadow-purple-600/20">{saving ? 'جاري الإضافة...' : 'إضافة'}</button>
                              <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} disabled={saving} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50 font-bold">إلغاء</button>
                          </div>
                      </div> 
                  )}

                  <div className="p-6">
                      <div className="flex flex-wrap gap-4">
                          {categories.map((category) => (
                              <div key={category.id} className="group flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-2 py-2 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                                  <div>
                                      <h3 className="text-white font-bold text-sm">{category.name}</h3>
                                      <p className="text-gray-500 text-xs font-mono">{category.slug}</p>
                                  </div>
                                  <div className="h-8 w-px bg-slate-700 mx-1"></div>
                                  <button onClick={() => handleDeleteCategory(category.id)} disabled={saving} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" title="حذف القسم">
                                      <X className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          {categories.length === 0 && <p className="text-gray-500">لا توجد أقسام مضافة.</p>}
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showImageSelector && ( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white">Select an Image</h3><button onClick={() => setShowImageSelector(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div><div className="mb-6"><div className="flex items-center space-x-4"><span className="text-gray-300 text-sm">Filter:</span><select value={selectedImageCategory} onChange={(e) => setSelectedImageCategory(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"><option value="all">All Images</option><option value="logos">Logos</option></select></div></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{getFilteredImages().map((image) => (<div key={image.id} className="bg-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-600 transition-colors border-2 border-transparent hover:border-cyan-500" onClick={() => handleSelectImage(image.path)}><img src={image.path} alt={image.name} className="w-full h-24 object-contain rounded-lg mb-3"/><p className="text-white text-sm font-medium text-center">{image.name}</p><p className="text-gray-400 text-xs text-center mt-1 capitalize">{image.category}</p></div>))}{getFilteredImages().length === 0 && (<div className="text-center py-8"><ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-400">No images in this category.</p></div>)}</div></div></div> )}
      {showMoveModal && ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up"><h3 className="text-xl font-bold text-white mb-4">نقل الصور المحددة</h3><p className="text-gray-400 mb-6">نقل {selectedPhotos.length} صور إلى منتج آخر.</p><select value={moveTargetProduct} onChange={(e) => setMoveTargetProduct(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 mb-6"><option value="">اختر المنتج الوجهة</option>{WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}</select><div className="flex justify-end gap-4"><button onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">إلغاء</button><button onClick={handleMoveSelected} disabled={!moveTargetProduct || saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">{saving ? 'جاري النقل...' : 'نقل الصور'}</button></div></div></div> )}
      
      {/* Modern Manual Intent Modal */}
      {isCreatingIntent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/20 max-w-md w-full animate-fade-in-up overflow-hidden">
                {/* Modal Header */}
                <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-purple-400" />
                        <span>إنشاء طلب شراء يدوي</span>
                    </h3>
                    <button onClick={() => setIsCreatingIntent(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Modal Body */}
                <form onSubmit={handleCreateManualIntent} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">المنتج *</label>
                        <div className="relative">
                            <select 
                                value={newIntentData.productId} 
                                onChange={(e) => setNewIntentData({ ...newIntentData, productId: e.target.value })} 
                                className="w-full p-3 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none" 
                                required
                            >
                                <option value="">اختر منتجًا</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">البريد الإلكتروني *</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={newIntentData.email} 
                                onChange={(e) => setNewIntentData({ ...newIntentData, email: e.target.value })} 
                                className="w-full p-3 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500" 
                                required 
                                placeholder="user@example.com" 
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">رقم الهاتف (اختياري)</label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                value={newIntentData.phone} 
                                onChange={(e) => setNewIntentData({ ...newIntentData, phone: e.target.value })} 
                                className="w-full p-3 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500" 
                                placeholder="+1234567890" 
                            />
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsCreatingIntent(false)} 
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors font-medium text-sm"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-purple-600/20 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            <span>{saving ? 'جاري الإنشاء...' : 'إنشاء الطلب'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {invoiceModalIntent && (() => { const productForIntent = getProductForIntent(invoiceModalIntent); const unusedKeys = productKeys.filter(k => k.product_id === invoiceModalIntent.product_id && !k.is_used); const whatsappPhoneNumber = invoiceModalIntent.phone_number?.replace(/\D/g, '') || ''; const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(`Hello, here is your invoice and product key for ${invoiceModalIntent.product_title}`)}`; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 w-full max-w-[1600px] animate-fade-in-up max-h-[98vh] overflow-y-auto"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white">إرسال الفاتورة</h3><button onClick={() => { setInvoiceModalIntent(null); setManualKeyError(null); }} className="p-2 text-gray-400 hover:text-white rounded-full"><X className="w-6 h-6" /></button></div><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4"><h4 className="text-lg font-semibold text-cyan-400 border-b border-slate-700 pb-2">تفاصيل الشراء</h4><p><strong className="text-gray-400">المنتج:</strong> {invoiceModalIntent.product_title}</p><p><strong className="text-gray-400">السعر:</strong> ${productForIntent?.price || 'N/A'}</p><p><strong className="text-gray-400">الدولة:</strong> {invoiceModalIntent.country}</p><div className="flex items-center gap-2"><strong className="text-gray-400">البريد الإلكتروني:</strong><span className="select-all">{invoiceModalIntent.email}</span><button onClick={() => handleCopyText(invoiceModalIntent.email)} className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-700" title="نسخ البريد"><Copy className="w-4 h-4" /></button></div><p><strong className="text-gray-400">الهاتف:</strong> {invoiceModalIntent.phone_number}</p><div className="pt-4"><label className="block text-sm font-medium text-gray-300 mb-2">مفتاح المنتج</label><div className="flex items-center space-x-2 rtl:space-x-reverse"><div className="relative flex-1"><input type={showInvoiceKeyInput ? "text" : "password"} value={productKeyForInvoice || ''} onChange={(e) => { setProductKeyForInvoice(e.target.value); setManualKeyError(null); }} className="w-full p-3 bg-slate-900 border-2 border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 rounded-xl text-white font-mono text-center tracking-widest h-[46px] pl-10" placeholder="أدخل المفتاح يدويًا أو اختر من القائمة" /><button type="button" onClick={() => setShowInvoiceKeyInput(!showInvoiceKeyInput)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1">{showInvoiceKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><button onClick={handleUseManualKey} disabled={isUsingManualKey || !productKeyForInvoice} className="px-4 h-[46px] bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" title="تأكيد استخدام المفتاح (سيتم إضافته إذا لم يكن موجوداً)">{isUsingManualKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}<span>تأكيد / إضافة</span></button></div>{manualKeyError && (<p className="text-sm text-red-400 mt-2 text-center">{manualKeyError}</p>)}<p className="text-xs text-gray-500 mt-1 text-center">ملاحظة: إذا كان المفتاح غير موجود في النظام، سيتم إضافته تلقائياً لهذا المنتج وتعيينه كمستخدم.</p><div className="mt-4"><label className="block text-sm font-medium text-gray-400 mb-2">المفاتيح المتاحة ({unusedKeys.length})</label><div className="bg-slate-900 border border-slate-700 rounded-xl p-2 max-h-60 overflow-y-auto grid grid-cols-1 gap-2">{unusedKeys.length > 0 ? ( unusedKeys.map(key => { const isRevealed = revealedKeys.has(key.id); return ( <div key={key.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${productKeyForInvoice === key.key_value ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-800/50 border-transparent hover:border-cyan-500/30'}`}><div className="flex items-center gap-3 overflow-hidden"><button onClick={() => toggleKeyReveal(key.id)} className="text-gray-500 hover:text-cyan-400 transition-colors p-1 rounded-md hover:bg-slate-700" title={isRevealed ? "إخفاء" : "إظهار"}>{isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button><span className="font-mono text-sm text-gray-300 truncate" dir="ltr">{isRevealed ? key.key_value : '••••••••••••••••••••••••'}</span></div><button onClick={() => { setProductKeyForInvoice(key.key_value); setManualKeyError(null); }} className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg transition-colors border border-cyan-500/20 flex-shrink-0">استخدام</button></div> ); }) ) : ( <p className="text-center text-gray-500 text-sm py-4">لا توجد مفاتيح متاحة لهذا المنتج</p> )}</div></div></div></div><div><div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4"><h4 className="text-lg font-semibold text-cyan-400">معاينة الفاتورة</h4><div className="flex items-center gap-2"><span className="text-xs text-gray-400">لون الفاتورة:</span><div className="flex gap-1">{Object.entries(INVOICE_THEMES).map(([key, theme]) => ( <button key={key} onClick={() => setSelectedInvoiceTheme(key)} className={`w-5 h-5 rounded-full border transition-all ${selectedInvoiceTheme === key ? 'border-cyan-400 scale-110 ring-1 ring-cyan-400/50' : 'border-slate-600 hover:scale-105'}`} style={{ backgroundColor: theme.backgroundColor }} title={theme.name} /> ))}</div></div></div><iframe ref={iframeRef} srcDoc={generateInvoiceHTML(invoiceModalIntent, productKeyForInvoice || '')} className="w-full h-[750px] bg-slate-900 rounded-lg border border-slate-700" title="Invoice Preview" /></div></div><div className="mt-8 pt-6 border-t border-slate-700"><div className="flex justify-end gap-4 flex-wrap"><button onClick={() => { setInvoiceModalIntent(null); setManualKeyError(null); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">إلغاء</button><button onClick={() => { if (!productKeyForInvoice) { setError("يرجى إدخال أو سحب مفتاح المنتج أولاً."); return; } setShowPrintOptions(true); }} disabled={!productKeyForInvoice} className={`px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${!productKeyForInvoice ? 'opacity-50 cursor-not-allowed' : ''}`}><Printer className="w-4 h-4" /><span>طباعة / PDF</span></button><button onClick={handleDownloadInvoiceImage} disabled={!productKeyForInvoice || saving} className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${!productKeyForInvoice || saving ? 'opacity-50 cursor-not-allowed' : ''}`}><Download className="w-4 h-4" /><span>تحميل صورة الفاتورة</span></button><a href={!productKeyForInvoice ? undefined : whatsappUrl} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${!productKeyForInvoice ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={(e) => { if (!productKeyForInvoice) e.preventDefault(); }}><MessageSquare className="w-4 h-4" /><span>إرسال عبر WhatsApp</span></a><button onClick={handleCopyInvoiceText} disabled={!productKeyForInvoice} className={`px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors flex items-center space-x-2 ${!productKeyForInvoice ? 'opacity-50 cursor-not-allowed' : ''}`}><Copy className="w-4 h-4" /><span>نسخ النص</span></button><button onClick={handleSendGmail} disabled={!productKeyForInvoice || saving} className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${!productKeyForInvoice || saving ? 'opacity-50 cursor-not-allowed' : ''}`}>{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}<span>إرسال عبر Gmail</span></button></div></div></div>{showPrintOptions && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-white">خيارات الطباعة</h3><button onClick={() => setShowPrintOptions(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button></div><p className="text-gray-400 mb-6">اختر طريقة الطباعة المفضلة. يمكنك أيضًا استخدام خيار الطباعة لحفظ الفاتورة كملف PDF.</p><div className="space-y-4"><button onClick={handleInternalPrint} className="w-full flex items-center justify-center space-x-3 rtl:space-x-reverse bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-4 rounded-xl transition-colors"><Printer className="w-5 h-5"/><span>طباعة داخلية (سريع)</span></button><button onClick={handleExternalPrint} className="w-full flex items-center justify-center space-x-3 rtl:space-x-reverse bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-4 rounded-xl transition-colors"><ExternalLink className="w-5 h-5"/><span>طباعة خارجية (فتح في نافذة جديدة)</span></button></div></div></div> )}</div> ); })()}
    </div>
  );
};

export default AdminDashboard;
