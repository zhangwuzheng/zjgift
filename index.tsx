
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Package, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  AlertTriangle, 
  FileUp,
  AlertCircle,
  Layers,
  Database,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCcw,
  Calculator,
  Settings,
  Truck,
  Box,
  Users,
  Percent,
  Download,
  Lock,
  User,
  LogIn,
  FileSpreadsheet
} from 'lucide-react';

// --- 数据接口定义 ---
interface Product {
  id: string;
  sku: string;         
  name: string;        
  spec: string;        
  unit: string;        
  platformPrice: number; 
  channelPrice: number;  
  retailPrice: number;   
  image: string;         
  manufacturer: string;  
  category: string;      
}

interface Tier {
  id: string;
  label: string;
  targetTierPrice: number;   // 客户预算档位 (含税单价目标)
  discountRate: number;      // 产品折扣 (如 80 代表 8折)
  quantity: number;          // 礼包数量
  boxCost: number;           // 礼盒成本
  laborCost: number;         // 打包人工
  logisticsCost: number;     // 物流费用
  taxRate: number;           // 税率 (如 6 代表 6%)
  selectedProductIds: string[];
}

interface GiftSet {
  id: string;
  name: string;
  createdAt: number;
  tiers: Tier[];
}

const STORAGE_KEY_PRODUCTS = 'SHANSHUI_DB_PRODUCTS_V10';
const STORAGE_KEY_GIFTSETS = 'SHANSHUI_DB_GIFTSETS_V10';
const STORAGE_KEY_AUTH = 'SHANSHUI_AUTH_V1';

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', sku: 'ZS-CJ-001', name: '青山远黛-禅意茶具', spec: '一壶四杯', unit: '套', platformPrice: 200, channelPrice: 299, retailPrice: 599, image: 'https://images.unsplash.com/photo-1576020488411-26298acb51bd?auto=format&fit=crop&q=80&w=400', manufacturer: '景德镇文创', category: '茶具' },
];

const HEADER_MAP: Record<string, string[]> = {
  sku: ['sku', '编号', '编码', '货号', '代号', 'id'],
  name: ['名称', '品名', '产品名称', '标题', '商品', 'name'],
  spec: ['规格', '参数', '尺寸', '描述', 'spec'],
  unit: ['单位', '计量', 'unit'],
  platformPrice: ['平台价', '控价', '平台', '指导价'],
  channelPrice: ['渠道价', '成本', '进价', '采购价', '结算价', 'channel'],
  retailPrice: ['零售', '零售价', '原价', '市场价', '标价', 'retail'],
  image: ['图片', '图', '链接', 'url', 'image'],
  manufacturer: ['厂家', '品牌', '供货商', '来源'],
  category: ['分类', '类目', '类型', '分组']
};

