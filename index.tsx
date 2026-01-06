
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FileSpreadsheet,
  ArrowUpAZ,
  ArrowDownZA,
  Image as ImageIcon,
  Tag,
  BadgeDollarSign,
  Filter,
  Type,
  RotateCcw
} from 'lucide-react';

// --- 数据接口定义 ---
interface Product {
  id: string;
  sku: string;         
  name: string;        
  spec: string;        
  unit: string;        
  platformPrice: number; // 我方采购成本价
  channelPrice: number;  // 经销商标准分销价
  retailPrice: number;   // 市场零售价
  image: string;         // 对应表格中的“素材CDN”
  manufacturer: string;  
  category: string;      
}

interface Tier {
  id: string;
  label: string;
  targetTierPrice: number;   // 客户设定的档位目标值 (对比折后价)
  discountRate: number;      // 该档位的选品折扣 (如 80 代表 8折)
  quantity: number;          // 礼包套数
  boxCost: number;           // 礼盒包材成本
  laborCost: number;         // 人工打包费用
  logisticsCost: number;     // 快递物流费用
  taxRate: number;           // 税率 (%)
  selectedProductIds: string[];
}

interface GiftSet {
  id: string;
  name: string;
  createdAt: number;
  tiers: Tier[];
}

const STORAGE_KEY_PRODUCTS = 'SHANSHUI_DB_PRODUCTS_V13';
const STORAGE_KEY_GIFTSETS = 'SHANSHUI_DB_GIFTSETS_V13';
const STORAGE_KEY_AUTH = 'SHANSHUI_AUTH_V1';

const LOGO_URL = "https://img.lenyiin.com/app/hide.php?key=S0d4Y1N4YThGNkRHbnV4U1lrL1BBMDVncmc1Q1ZhZkZPR2c4dUg0PQ==";

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', sku: 'ZS-CJ-001', name: '青山远黛-禅意茶具', spec: '一壶四杯', unit: '套', platformPrice: 150, channelPrice: 299, retailPrice: 599, image: 'https://images.unsplash.com/photo-1576020488411-26298acb51bd?auto=format&fit=crop&q=80&w=400', manufacturer: '景德镇文创', category: '茶具' },
];

const HEADER_MAP: Record<string, string[]> = {
  sku: ['sku', '编号', '编码', '货号', '代号', 'id'],
  name: ['名称', '品名', '产品名称', '标题', '商品', 'name'],
  spec: ['规格', '参数', '尺寸', '描述', 'spec'],
  unit: ['单位', '计量', 'unit', '规'],
  platformPrice: ['平台价', '我方成本', '成本', '成本价', 'platform'],
  channelPrice: ['渠道价', '分销价', '经销商价', '结算价', 'channel'],
  retailPrice: ['零售', '零售价', '原价', '市场价', '标价', 'retail'],
  image: ['素材cdn', '素材', '图片', '图', '链接', 'url', 'image'], // 优先匹配“素材CDN”
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

const ProductImage = ({ src, className, name, onHover }: { src?: string, className?: string, name?: string, onHover?: (url: string | null, e: React.MouseEvent) => void }) => {
  const [imgUrl, setImgUrl] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = src?.trim();
    setImgUrl(trimmed);
    setError(false);
  }, [src]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (imgUrl && !error) onHover?.(imgUrl, e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (imgUrl && !error) onHover?.(imgUrl, e);
  };

  const handleMouseLeave = () => {
    onHover?.(null, null as any);
  };

  if (!imgUrl || error) {
    return (
      <div className={`${className} bg-[#F9F7F2] flex flex-col items-center justify-center text-[#E5E1D1] border border-[#E5E1D1] overflow-hidden`}>
        <ImageIcon size={className?.includes('w-12') ? 16 : 24} />
        {name && <span className="text-[7px] text-center mt-1 px-1 truncate w-full font-bold opacity-60">{name.substring(0, 4)}</span>}
      </div>
    );
  }

  return (
    <img 
      src={imgUrl} 
      className={`${className} object-cover cursor-zoom-in`}
      onError={() => {
        console.warn(`Image load failed for: ${imgUrl}`);
        setError(true);
      }} 
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      alt={name || "Product"}
      loading="lazy"
    />
  );
};

