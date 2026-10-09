'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Tag,
  FileText,
  AlertTriangle,
  History,
  Settings as SettingsIcon,
  TrendingUp,
  ClipboardList,
  Video,
  Star,
  LogOut,
  Lock,
} from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { OverviewTab } from './tabs/OverviewTab';
import { ProductsTab } from './tabs/ProductsTab';
import { MerchandisingTab } from './tabs/MerchandisingTab';
import { OrdersTab } from './tabs/OrdersTab';
import { BulkTab } from './tabs/BulkTab';
import { CouponsTab } from './tabs/CouponsTab';
import { InventoryTab } from './tabs/InventoryTab';
import { TaxTab } from './tabs/TaxTab';
import { ActivityTab, OrderLogTab } from './tabs/LogsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { VideosTab } from './tabs/VideosTab';
import { ReviewsTab } from './tabs/ReviewsTab';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'overview' | 'products' | 'merch' | 'videos' | 'reviews' | 'orders' | 'bulk' | 'coupons' | 'inventory' | 'tax' | 'activity' | 'orderlog' | 'settings';

const AdminLoginForm: React.FC = () => {
  const { adminLogin } = useLuminary();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const res = await adminLogin(email, password);
    setIsSubmitting(false);
    if (!res.success) setError(res.message || 'Login failed');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-100">Admin sign in</h3>
          <p className="text-xs text-slate-400">Enter your admin credentials to manage the store</p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Email</label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-obsidian-950 border border-slate-800 focus:border-gold-500 rounded-xl text-slate-100 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-obsidian-950 border border-slate-800 focus:border-gold-500 rounded-xl text-slate-100 outline-none"
          />
        </div>

        {error && <p className="text-[11px] text-rose-400 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl gold-gradient-bg text-obsidian-950 font-bold text-xs uppercase tracking-wider disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { orders, bulkEnquiries, adminProducts, adminSession, adminAuthChecked, adminLogout, refreshAdminData } = useLuminary();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (isOpen && adminSession) {
      refreshAdminData().catch(() => {});
    }
  }, [isOpen, adminSession, refreshAdminData]);

  if (!isOpen) return null;

  const openOrders = orders.filter((o) => ['Payment Confirmed', 'Processing', 'Packed'].includes(o.orderStatus)).length;
  const newEnquiries = bulkEnquiries.filter((b) => b.status === 'New').length;
  const lowStock = adminProducts.filter((p) => p.status === 'active' && p.stock <= p.lowStockThreshold).length;

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'merch', label: 'Homepage', icon: TrendingUp },
    { id: 'videos', label: 'Creator videos', icon: Video },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: openOrders },
    { id: 'bulk', label: 'Bulk enquiries', icon: Layers, count: newEnquiries },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'inventory', label: 'Inventory', icon: AlertTriangle, count: lowStock },
    { id: 'tax', label: 'GST report', icon: FileText },
    { id: 'activity', label: 'Activity', icon: History },
    { id: 'orderlog', label: 'Order log', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-obsidian-900 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-100 my-4 flex flex-col max-h-[92vh]">
        <div className="p-4 sm:p-6 bg-obsidian-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 to-amber-200 p-[1px]">
              <div className="w-full h-full bg-obsidian-950 rounded-xl flex items-center justify-center font-bold text-gold-400 text-xs">ADMIN</div>
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-100">Store admin</h2>
              <p className="text-xs text-slate-400">{adminSession ? `Signed in as ${adminSession.email}` : 'Sign in to manage the store'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminSession && (
              <button
                onClick={() => adminLogout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-900 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition text-xs font-bold"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-gold-300 transition" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {!adminAuthChecked ? (
          <div className="flex-1 flex items-center justify-center p-10 text-slate-400 text-sm">Checking admin session…</div>
        ) : !adminSession ? (
          <AdminLoginForm />
        ) : (
          <>
            <div className="bg-obsidian-950/80 border-b border-slate-800 px-4 flex items-center space-x-1 overflow-x-auto text-xs font-semibold shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                      isActive ? 'border-gold-400 text-gold-400 font-bold bg-gold-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'products' && <ProductsTab />}
              {activeTab === 'merch' && <MerchandisingTab />}
              {activeTab === 'videos' && <VideosTab />}
              {activeTab === 'reviews' && <ReviewsTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'bulk' && <BulkTab />}
              {activeTab === 'coupons' && <CouponsTab />}
              {activeTab === 'inventory' && <InventoryTab />}
              {activeTab === 'tax' && <TaxTab />}
              {activeTab === 'activity' && <ActivityTab />}
              {activeTab === 'orderlog' && <OrderLogTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