function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode, maxWidth?: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-[32px] w-full ${maxWidth} shadow-2xl overflow-hidden border border-[#E5E1D1] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
        <div className="px-8 py-6 border-b border-[#F5F2E8] flex justify-between items-center bg-[#FDFCF8] shrink-0">
          <h3 className="text-xl font-bold text-[#1B4332] font-serif">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#1B4332] transition-colors bg-[#F5F2E8] rounded-full active:scale-90">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  // --- 登录状态 ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(STORAGE_KEY_AUTH) === 'true');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [giftSets, setGiftSets] = useState<GiftSet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GIFTSETS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GIFTSETS, JSON.stringify(giftSets)); }, [giftSets]);

  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [activeTierId, setActiveTierId] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  
  const [inputValue, setInputValue] = useState('');
  
  const [tierForm, setTierForm] = useState({
    targetPrice: '500',
    discount: '80',
    quantity: '100',
    box: '25',
    labor: '5',
    logistics: '15',
    tax: '6'
  });

  const categories = useMemo(() => ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const currentSet = useMemo(() => giftSets.find(s => s.id === currentSetId) || null, [giftSets, currentSetId]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const match = (p.name || '').includes(searchTerm) || (p.sku || '').includes(searchTerm);
      const catMatch = activeCategory === '全部' || p.category === activeCategory;
      return match && catMatch;
    });
    if (sortBy === 'price-asc') result.sort((a, b) => a.channelPrice - b.channelPrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.channelPrice - a.channelPrice);
    return result;
  }, [searchTerm, activeCategory, sortBy, products]);

  // --- 登录逻辑 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'zj123456') {
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      setLoginError('');
    } else {
      setLoginError('账号或密码错误');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  // --- CSV 导入/导出 ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(arrayBuffer);
      } catch (err) {
        const gbkDecoder = new TextDecoder('gbk');
        text = gbkDecoder.decode(arrayBuffer);
      }
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error('Format error');
      const parseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
          else current += char;
        }
        result.push(current.trim());
        return result;
      };
      const headerRow = parseLine(rows[0]);
      const findIndex = (keys: string[]) => headerRow.findIndex(h => keys.some(k => h.toLowerCase().includes(k)));
      const mapping = {
        sku: findIndex(HEADER_MAP.sku),
        name: findIndex(HEADER_MAP.name),
        channelPrice: findIndex(HEADER_MAP.channelPrice),
        retailPrice: findIndex(HEADER_MAP.retailPrice),
        category: findIndex(HEADER_MAP.category),
        image: findIndex(HEADER_MAP.image)
      };
      const cleanNum = (v: string) => parseFloat(v?.replace(/[^\d.]/g, '')) || 0;
      const newProducts = rows.slice(1).map((row, i) => {
        const cols = parseLine(row);
        return {
          id: Date.now().toString() + i,
          sku: mapping.sku !== -1 ? cols[mapping.sku] : `SKU-${i}`,
          name: mapping.name !== -1 ? cols[mapping.name] : '未命名',
          spec: '', unit: '件', platformPrice: 0,
          channelPrice: mapping.channelPrice !== -1 ? cleanNum(cols[mapping.channelPrice]) : 0,
          retailPrice: mapping.retailPrice !== -1 ? cleanNum(cols[mapping.retailPrice]) : 0,
          image: mapping.image !== -1 ? cols[mapping.image] : '',
          manufacturer: '',
          category: mapping.category !== -1 ? cols[mapping.category] : '默认'
        };
      });
      setProducts(prev => [...newProducts, ...prev]);
      alert('导入完成');
    } catch (err) { alert('导入失败'); }
    e.target.value = '';
  };

  const handleExportScheme = () => {
    if (!currentSet) return;
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "方案名称,档位预算,折扣,数量,产品名称,SKU,零售指导价,渠道成本,折后单价,其他成本(盒/工/邮),单包税额,含税总结算单价,全案总金额\n";

    currentSet.tiers.forEach(tier => {
      const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
      
      const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0);
      const totalChannel = items.reduce((s, p) => s + p.channelPrice, 0);
      const productSellingPrice = totalRetail * (tier.discountRate / 100);
      const otherCosts = tier.boxCost + tier.laborCost + tier.logisticsCost;
      const unitUntaxedPrice = productSellingPrice + otherCosts;
      const unitTax = unitUntaxedPrice * (tier.taxRate / 100);
      const finalUnitSellingPrice = unitUntaxedPrice + unitTax;
      const totalAmount = finalUnitSellingPrice * tier.quantity;

      if (items.length === 0) {
        csvContent += `${currentSet.name},${tier.targetTierPrice},${tier.discountRate}%,${tier.quantity},无选品,-,0,0,0,${otherCosts},0,${finalUnitSellingPrice},${totalAmount}\n`;
      } else {
        items.forEach((it, idx) => {
          if (idx === 0) {
            csvContent += `${currentSet.name},${tier.targetTierPrice},${tier.discountRate}%,${tier.quantity},${it.name},${it.sku},${it.retailPrice},${it.channelPrice},${(it.retailPrice * (tier.discountRate/100)).toFixed(2)},${otherCosts},${unitTax.toFixed(2)},${finalUnitSellingPrice.toFixed(2)},${totalAmount.toFixed(2)}\n`;
          } else {
            csvContent += `,,, ,${it.name},${it.sku},${it.retailPrice},${it.channelPrice},${(it.retailPrice * (tier.discountRate/100)).toFixed(2)},,,, \n`;
          }
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `方案导出_${currentSet.name}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 业务操作 ---
  const handleCreateSet = () => {
    if (!inputValue.trim()) return;
    const id = Date.now().toString();
    const newSet: GiftSet = { id, name: inputValue, createdAt: Date.now(), tiers: [] };
    setGiftSets(prev => [newSet, ...prev]);
    setCurrentSetId(id);
    setIsPackageModalOpen(false);
    setInputValue('');
  };

  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除整个方案？')) {
      setGiftSets(prev => prev.filter(s => s.id !== id));
      if (currentSetId === id) setCurrentSetId(null);
    }
  };

  const handleOpenTierSettings = (tier?: Tier) => {
    if (tier) {
      setEditingTierId(tier.id);
      setTierForm({
        targetPrice: tier.targetTierPrice.toString(),
        discount: tier.discountRate.toString(),
        quantity: tier.quantity.toString(),
        box: tier.boxCost.toString(),
        labor: tier.laborCost.toString(),
        logistics: tier.logisticsCost.toString(),
        tax: tier.taxRate.toString()
      });
    } else {
      setEditingTierId(null);
      setTierForm({
        targetPrice: '500',
        discount: '80',
        quantity: '100',
        box: '25',
        labor: '5',
        logistics: '15',
        tax: '6'
      });
    }
    setIsTierModalOpen(true);
  };

  const handleSaveTier = () => {
    if (!currentSetId) return;
    if (editingTierId) {
      setGiftSets(prev => prev.map(s => s.id === currentSetId ? {
        ...s,
        tiers: s.tiers.map(t => t.id === editingTierId ? {
          ...t,
          targetTierPrice: Number(tierForm.targetPrice),
          discountRate: Number(tierForm.discount),
          quantity: Number(tierForm.quantity),
          boxCost: Number(tierForm.box),
          laborCost: Number(tierForm.labor),
          logisticsCost: Number(tierForm.logistics),
          taxRate: Number(tierForm.tax),
          label: `${tierForm.targetPrice}元档`
        } : t)
      } : s));
    } else {
      const tid = Math.random().toString(36).substr(2, 9);
      const newTier: Tier = {
        id: tid,
        label: `${tierForm.targetPrice}元档`,
        targetTierPrice: Number(tierForm.targetPrice),
        discountRate: Number(tierForm.discount),
        quantity: Number(tierForm.quantity),
        boxCost: Number(tierForm.box),
        laborCost: Number(tierForm.labor),
        logisticsCost: Number(tierForm.logistics),
        taxRate: Number(tierForm.tax),
        selectedProductIds: []
      };
      setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: [...s.tiers, newTier] } : s));
      setActiveTierId(tid);
    }
    setIsTierModalOpen(false);
    setEditingTierId(null);
  };

  const addToTier = (pid: string) => {
    if (!currentSetId || !activeTierId) return;
    setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.map(t => t.id === activeTierId ? { ...t, selectedProductIds: [...t.selectedProductIds, pid] } : t) } : s));
    setLastAddedId(pid);
    setTimeout(() => setLastAddedId(null), 800);
  };

  const removeFromTier = (tid: string, idx: number) => {
    setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.map(t => {
      if (t.id === tid) {
        const next = [...t.selectedProductIds];
        next.splice(idx, 1);
        return { ...t, selectedProductIds: next };
      }
      return t;
    }) } : s));
  };

  // --- 登录界面渲染 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?auto=format&fit=crop&q=80&w=2000')] opacity-5 grayscale pointer-events-none" />
        <div className="relative w-full max-w-md bg-white rounded-[48px] shadow-2xl border border-[#E5E1D1] p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#1B4332] p-4 rounded-3xl mb-6 shadow-xl">
              <Layers className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#1B4332] mb-2 tracking-tight">藏镜山水</h1>
            <p className="text-[11px] text-[#B08D57] font-bold tracking-[0.2em] uppercase italic">GIFT DESIGN SYSTEM</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">管理员账号</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="请输入账号" 
                  className="w-full pl-14 pr-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none focus:border-[#1B4332] font-medium transition-all"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">安全密码</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" 
                  placeholder="请输入密码" 
                  className="w-full pl-14 pr-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none focus:border-[#1B4332] font-medium transition-all"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold pl-4 animate-in slide-in-from-top-1">
                <AlertCircle size={14} /> {loginError}
              </div>
            )}

            <button type="submit" className="w-full py-5 bg-[#1B4332] text-white rounded-[24px] font-bold text-lg shadow-2xl hover:bg-[#2D5A47] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <LogIn size={20} /> 进入系统
            </button>
          </form>

          <p className="mt-10 text-center text-gray-300 text-[10px] uppercase font-bold tracking-widest">
            © 2024 CANGJING SHANSHUI ARCHITECT
          </p>
        </div>
      </div>
    );
  }

  // --- 主应用渲染 ---
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans flex flex-col h-screen overflow-hidden">
      <header className="border-b border-[#E5E1D1] bg-white px-6 py-4 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentSetId(null); setActiveTierId(null); }}>
          <div className="bg-[#1B4332] p-2 rounded-xl shadow-lg"><Layers className="text-white w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-bold text-[#1B4332] font-serif leading-none">藏镜山水</h1>
            <p className="text-[10px] text-[#B08D57] font-bold mt-1 tracking-widest uppercase italic">数字化礼赠设计平台</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentSet && (
            <button onClick={handleExportScheme} className="flex items-center gap-2 bg-[#F9F7F2] border border-[#E5E1D1] text-[#1B4332] px-5 py-2.5 rounded-full font-bold text-sm hover:border-[#1B4332] transition-all active:scale-95">
              <FileSpreadsheet size={16} /> 导出报表
            </button>
          )}
          <button onClick={() => setIsLibraryModalOpen(true)} className="flex items-center gap-2 bg-[#F9F7F2] border border-[#E5E1D1] text-[#1B4332] px-5 py-2.5 rounded-full font-bold text-sm hover:border-[#1B4332] transition-all active:scale-95">
            <Database size={16} /> 产品库
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-[#E5E1D1] text-gray-400 px-5 py-2.5 rounded-full font-bold text-sm hover:text-red-500 transition-all active:scale-95">
             退出登录
          </button>
          <button onClick={() => { setInputValue(''); setIsPackageModalOpen(true); }} className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-[#2D5A47] transition-all active:scale-95">
            <Plus size={18} /> 创建新方案
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {currentSet && (
          <aside className="w-[360px] border-r border-[#E5E1D1] bg-white flex flex-col shrink-0 z-20 shadow-xl">
            <div className="p-4 space-y-3 border-b border-[#F5F2E8] bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" placeholder="查找产品..." 
                    className="w-full pl-9 pr-4 py-2.5 bg-[#F9F7F2] border border-[#E5E1D1] rounded-2xl text-sm outline-none focus:border-[#1B4332]"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-[10px] rounded-full border whitespace-nowrap font-bold transition-all ${activeCategory === cat ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => activeTierId && addToTier(p.id)} className={`group relative bg-white border rounded-2xl p-2.5 flex gap-3 cursor-pointer transition-all ${!activeTierId ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-[#1B4332] shadow-sm'} ${lastAddedId === p.id ? 'ring-2 ring-[#1B4332]' : 'border-[#E5E1D1]'}`}>
                  <img src={p.image || 'https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?auto=format&fit=crop&q=80&w=200'} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-[#1B4332] truncate">{p.name}</h4>
                    <p className="text-[9px] text-[#B08D57] font-bold mt-0.5">零售: ¥{p.retailPrice} | 渠道: ¥{p.channelPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <section className="flex-1 bg-[#F9F7F2] overflow-y-auto p-8 relative">
          {!currentSet ? (
            <div className="max-w-6xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-4xl font-serif font-bold text-[#1B4332] mb-3">方案管理中心</h2>
                <p className="text-gray-400 font-medium">查看、编辑或管理您当前所有的礼赠策划方案</p>
              </div>
              
              {giftSets.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#E5E1D1] rounded-[40px] p-20 flex flex-col items-center justify-center opacity-40">
                  <Package size={64} className="mb-6 text-[#B08D57]" strokeWidth={1} />
                  <p className="font-serif text-xl font-bold text-[#1B4332]">暂无任何方案，点击右上角“创建新方案”开始</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giftSets.map(set => (
                    <div key={set.id} onClick={() => setCurrentSetId(set.id)} className="group bg-white rounded-[32px] border border-[#E5E1D1] p-8 shadow-sm hover:shadow-xl hover:border-[#1B4332] transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 flex gap-2 translate-x-12 group-hover:translate-x-0 transition-transform">
                         <button onClick={(e) => handleDeleteSet(set.id, e)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16}/></button>
                      </div>
                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-[#B08D57] bg-[#B08D57]/5 px-3 py-1 rounded-full uppercase tracking-widest">{set.tiers.length} 个档位配置</span>
                        <h3 className="text-2xl font-serif font-bold text-[#1B4332] mt-3 group-hover:text-[#B08D57] transition-colors">{set.name}</h3>
                        <p className="text-[10px] text-gray-300 mt-2">创建于 {new Date(set.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentSetId(null)} className="p-3 bg-white border rounded-2xl hover:border-[#1B4332] shadow-sm"><ChevronLeft size={24}/></button>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-[#1B4332]">{currentSet.name}</h2>
                    <p className="text-xs text-gray-400 mt-1 font-medium">编辑模式：点击左侧添加产品到选中的档位中</p>
                  </div>
                </div>
                <button onClick={() => handleOpenTierSettings()} className="bg-[#B08D57] text-white px-8 py-3.5 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                  <Plus size={20} /> 新增价格档位
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {currentSet.tiers.map(tier => {
                  const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
                  const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0); 
                  const totalChannel = items.reduce((s, p) => s + p.channelPrice, 0);
                  const productSellingPrice = totalRetail * (tier.discountRate / 100); 
                  const unitTotalCost = totalChannel + tier.boxCost + tier.laborCost + tier.logisticsCost;
                  const unitUntaxedPrice = productSellingPrice + tier.boxCost + tier.laborCost + tier.logisticsCost;
                  const unitTax = unitUntaxedPrice * (tier.taxRate / 100);
                  const finalUnitSellingPrice = unitUntaxedPrice + unitTax;
                  const isOverBudget = finalUnitSellingPrice > tier.targetTierPrice;
                  const active = activeTierId === tier.id;

                  return (
                    <div key={tier.id} onClick={() => setActiveTierId(tier.id)} className={`bg-white rounded-[40px] border-2 flex flex-col h-[820px] overflow-hidden transition-all duration-500 ${active ? 'border-[#1B4332] shadow-2xl scale-[1.02]' : 'border-transparent shadow-lg opacity-90'}`}>
                      <div className={`px-8 py-6 flex justify-between items-center ${active ? 'bg-[#1B4332] text-white' : 'bg-[#FDFCF8] border-b'}`}>
                        <div>
                          <p className="text-xl font-bold font-serif">{tier.targetTierPrice} 元档</p>
                          <p className={`text-[10px] font-bold mt-1 ${active ? 'opacity-60' : 'text-gray-400'}`}>数量: {tier.quantity} 套 | 税率: {tier.taxRate}%</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenTierSettings(tier); }} className={`p-2 rounded-xl transition-all ${active ? 'hover:bg-white/10 text-white' : 'text-gray-300 hover:text-[#B08D57]'}`}><Settings size={18}/></button>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('删除此档位？')) setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.filter(t => t.id !== tier.id) } : s)); }} className={`p-2 rounded-xl transition-all ${active ? 'hover:bg-white/10 text-white' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={18}/></button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#FDFCF8]/40">
                        {items.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-200 opacity-50">
                             <Plus size={40} className="mb-2" />
                             <p className="text-[10px] font-bold uppercase">请在左侧点击产品选入</p>
                          </div>
                        ) : items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm group/item">
                            <img src={it.image} className="w-10 h-10 rounded-xl object-cover bg-gray-50 border" />
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-[#1B4332] truncate">{it.name}</p>
                               <p className="text-[9px] text-[#B08D57] font-bold mt-0.5">零售: ¥{it.retailPrice} | 渠道: ¥{it.channelPrice}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromTier(tier.id, idx); }} className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-300 hover:text-red-500"><X size={14}/></button>
                          </div>
                        ))}
                      </div>

                      <div className={`p-8 border-t transition-all ${isOverBudget ? 'bg-red-50' : 'bg-[#FDFCF8]'}`}>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-[8px] font-bold text-gray-400 uppercase border-b pb-3 border-black/5">
                             <div>产品折后: ¥{productSellingPrice.toFixed(1)}</div>
                             <div>杂费合计: ¥{(tier.boxCost + tier.laborCost + tier.logisticsCost).toFixed(1)}</div>
                             <div className="text-right">税额: ¥{unitTax.toFixed(1)}</div>
                          </div>

                          <div className="space-y-3">
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] font-black uppercase text-[#B08D57]">含税单价 (最终定价)</p>
                                  {isOverBudget && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">超档位!</span>}
                                </div>
                                <div className={`bg-white p-4 rounded-2xl border-2 flex justify-between items-center ${isOverBudget ? 'border-red-400' : 'border-black/5'}`}>
                                  <p className={`text-2xl font-serif font-black ${isOverBudget ? 'text-red-600' : 'text-[#1B4332]'}`}>¥{finalUnitSellingPrice.toFixed(0)}</p>
                                  <div className="text-right">
                                     <p className="text-[8px] text-gray-400 font-bold">档位偏差</p>
                                     <p className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                                       {finalUnitSellingPrice > tier.targetTierPrice ? `+${(finalUnitSellingPrice - tier.targetTierPrice).toFixed(0)}` : `-${(tier.targetTierPrice - finalUnitSellingPrice).toFixed(0)}`}
                                     </p>
                                  </div>
                                </div>
                             </div>

                             <div className="bg-white/60 p-4 border border-black/5 rounded-2xl flex justify-between">
                                <div>
                                   <p className="text-[8px] text-gray-400 font-bold">全案总金额 ({tier.quantity}套)</p>
                                   <p className="text-sm font-black text-[#1B4332]">¥{(finalUnitSellingPrice * tier.quantity).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[8px] text-gray-400 font-bold">预估毛利率</p>
                                   <p className={`text-sm font-black ${unitUntaxedPrice - unitTotalCost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {unitUntaxedPrice > 0 ? (((unitUntaxedPrice - unitTotalCost) / unitUntaxedPrice) * 100).toFixed(1) : 0}%
                                   </p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="新建设计方案">
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase block">方案项目名称</label>
          <input autoFocus type="text" placeholder="例如：XX银行中秋礼赠开发" className="w-full px-5 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none font-bold text-lg focus:border-[#1B4332]" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()} />
          <button onClick={handleCreateSet} className="w-full mt-2 py-4 bg-[#1B4332] text-white rounded-[24px] font-bold shadow-xl active:scale-95 transition-all">开启策划设计</button>
        </div>
      </Modal>

      <Modal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} title={editingTierId ? "修改档位财务模型" : "配置新档位财务模型"} maxWidth="max-w-2xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="text-[10px] font-bold text-[#B08D57] block mb-2 uppercase tracking-widest flex items-center gap-2"><Settings size={12}/> 核心目标预算 (含税单价 ¥)</label>
                  <input type="number" className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-2xl font-black text-2xl outline-none focus:border-[#1B4332]" value={tierForm.targetPrice} onChange={(e) => setTierForm({...tierForm, targetPrice: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase flex items-center gap-2"><Percent size={12}/> 产品折扣 (%)</label>
                  <input type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl font-bold outline-none" value={tierForm.discount} onChange={(e) => setTierForm({...tierForm, discount: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase flex items-center gap-2"><RefreshCcw size={12}/> 礼包数量 (套)</label>
                  <input type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl font-bold outline-none" value={tierForm.quantity} onChange={(e) => setTierForm({...tierForm, quantity: e.target.value})} />
               </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
               <p className="text-[10px] font-bold text-[#B08D57] mb-4 uppercase tracking-widest">其他杂费成本 (单包金额)</p>
               <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Box size={10}/> 礼盒包装</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" value={tierForm.box} onChange={(e) => setTierForm({...tierForm, box: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Users size={10}/> 打包人工</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" value={tierForm.labor} onChange={(e) => setTierForm({...tierForm, labor: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Truck size={10}/> 物流快递</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" value={tierForm.logistics} onChange={(e) => setTierForm({...tierForm, logistics: e.target.value})} />
                  </div>
               </div>
               <div className="mt-4">
                  <label className="text-[9px] text-gray-400 block mb-1">结算税率 (%)</label>
                  <input type="number" className="w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" value={tierForm.tax} onChange={(e) => setTierForm({...tierForm, tax: e.target.value})} />
               </div>
            </div>

            <button onClick={handleSaveTier} className="w-full py-4 bg-[#B08D57] text-white rounded-[24px] font-bold shadow-xl shadow-[#B08D57]/20 active:scale-95 transition-all">
              {editingTierId ? "确认并保存设置" : "创建配置并进入选品"}
            </button>
         </div>
      </Modal>

      <Modal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} title="产品库资源中心" maxWidth="max-w-7xl">
         <div className="flex flex-col h-full gap-5">
           <div className="flex justify-between items-center bg-[#F9F7F2] p-6 rounded-[32px] border border-[#E5E1D1]">
             <div className="flex gap-3">
                <label className="cursor-pointer bg-[#1B4332] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-[#2D5A47] transition-all flex items-center gap-2">
                  <FileUp size={18} /> 导入 CSV (UTF-8/GBK)
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => setProducts([{ id: Date.now().toString(), sku: 'NEW', name: '新录入产品', spec: '', unit: '件', platformPrice: 0, channelPrice: 0, retailPrice: 0, image: '', manufacturer: '', category: '默认' }, ...products])} className="bg-white border border-[#E5E1D1] text-[#1B4332] px-6 py-3 rounded-2xl font-bold text-sm hover:border-[#1B4332] transition-all">手动新增</button>
             </div>
             <button onClick={() => { if(confirm('重置库将清空所有数据！')) { localStorage.clear(); window.location.reload(); } }} className="text-red-300 hover:text-red-500 text-[10px] font-bold flex items-center gap-1 transition-colors"><RefreshCcw size={12}/> 重置数据库</button>
           </div>

           <div className="border border-[#E5E1D1] rounded-[32px] overflow-hidden bg-white shadow-inner flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#FDFCF8] text-[10px] font-bold text-[#B08D57] border-b border-[#E5E1D1] sticky top-0 z-50">
                  <tr>
                    <th className="px-6 py-4">产品基本信息</th>
                    <th className="px-4 py-4">分类/属性</th>
                    <th className="px-4 py-4 text-center">价格 (¥)</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2E8]">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 flex gap-4 items-center">
                        <img src={p.image || 'https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?auto=format&fit=crop&q=80&w=200'} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border shadow-sm" />
                        <div className="flex-1">
                          <input className="font-bold text-[#1B4332] bg-transparent outline-none w-full text-sm" value={p.name} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} />
                          <input className="text-[10px] font-mono text-gray-300 bg-transparent outline-none w-full" value={p.sku} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, sku: e.target.value} : x))} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input className="text-[10px] font-bold text-[#B08D57] bg-[#B08D57]/5 rounded px-2 outline-none" value={p.category} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, category: e.target.value} : x))} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-4 justify-center">
                          <div className="text-center">
                             <span className="text-[8px] text-gray-300 font-bold block mb-1">渠道成本</span>
                             <input type="number" className="bg-[#F9F7F2] rounded-xl px-2 py-1 border border-[#E5E1D1] w-20 text-xs font-black text-center" value={p.channelPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, channelPrice: Number(e.target.value)} : x))} />
                          </div>
                          <div className="text-center">
                             <span className="text-[8px] text-gray-300 font-bold block mb-1">零售指导</span>
                             <input type="number" className="bg-[#F9F7F2] rounded-xl px-2 py-1 border border-[#E5E1D1] w-20 text-xs font-black text-center" value={p.retailPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, retailPrice: Number(e.target.value)} : x))} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-gray-200 hover:text-red-500 p-3"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
         </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Inter:wght@400;500;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #FDFCF8; -webkit-font-smoothing: antialiased; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