function FilterRow({ label, icon: Icon, items, activeItem, onSelect, activeColor = "bg-[#1B4332]" }: { label: string, icon: any, items: string[], activeItem: string, onSelect: (val: string) => void, activeColor?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-bold text-[#B08D57] uppercase tracking-[0.1em] flex items-center gap-1.5">
          <Icon size={12}/> {label}
        </p>
      </div>
      <div className="relative group/scroll">
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2.5 scroll-smooth cursor-grab active:cursor-grabbing scrollbar-thin"
        >
          {items.map(item => (
            <button 
              key={item} 
              onClick={() => onSelect(item)} 
              className={`px-4 py-2 text-[11px] rounded-full border whitespace-nowrap font-bold transition-all shrink-0 select-none ${activeItem === item ? `${activeColor} text-white border-transparent shadow-md transform scale-105` : 'bg-white text-gray-400 border-[#E5E1D1]/50 hover:border-[#1B4332] hover:text-[#1B4332]'}`}
            >
              {item}
            </button>
          ))}
        </div>
        {/* 指示遮罩，提示可右拉 */}
        <div className="absolute right-0 top-0 bottom-2.5 w-16 bg-gradient-to-l from-white via-white/40 to-transparent pointer-events-none opacity-80 group-hover/scroll:opacity-20 transition-opacity" />
      </div>
    </div>
  );
}

function App() {
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
  const [activeUnit, setActiveUnit] = useState('全部');
  const [activeSpec, setActiveSpec] = useState('全部');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{url: string, x: number, y: number} | null>(null);

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
  const units = useMemo(() => ['全部', ...Array.from(new Set(products.map(p => p.unit).filter(Boolean)))], [products]);
  const specs = useMemo(() => ['全部', ...Array.from(new Set(products.map(p => p.spec).filter(Boolean)))], [products]);
  const currentSet = useMemo(() => giftSets.find(s => s.id === currentSetId) || null, [giftSets, currentSetId]);

  const sortedFilteredProducts = useMemo(() => {
    let result = [...products].filter(p => {
      const match = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const catMatch = activeCategory === '全部' || p.category === activeCategory;
      const unitMatch = activeUnit === '全部' || p.unit === activeUnit;
      const specMatch = activeSpec === '全部' || p.spec === activeSpec;
      return match && catMatch && unitMatch && specMatch;
    });
    
    if (sortBy === 'price-asc') result.sort((a, b) => a.channelPrice - b.channelPrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.channelPrice - a.channelPrice);
    
    return result;
  }, [searchTerm, activeCategory, activeUnit, activeSpec, sortBy, products]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveCategory('全部');
    setActiveUnit('全部');
    setActiveSpec('全部');
    setSortBy('default');
  };

  const handleImageHover = (url: string | null, e: React.MouseEvent) => {
    if (!url) {
      setHoveredImage(null);
      return;
    }
    setHoveredImage({ url, x: e.clientX, y: e.clientY });
  };

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
      const findIndex = (keys: string[]) => headerRow.findIndex(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
      const mapping = {
        sku: findIndex(HEADER_MAP.sku),
        name: findIndex(HEADER_MAP.name),
        spec: findIndex(HEADER_MAP.spec),
        unit: findIndex(HEADER_MAP.unit),
        platformPrice: findIndex(HEADER_MAP.platformPrice),
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
          spec: mapping.spec !== -1 ? cols[mapping.spec] : '', 
          unit: mapping.unit !== -1 ? cols[mapping.unit] : '件', 
          platformPrice: mapping.platformPrice !== -1 ? cleanNum(cols[mapping.platformPrice]) : 0,
          channelPrice: mapping.channelPrice !== -1 ? cleanNum(cols[mapping.channelPrice]) : 0,
          retailPrice: mapping.retailPrice !== -1 ? cleanNum(cols[mapping.retailPrice]) : 0,
          image: mapping.image !== -1 ? cols[mapping.image] : '',
          manufacturer: '',
          category: mapping.category !== -1 ? cols[mapping.category] : '默认'
        };
      });
      setProducts(prev => [...newProducts, ...prev]);
      alert(`已成功导入 ${newProducts.length} 条产品数据（已关联“素材CDN”字段）`);
    } catch (err) { alert('导入失败，请确保CSV列头包含“素材CDN”或相应标题'); }
    e.target.value = '';
  };

  const handleExportScheme = () => {
    if (!currentSet) return;
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "方案名称,档位预算,选品折扣,数量,产品名称,SKU,规格,单位,零售价,折后价(计入预算),我方成本(平台价),素材CDN,杂费合计,单包税额,含税单价,全案总额\n";

    currentSet.tiers.forEach(tier => {
      const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
      
      const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0);
      const productDiscountedPrice = totalRetail * (tier.discountRate / 100);
      const otherCosts = tier.boxCost + tier.laborCost + tier.logisticsCost;
      const unitUntaxedPrice = productDiscountedPrice + otherCosts;
      const unitTax = unitUntaxedPrice * (tier.taxRate / 100);
      const finalUnitSellingPrice = unitUntaxedPrice + unitTax;
      const totalAmount = finalUnitSellingPrice * tier.quantity;

      if (items.length === 0) {
        csvContent += `${currentSet.name},${tier.targetTierPrice},${tier.discountRate}%,${tier.quantity},未选品,-,-,-,0,0,0,-,${otherCosts},0,${finalUnitSellingPrice.toFixed(2)},${totalAmount.toFixed(2)}\n`;
      } else {
        items.forEach((it, idx) => {
          if (idx === 0) {
            csvContent += `${currentSet.name},${tier.targetTierPrice},${tier.discountRate}%,${tier.quantity},"${it.name}",${it.sku},"${it.spec}",${it.unit},${it.retailPrice},${(it.retailPrice * (tier.discountRate/100)).toFixed(2)},${it.platformPrice},"${it.image}",${otherCosts},${unitTax.toFixed(2)},${finalUnitSellingPrice.toFixed(2)},${totalAmount.toFixed(2)}\n`;
          } else {
            csvContent += `,,, ,"${it.name}",${it.sku},"${it.spec}",${it.unit},${it.retailPrice},${(it.retailPrice * (tier.discountRate/100)).toFixed(2)},${it.platformPrice},"${it.image}",,, \n`;
          }
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `方案报表_${currentSet.name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    if (confirm('确定删除整个设计方案？')) {
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?auto=format&fit=crop&q=80&w=2000')] opacity-5 grayscale pointer-events-none" />
        <div className="relative w-full max-w-md bg-white rounded-[48px] shadow-2xl border border-[#E5E1D1] p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#1B4332] p-2 rounded-3xl mb-6 shadow-xl overflow-hidden">
              <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
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
                  type="text" placeholder="请输入账号" 
                  className="w-full pl-14 pr-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none focus:border-[#1B4332] font-medium transition-all"
                  value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">安全密码</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" placeholder="请输入密码" 
                  className="w-full pl-14 pr-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none focus:border-[#1B4332] font-medium transition-all"
                  value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>
            {loginError && <div className="flex items-center gap-2 text-red-500 text-xs font-bold pl-4 animate-in slide-in-from-top-1"><AlertCircle size={14} /> {loginError}</div>}
            <button type="submit" className="w-full py-5 bg-[#1B4332] text-white rounded-[24px] font-bold text-lg shadow-2xl hover:bg-[#2D5A47] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <LogIn size={20} /> 进入系统
            </button>
          </form>
          <p className="mt-10 text-center text-gray-300 text-[10px] uppercase font-bold tracking-widest">© 2025 藏境山水 · 内部管理系统</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans flex flex-col h-screen overflow-hidden">
      <header className="border-b border-[#E5E1D1] bg-white px-6 py-4 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentSetId(null); setActiveTierId(null); }}>
          <div className="bg-[#1B4332] p-1.5 rounded-xl shadow-lg overflow-hidden shrink-0">
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain invert grayscale brightness-200" />
          </div>
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
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-[#E5E1D1] text-gray-400 px-5 py-2.5 rounded-full font-bold text-sm hover:text-red-500 hover:border-red-200 transition-all active:scale-95">退出登录</button>
          <button onClick={() => { setInputValue(''); setIsPackageModalOpen(true); }} className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-[#2D5A47] transition-all active:scale-95">
            <Plus size={18} /> 创建新方案
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {currentSet && (
          <aside className="w-[380px] border-r border-[#E5E1D1] bg-white flex flex-col shrink-0 z-20 shadow-xl">
            <div className="p-4 space-y-4 border-b border-[#F5F2E8] bg-white">
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" placeholder="查找品名/SKU..." 
                      className="w-full pl-9 pr-4 py-2 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl text-xs outline-none focus:border-[#1B4332] font-medium"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={handleResetFilters} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-[#1B4332] transition-colors" title="重置筛选"><RotateCcw size={16}/></button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-[#E5E1D1] rounded-xl text-[10px] font-bold text-[#1B4332] outline-none focus:border-[#1B4332] cursor-pointer"
                    >
                      <option value="default">默认排序</option>
                      <option value="price-asc">经销价: 低到高</option>
                      <option value="price-desc">经销价: 高到低</option>
                    </select>
                    <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={12} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-5 py-1">
                <FilterRow 
                  label="产品分类" 
                  icon={Layers} 
                  items={categories} 
                  activeItem={activeCategory} 
                  onSelect={setActiveCategory} 
                />
                
                <FilterRow 
                  label="规格筛选" 
                  icon={Type} 
                  items={specs} 
                  activeItem={activeSpec} 
                  onSelect={setActiveSpec}
                  activeColor="bg-[#1B4332]"
                />

                <FilterRow 
                  label="单位筛选" 
                  icon={Filter} 
                  items={units} 
                  activeItem={activeUnit} 
                  onSelect={setActiveUnit}
                  activeColor="bg-[#B08D57]"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#FDFCF8]/30">
              {sortedFilteredProducts.map(p => (
                <div key={p.id} onClick={() => activeTierId && addToTier(p.id)} className={`group relative bg-white border rounded-2xl p-2.5 flex gap-3 cursor-pointer transition-all ${!activeTierId ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-[#1B4332] shadow-sm active:scale-95'} ${lastAddedId === p.id ? 'ring-2 ring-[#1B4332]' : 'border-[#E5E1D1]'}`}>
                  <ProductImage src={p.image} name={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-50 shadow-sm" onHover={handleImageHover} />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-[#1B4332] truncate">{p.name}</h4>
                    <p className="text-[10px] text-[#B08D57] font-bold mt-1 tracking-tight">
                       分销: ¥{p.channelPrice} | 零售: ¥{p.retailPrice}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.spec && <span className="text-[8px] bg-[#1B4332]/5 text-[#1B4332] px-1.5 py-0.5 rounded font-bold">{p.spec}</span>}
                      <span className="text-[8px] bg-[#B08D57]/5 text-[#B08D57] px-1.5 py-0.5 rounded font-bold">{p.unit}</span>
                      <p className="text-[8px] text-gray-300 uppercase font-mono font-bold tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  {activeTierId && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B4332] text-white p-1 rounded-full shadow-lg"><Plus size={12}/></div>}
                </div>
              ))}
              {sortedFilteredProducts.length === 0 && (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                   <Search size={32} className="mb-2 text-[#E5E1D1]"/>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">无匹配结果</p>
                </div>
              )}
            </div>
          </aside>
        )}

        <section className="flex-1 bg-[#F9F7F2] overflow-y-auto p-8 relative">
          {!currentSet ? (
            <div className="max-w-6xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-4xl font-serif font-bold text-[#1B4332] mb-3">方案管理中心</h2>
                <p className="text-gray-400 font-medium tracking-wide">管理所有藏镜山水礼赠策划方案</p>
              </div>
              {giftSets.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#E5E1D1] rounded-[40px] p-20 flex flex-col items-center justify-center opacity-40">
                  <Package size={64} className="mb-6 text-[#B08D57]" strokeWidth={1} />
                  <p className="font-serif text-xl font-bold text-[#1B4332]">暂无设计方案，点击右上角开始</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giftSets.map(set => (
                    <div key={set.id} onClick={() => setCurrentSetId(set.id)} className="group bg-white rounded-[32px] border border-[#E5E1D1] p-8 shadow-sm hover:shadow-xl hover:border-[#1B4332] transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 flex gap-2 translate-x-12 group-hover:translate-x-0 transition-transform">
                         <button onClick={(e) => handleDeleteSet(set.id, e)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16}/></button>
                      </div>
                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-[#B08D57] bg-[#B08D57]/5 px-3 py-1 rounded-full uppercase tracking-widest font-mono">{set.tiers.length} TIERS</span>
                        <h3 className="text-2xl font-serif font-bold text-[#1B4332] mt-3 group-hover:text-[#B08D57] transition-colors line-clamp-2 leading-relaxed">{set.name}</h3>
                        <p className="text-[10px] text-gray-300 mt-4 font-bold uppercase tracking-widest">Created at {new Date(set.createdAt).toLocaleDateString()}</p>
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
                  <button onClick={() => { setCurrentSetId(null); setActiveTierId(null); }} className="p-3 bg-white border rounded-2xl hover:border-[#1B4332] shadow-sm transition-all active:scale-90"><ChevronLeft size={24}/></button>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-[#1B4332]">{currentSet.name}</h2>
                    <p className="text-xs text-gray-400 mt-1 font-medium italic">档位预算判定标准：折后零售价之和。我方利润基于「平台价」成本计算。</p>
                  </div>
                </div>
                <button onClick={() => handleOpenTierSettings()} className="bg-[#B08D57] text-white px-8 py-3.5 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all hover:bg-[#A07C48]">
                  <Plus size={20} /> 新增档位模型
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {currentSet.tiers.map(tier => {
                  const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
                  const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0); 
                  const productDiscountedPrice = totalRetail * (tier.discountRate / 100); 
                  const totalOurCost = items.reduce((s, p) => s + p.platformPrice, 0); 
                  const otherCosts = tier.boxCost + tier.laborCost + tier.logisticsCost;
                  const unitOurTotalCost = totalOurCost + otherCosts;
                  const unitUntaxedPrice = productDiscountedPrice + otherCosts;
                  const unitTax = unitUntaxedPrice * (tier.taxRate / 100);
                  const finalUnitSellingPrice = unitUntaxedPrice + unitTax;
                  const isOverBudget = productDiscountedPrice > tier.targetTierPrice;
                  const active = activeTierId === tier.id;

                  return (
                    <div key={tier.id} onClick={() => setActiveTierId(tier.id)} className={`bg-white rounded-[40px] border-2 flex flex-col h-[72vh] min-h-[650px] max-h-[850px] overflow-hidden transition-all duration-500 ${active ? 'border-[#1B4332] shadow-2xl scale-[1.02]' : 'border-transparent shadow-lg opacity-90'}`}>
                      <div className={`px-6 py-5 flex justify-between items-center ${active ? 'bg-[#1B4332] text-white' : 'bg-[#FDFCF8] border-b'}`}>
                        <div>
                          <p className="text-lg font-bold font-serif">{tier.targetTierPrice} 元预算档</p>
                          <p className={`text-[9px] font-bold mt-0.5 ${active ? 'opacity-60' : 'text-gray-400'}`}>选品折扣: {tier.discountRate}% | 数量: {tier.quantity}套</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenTierSettings(tier); }} className={`p-2 rounded-xl transition-all ${active ? 'hover:bg-white/10 text-white' : 'text-gray-300 hover:text-[#B08D57]'}`}><Settings size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('确认移除此档位？')) setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.filter(t => t.id !== tier.id) } : s)); }} className={`p-2 rounded-xl transition-all ${active ? 'hover:bg-white/10 text-white' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={16}/></button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#FDFCF8]/40">
                        {items.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-200 opacity-50">
                             <Plus size={32} className="mb-2" />
                             <p className="text-[9px] font-bold uppercase tracking-widest">请点击左侧产品选入</p>
                          </div>
                        ) : items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 p-2 bg-white border border-gray-100 rounded-xl shadow-sm group/item animate-in fade-in slide-in-from-left-2 transition-all hover:border-[#1B4332]/30">
                            <ProductImage src={it.image} name={it.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-50 border" onHover={handleImageHover} />
                            <div className="flex-1 min-w-0">
                               <p className="text-[11px] font-bold text-[#1B4332] truncate">{it.name}</p>
                               <div className="flex justify-between mt-0.5 items-baseline">
                                 <p className="text-[8px] text-[#B08D57] font-bold">折后: ¥{(it.retailPrice * (tier.discountRate / 100)).toFixed(1)}</p>
                                 <p className="text-[7px] text-gray-300 font-medium">{it.spec ? `${it.spec}/` : ''}{it.unit} | ¥{it.retailPrice}</p>
                               </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromTier(tier.id, idx); }} className="opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"><X size={12}/></button>
                          </div>
                        ))}
                      </div>

                      <div className={`p-6 border-t transition-all shrink-0 ${isOverBudget ? 'bg-red-50/50' : 'bg-[#FDFCF8]'}`}>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8px] font-bold text-gray-400 uppercase border-b pb-3 border-black/5">
                             <div className="flex justify-between items-center"><span>选品总零售价:</span> <span className="text-gray-700">¥{totalRetail.toFixed(1)}</span></div>
                             <div className="flex justify-between items-center pl-2 border-l border-black/5"><span>杂费包材:</span> <span className="text-gray-700">¥{otherCosts.toFixed(1)}</span></div>
                             <div className="flex justify-between items-center"><span>我方总成本:</span> <span className="text-gray-700">¥{unitOurTotalCost.toFixed(1)}</span></div>
                             <div className="flex justify-between items-center pl-2 border-l border-black/5"><span>单包税额:</span> <span className="text-gray-700">¥{unitTax.toFixed(1)}</span></div>
                          </div>

                          <div className="space-y-2">
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[9px] font-black uppercase text-[#B08D57] flex items-center gap-1"><Tag size={10}/> 折后零售总值 (对标预算)</p>
                                  {isOverBudget && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">超出预算!</span>}
                                </div>
                                <div className={`bg-white p-3 rounded-xl border flex justify-between items-center ${isOverBudget ? 'border-red-400 shadow-md shadow-red-100' : 'border-[#1B4332]/10 shadow-sm'}`}>
                                  <p className={`text-xl font-serif font-black ${isOverBudget ? 'text-red-600' : 'text-[#1B4332]'}`}>¥{productDiscountedPrice.toFixed(1)}</p>
                                  <div className="text-right">
                                     <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">预算偏差</p>
                                     <p className={`text-[10px] font-black ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                                       {productDiscountedPrice > tier.targetTierPrice ? `+${(productDiscountedPrice - tier.targetTierPrice).toFixed(1)}` : `-${(tier.targetTierPrice - productDiscountedPrice).toFixed(1)}`}
                                     </p>
                                  </div>
                                </div>
                             </div>

                             <div className="bg-white/60 p-3 border border-black/5 rounded-xl flex justify-between items-center group/total">
                                <div>
                                   <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1"><BadgeDollarSign size={8}/> 含税总结算单价</p>
                                   <p className="text-base font-black text-[#1B4332]">¥{finalUnitSellingPrice.toFixed(1)}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">我方利润率</p>
                                   <p className={`text-xs font-black ${unitUntaxedPrice - unitOurTotalCost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {unitUntaxedPrice > 0 ? (((unitUntaxedPrice - unitOurTotalCost) / unitUntaxedPrice) * 100).toFixed(1) : 0}%
                                   </p>
                                </div>
                             </div>
                             
                             <div className="flex justify-center">
                                <p className="text-[8px] font-bold text-gray-300 font-mono">全案总额: ¥{(finalUnitSellingPrice * tier.quantity).toLocaleString()}</p>
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

      {/* --- Modals --- */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="策划新设计方案">
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">方案项目名称</label>
          <input autoFocus type="text" placeholder="例如：XX银行2024中秋礼赠方案" className="w-full px-5 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none font-bold text-lg focus:border-[#1B4332] transition-all" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()} />
          <button onClick={handleCreateSet} className="w-full mt-2 py-4 bg-[#1B4332] text-white rounded-[24px] font-bold shadow-xl active:scale-95 transition-all hover:bg-[#2D5A47]">开启数字化选品</button>
        </div>
      </Modal>

      <Modal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} title={editingTierId ? "调整档位财务模型" : "配置档位财务模型"} maxWidth="max-w-2xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="text-[10px] font-bold text-[#B08D57] block mb-2 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> 目标预算档位 (对比折后零售价之和 ¥)</label>
                  <input type="number" className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-2xl font-black text-2xl outline-none focus:border-[#1B4332]" value={tierForm.targetPrice} onChange={(e) => setTierForm({...tierForm, targetPrice: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase flex items-center gap-2"><Percent size={12}/> 选品折扣率 (%)</label>
                  <input type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl font-bold outline-none focus:border-[#1B4332]" value={tierForm.discount} onChange={(e) => setTierForm({...tierForm, discount: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase flex items-center gap-2"><RefreshCcw size={12}/> 礼包需求量 (套)</label>
                  <input type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl font-bold outline-none focus:border-[#1B4332]" value={tierForm.quantity} onChange={(e) => setTierForm({...tierForm, quantity: e.target.value})} />
               </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
               <p className="text-[10px] font-bold text-[#B08D57] mb-4 uppercase tracking-widest">其他杂费成本 (单包金额)</p>
               <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Box size={10}/> 包装礼盒</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#1B4332]" value={tierForm.box} onChange={(e) => setTierForm({...tierForm, box: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Users size={10}/> 打包人工</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#1B4332]" value={tierForm.labor} onChange={(e) => setTierForm({...tierForm, labor: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 flex items-center gap-1"><Truck size={10}/> 物流快递</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#1B4332]" value={tierForm.logistics} onChange={(e) => setTierForm({...tierForm, logistics: e.target.value})} />
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold tracking-widest">增值税率 (%)</label>
                    <input type="number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#1B4332]" value={tierForm.tax} onChange={(e) => setTierForm({...tierForm, tax: e.target.value})} />
                  </div>
               </div>
            </div>

            <button onClick={handleSaveTier} className="w-full py-4 bg-[#B08D57] text-white rounded-[24px] font-bold shadow-xl active:scale-95 transition-all hover:bg-[#A07C48]">
              {editingTierId ? "保存财务调整" : "确认模型并进入选品"}
            </button>
         </div>
      </Modal>

      <Modal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} title="藏镜山水-产品库资源" maxWidth="max-w-7xl">
         <div className="flex flex-col h-full gap-5">
           <div className="flex justify-between items-center bg-[#F9F7F2] p-6 rounded-[32px] border border-[#E5E1D1]">
             <div className="flex gap-3">
                <label className="cursor-pointer bg-[#1B4332] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-[#2D5A47] transition-all flex items-center gap-2 active:scale-95">
                  <FileUp size={18} /> 批量导入素材表 (CSV)
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => setProducts([{ id: Date.now().toString(), sku: 'NEW-' + Math.floor(Math.random()*1000), name: '待录入产品', spec: '', unit: '件', platformPrice: 0, channelPrice: 0, retailPrice: 0, image: '', manufacturer: '', category: '默认' }, ...products])} className="bg-white border border-[#E5E1D1] text-[#1B4332] px-6 py-3 rounded-2xl font-bold text-sm hover:border-[#1B4332] transition-all active:scale-95">手动录入</button>
             </div>
             <button onClick={() => { if(confirm('清空产品库数据？')) { localStorage.removeItem(STORAGE_KEY_PRODUCTS); window.location.reload(); } }} className="text-red-300 hover:text-red-500 text-[10px] font-black flex items-center gap-1 transition-colors uppercase tracking-widest"><RefreshCcw size={12}/> Clear Data</button>
           </div>

           <div className="border border-[#E5E1D1] rounded-[32px] overflow-hidden bg-white shadow-inner flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead className="bg-[#FDFCF8] text-[10px] font-bold text-[#B08D57] border-b border-[#E5E1D1] sticky top-0 z-50 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">产品基本信息</th>
                    <th className="px-4 py-4">分类/规格/单位</th>
                    <th className="px-4 py-4 text-center">价格体系 (¥)</th>
                    <th className="px-4 py-4">素材CDN地址</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2E8]">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 flex gap-4 items-center">
                        <ProductImage src={p.image} name={p.name} className="w-14 h-14 rounded-xl object-cover border shadow-sm shrink-0" onHover={handleImageHover} />
                        <div className="flex-1">
                          <input className="font-bold text-[#1B4332] bg-transparent outline-none w-full text-sm" value={p.name} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} />
                          <input className="text-[10px] font-mono text-gray-300 bg-transparent outline-none w-full mt-1 font-bold" value={p.sku} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, sku: e.target.value} : x))} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <input className="text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/5 rounded px-2 py-1 outline-none border border-transparent focus:border-[#1B4332]/20" placeholder="分类" value={p.category} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, category: e.target.value} : x))} />
                          <div className="flex gap-2">
                            <input className="flex-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded px-2 py-1 outline-none border border-transparent focus:border-gray-200" placeholder="规格" value={p.spec} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, spec: e.target.value} : x))} />
                            <input className="flex-1 text-[10px] font-bold text-[#B08D57] bg-[#B08D57]/5 rounded px-2 py-1 outline-none border border-transparent focus:border-[#B08D57]/20" placeholder="单位" value={p.unit} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, unit: e.target.value} : x))} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-4 justify-center">
                          <div className="text-center">
                             <span className="text-[8px] text-gray-300 font-black block mb-1 uppercase">PLATFORM</span>
                             <input type="number" className="bg-[#F9F7F2] rounded-xl px-2 py-1.5 border border-[#E5E1D1] w-24 text-xs font-black text-center focus:border-[#1B4332] outline-none" value={p.platformPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, platformPrice: Number(e.target.value)} : x))} />
                          </div>
                          <div className="text-center">
                             <span className="text-[8px] text-gray-300 font-black block mb-1 uppercase">CHANNEL</span>
                             <input type="number" className="bg-[#F9F7F2] rounded-xl px-2 py-1.5 border border-[#E5E1D1] w-24 text-xs font-black text-center focus:border-[#1B4332] outline-none" value={p.channelPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, channelPrice: Number(e.target.value)} : x))} />
                          </div>
                          <div className="text-center">
                             <span className="text-[8px] text-gray-300 font-black block mb-1 uppercase">RETAIL</span>
                             <input type="number" className="bg-[#F9F7F2] rounded-xl px-2 py-1.5 border border-[#E5E1D1] w-24 text-xs font-black text-center focus:border-[#1B4332] outline-none" value={p.retailPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, retailPrice: Number(e.target.value)} : x))} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        <input className="text-[9px] text-gray-400 bg-[#F9F7F2] rounded-lg px-2 py-1 outline-none border border-transparent focus:border-[#1B4332]/20 w-full font-mono" value={p.image} placeholder="CDN URL" onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, image: e.target.value} : x))} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-gray-200 hover:text-red-500 p-3 transition-all active:scale-75"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
         </div>
      </Modal>

      {/* 图片悬停大图预览 */}
      {hoveredImage && (
        <div 
          className="fixed z-[3000] pointer-events-none transition-opacity duration-200 shadow-2xl"
          style={{ 
            left: Math.min(hoveredImage.x + 20, window.innerWidth - 320), 
            top: Math.min(hoveredImage.y + 20, window.innerHeight - 320),
            width: '300px',
            height: '300px'
          }}
        >
          <div className="w-full h-full bg-white p-2 rounded-[32px] border border-[#E5E1D1] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <img 
              src={hoveredImage.url} 
              className="w-full h-full object-contain rounded-[24px]" 
              alt="Preview"
            />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Inter:wght@400;500;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #FDFCF8; -webkit-font-smoothing: antialiased; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        
        /* 针对筛选区的微调滚动条 */
        .scrollbar-thin::-webkit-scrollbar { height: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #E5E1D1; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
