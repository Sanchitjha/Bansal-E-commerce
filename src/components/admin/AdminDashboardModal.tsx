'use client';

import React, { useState } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Tag,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  History,
  Settings,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Users,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Save,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product, OrderStatus, BulkEnquiryStatus, CategoryType, Coupon, HeroBanner } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const {
    products,
    orders,
    bulkEnquiries,
    coupons,
    heroBanners,
    activityLogs,
    sheetSyncLogs,
    settings,
    saveProduct,
    deleteProduct,
    updateHeroBanners,
    reorderPriorityProducts,
    updateOrderStatus,
    updateEnquiryStatus,
    saveCoupon,
    toggleCouponStatus,
    addStockAdjustment,
  } = useLuminary();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'priority' | 'orders' | 'bulk' | 'coupons' | 'sheets' | 'tax' | 'inventory' | 'activity'
  >('overview');

  // Add/Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Calculate High Level Metrics
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Pending Payment').length;
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  // Sales chart data
  const chartData = [
    { name: 'Mon', Sales: 18400 },
    { name: 'Tue', Sales: 24200 },
    { name: 'Wed', Sales: 31000 },
    { name: 'Thu', Sales: 28900 },
    { name: 'Fri', Sales: 42500 },
    { name: 'Sat', Sales: 58000 },
    { name: 'Sun', Sales: 49000 },
  ];

  // Handle save new / edit product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.sku) return;

    const fullProd: Product = {
      id: editingProduct.id || `prod-${Date.now()}`,
      name: editingProduct.name,
      sku: editingProduct.sku,
      category: (editingProduct.category || 'fragrance') as CategoryType,
      subcategory: editingProduct.subcategory || 'General',
      brand: editingProduct.brand || 'Luminary Signature',
      shortDescription: editingProduct.shortDescription || '',
      longDescription: editingProduct.longDescription || '',
      images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'],
      mrp: Number(editingProduct.mrp) || 1999,
      sellingPrice: Number(editingProduct.sellingPrice) || 1299,
      costPrice: Number(editingProduct.costPrice) || 500,
      discountPercent: Math.round(((Number(editingProduct.mrp) - Number(editingProduct.sellingPrice)) / Number(editingProduct.mrp)) * 100) || 0,
      gstRate: Number(editingProduct.gstRate) || 18,
      hsnCode: editingProduct.hsnCode || '33030010',
      stock: Number(editingProduct.stock) || 20,
      lowStockThreshold: Number(editingProduct.lowStockThreshold) || 10,
      weightKg: Number(editingProduct.weightKg) || 0.3,
      status: 'active',
      isFeatured: Boolean(editingProduct.isFeatured),
      isBestSeller: Boolean(editingProduct.isBestSeller),
      isNewArrival: Boolean(editingProduct.isNewArrival),
      isHomepagePriority: Boolean(editingProduct.isHomepagePriority),
      priorityOrder: Number(editingProduct.priorityOrder) || 99,
      isBulkAvailable: true,
      bulkSlabs: editingProduct.bulkSlabs || [
        { minQty: 1, pricePerUnit: Number(editingProduct.sellingPrice) || 1299 },
        { minQty: 5, pricePerUnit: Math.round(Number(editingProduct.sellingPrice) * 0.9) },
        { minQty: 10, pricePerUnit: Math.round(Number(editingProduct.sellingPrice) * 0.8) },
      ],
      rating: 5.0,
      reviewsCount: 1,
      urlSlug: (editingProduct.name || 'product').toLowerCase().replace(/\s+/g, '-'),
      createdAt: editingProduct.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    saveProduct(fullProd);
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const exportCSV = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-obsidian-900 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-100 my-4 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-obsidian-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 to-amber-200 p-[1px] shadow-gold-glow">
              <div className="w-full h-full bg-obsidian-950 rounded-xl flex items-center justify-center font-bold text-gold-400 text-xs">
                ADMIN
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-slate-100">
                  LUMINARY MASTER ADMIN CONTROL PANEL
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full dynamic management of products, priority merchandising, bulk quotes & tax reports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-gold-300 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation Menu Bar */}
        <div className="bg-obsidian-950/80 border-b border-slate-800 px-4 flex items-center space-x-1 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products Catalog', icon: Package },
            { id: 'priority', label: 'Homepage Priority', icon: TrendingUp },
            { id: 'orders', label: 'Orders & Shipping', icon: ShoppingBag, count: pendingOrdersCount },
            { id: 'bulk', label: 'Bulk Enquiries', icon: Layers, count: bulkEnquiries.filter((b) => b.status === 'New').length },
            { id: 'coupons', label: 'Coupons & Campaigns', icon: Tag },
            { id: 'sheets', label: 'Google Sheets Sync', icon: FileSpreadsheet },
            { id: 'tax', label: 'Tax & Reports', icon: FileText },
            { id: 'inventory', label: 'Inventory & Alerts', icon: AlertTriangle, count: lowStockProducts.length },
            { id: 'activity', label: 'Activity Log', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                  isActive
                    ? 'border-gold-400 text-gold-400 font-bold bg-gold-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-obsidian-950 border border-gold-500/20 shadow-sm">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-gold-300">
                      ₹{totalSalesRevenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">+18.4%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Real-time store gross sales</span>
                </div>

                <div className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Orders</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-slate-100">
                      {totalOrdersCount}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">{pendingOrdersCount} Pending</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Unique order reference IDs</span>
                </div>

                <div className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">B2B Bulk Enquiries</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-amber-400">
                      {bulkEnquiries.length}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Active Pipeline</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Corporate quotes requested</span>
                </div>

                <div className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Low Stock Alerts</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-rose-400">
                      {lowStockProducts.length}
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold">Threshold &lt; 10</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Requires stock entry</span>
                </div>
              </div>

              {/* Sales Graphical Report */}
              <div className="p-6 rounded-2xl bg-obsidian-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-100">Sales Graphical Performance</h3>
                    <p className="text-xs text-slate-400">Daily sales revenue trends across product divisions</p>
                  </div>
                  <span className="text-xs text-gold-400 font-mono font-bold">PDF Section 14 Requirement</span>
                </div>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#212534" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0c0d12', borderColor: '#d4af37' }} />
                      <Bar dataKey="Sales" fill="#d4af37" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Sales Split (PDF Section 15 Requirement) */}
              <div className="p-6 rounded-2xl bg-obsidian-950 border border-slate-800 space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-100">
                  Category Reporting & Revenue Share
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800 text-center">
                    <span className="text-xs text-amber-400 font-bold block uppercase">Fragrances</span>
                    <span className="font-mono text-2xl font-bold text-gold-300">52%</span>
                    <span className="text-[10px] text-slate-500 block">Perfumes & Attars</span>
                  </div>
                  <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800 text-center">
                    <span className="text-xs text-emerald-400 font-bold block uppercase">Ayurvedic</span>
                    <span className="font-mono text-2xl font-bold text-emerald-300">28%</span>
                    <span className="text-[10px] text-slate-500 block">Kumkumadi & Oils</span>
                  </div>
                  <div className="p-4 rounded-xl bg-obsidian-900 border border-slate-800 text-center">
                    <span className="text-xs text-sky-400 font-bold block uppercase">Mini Gadgets</span>
                    <span className="font-mono text-2xl font-bold text-sky-300">20%</span>
                    <span className="text-[10px] text-slate-500 block">Diffusers & Atomizers</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGER & ADD PRODUCT FLOW */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-100">Store Products Inventory</h3>
                  <p className="text-xs text-slate-400">Add, edit prices, manage stock, and set bulk pricing slabs</p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({});
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 rounded-xl gold-gradient-bg text-obsidian-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center gap-1.5 hover:scale-105 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ADD NEW PRODUCT</span>
                </button>
              </div>

              {/* Product List Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-obsidian-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-obsidian-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">SKU / Division</th>
                      <th className="p-3">Selling Price</th>
                      <th className="p-3">Cost Price (Hidden)</th>
                      <th className="p-3">Stock Level</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-obsidian-900/50 transition">
                        <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                          <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-slate-800" />
                          <span className="truncate max-w-[200px]">{prod.name}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <div>{prod.sku}</div>
                          <span className="text-[10px] text-gold-400 uppercase">{prod.category}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-gold-300">
                          ₹{prod.sellingPrice} <span className="text-[10px] text-slate-500 line-through">₹{prod.mrp}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          ₹{prod.costPrice} <span className="text-[9px] text-emerald-400 block">Margin: {Math.round(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100)}%</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            prod.stock <= prod.lowStockThreshold ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {prod.stock} units
                          </span>
                        </td>
                        <td className="p-3">
                          {prod.isHomepagePriority ? (
                            <span className="px-2 py-0.5 rounded bg-gold-500 text-obsidian-950 font-bold text-[10px]">
                              Priority #{prod.priorityOrder}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Standard</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-gold-500 hover:text-obsidian-950 text-slate-300 transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HOMEPAGE PRIORITY SYSTEM & HERO BANNER MANAGER */}
          {activeTab === 'priority' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-obsidian-950 border border-gold-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-gold-400">
                      Homepage Priority Products Manager (PDF Section 38)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Reorder position 1 to 5 priority products that render dynamically on the homepage
                    </p>
                  </div>
                  <span className="text-xs text-gold-300 font-mono font-bold">5 Items Max</span>
                </div>

                <div className="space-y-2">
                  {products
                    .filter((p) => p.isHomepagePriority)
                    .sort((a, b) => a.priorityOrder - b.priorityOrder)
                    .map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl bg-obsidian-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-gold-400 bg-obsidian-950 px-2 py-1 rounded">
                            Position #{idx + 1}
                          </span>
                          <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="font-semibold text-slate-200">{prod.name}</span>
                        </div>
                        <span className="font-mono text-gold-300">₹{prod.sellingPrice}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS & DISPATCH STATUS WORKFLOW */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-100">Order Management & Fulfillment</h3>
                  <p className="text-xs text-slate-400">Update order workflow status, courier name & tracking number</p>
                </div>
                <button
                  onClick={() =>
                    exportCSV(
                      'Luminary_Sales_Register.csv',
                      [['Order ID', 'Date', 'Customer', 'Phone', 'Total', 'Payment', 'Status']],
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-obsidian-950 border border-slate-700 text-xs font-semibold text-gold-300 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Sales Register CSV</span>
                </button>
              </div>

              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-mono font-bold text-gold-300 text-sm">{ord.id}</span>
                        <span className="text-xs text-slate-400 ml-3">{ord.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Status:</span>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2 py-1 text-xs bg-obsidian-900 border border-gold-500/40 rounded text-gold-300 font-bold outline-none"
                        >
                          {[
                            'Pending Payment',
                            'Payment Confirmed',
                            'Processing',
                            'Packed',
                            'Shipped',
                            'Out for Delivery',
                            'Delivered',
                            'Cancelled',
                            'Refunded',
                          ].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Customer</span>
                        <strong className="text-slate-100">{ord.customerName}</strong>
                        <span className="block text-[11px] text-slate-400">{ord.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Shipping Address</span>
                        <span className="text-slate-300">{ord.shippingAddress}, {ord.city}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Amount</span>
                        <strong className="font-mono text-gold-300 text-sm">₹{ord.totalAmount}</strong>
                        <span className="block text-[10px] text-slate-400">{ord.paymentMethod} ({ord.paymentStatus})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BULK ENQUIRIES PIPELINE */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-slate-100">B2B Wholesale Enquiries Pipeline</h3>

              <div className="space-y-3">
                {bulkEnquiries.map((enq) => (
                  <div key={enq.id} className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-mono font-bold text-amber-400 text-xs">{enq.id}</span>
                        <h5 className="font-bold text-slate-100 text-sm inline-block ml-3">
                          {enq.company || enq.name}
                        </h5>
                      </div>
                      <select
                        value={enq.status}
                        onChange={(e) => updateEnquiryStatus(enq.id, e.target.value as BulkEnquiryStatus)}
                        className="px-2 py-1 text-xs bg-obsidian-900 border border-amber-500/40 text-amber-300 font-bold rounded outline-none"
                      >
                        {['New', 'Contacted', 'Quotation Sent', 'Negotiation', 'Confirmed', 'Rejected', 'Completed'].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Contact Person</span>
                        <span>{enq.name} ({enq.mobile})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Requested Product</span>
                        <span className="font-semibold text-slate-200">{enq.productName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Quantity</span>
                        <span className="font-mono font-bold text-gold-300">{enq.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Expected Date</span>
                        <span>{enq.expectedDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: GOOGLE SHEETS LIVE SYNC LOG AUDIT */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-100">
                    Google Sheets Synchronization Log (PDF Section 20 Requirement)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mandatory synchronization of sales register, product sales & monthly summaries
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
                  Auto-Sync Enabled ✓
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-obsidian-950 p-4 space-y-2">
                {sheetSyncLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-obsidian-900 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 font-bold text-[10px]">
                        {log.sheetName}
                      </span>
                      <span className="text-slate-300">{log.event}</span>
                    </div>
                    <span className="text-slate-500">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: TAX & ACCOUNTING REPORTS */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-100">Tax & Accounting Report (PDF Section 21)</h3>
                  <p className="text-xs text-slate-400">Configurable GST breakdown (CGST, SGST, IGST) export</p>
                </div>
                <button
                  onClick={() => exportCSV('Luminary_Tax_Report.csv', [['Order ID', 'Taxable', 'GST Amount', 'CGST', 'SGST', 'IGST']])}
                  className="px-3 py-1.5 rounded-lg gold-gradient-bg text-obsidian-950 font-bold text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Tax CSV</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-obsidian-950">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-obsidian-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Taxable Value</th>
                      <th className="p-3">GST Total</th>
                      <th className="p-3">CGST</th>
                      <th className="p-3">SGST</th>
                      <th className="p-3">IGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800/60">
                        <td className="p-3 text-gold-300 font-bold">{o.id}</td>
                        <td className="p-3">₹{o.taxableAmount}</td>
                        <td className="p-3 text-emerald-400">₹{o.gstAmount}</td>
                        <td className="p-3">₹{o.cgst}</td>
                        <td className="p-3">₹{o.sgst}</td>
                        <td className="p-3">₹{o.igst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-slate-100">Admin Activity Audit Log (PDF Section 30)</h3>
              <div className="space-y-2">
                {activityLogs.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-obsidian-950 border border-slate-800 text-xs flex justify-between">
                    <div>
                      <strong className="text-gold-400">{act.adminName}:</strong> <span className="text-slate-200">{act.action}</span>
                      {act.details && <p className="text-[11px] text-slate-400">{act.details}</p>}
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{act.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-obsidian-900 border border-gold-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-gold-400">
                {editingProduct?.id ? 'Edit Product' : '+ Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category *</label>
                  <select
                    value={editingProduct?.category || 'fragrance'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100"
                  >
                    <option value="fragrance">Fragrances</option>
                    <option value="ayurvedic">Ayurvedic</option>
                    <option value="gadgets">Mini Gadgets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editingProduct?.subcategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingProduct?.brand || 'Luminary Signature'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={editingProduct?.mrp || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mrp: Number(e.target.value) })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct?.sellingPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-rose-400">Cost Price (Hidden)</label>
                  <input
                    type="number"
                    value={editingProduct?.costPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-obsidian-950 border border-rose-900 rounded text-rose-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={editingProduct?.stock || 20}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={editingProduct?.gstRate || 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gstRate: Number(e.target.value) })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={editingProduct?.hsnCode || '33030010'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                    className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingProduct?.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  className="w-full p-2 bg-obsidian-950 border border-slate-800 rounded text-slate-100"
                />
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-gold-300 font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct?.isHomepagePriority)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isHomepagePriority: e.target.checked })}
                    className="accent-gold-400"
                  />
                  <span>Set as Homepage Priority Product</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gold-gradient-bg text-obsidian-950 font-bold text-xs uppercase shadow-gold-glow"
              >
                SAVE PRODUCT TO DATABASE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
