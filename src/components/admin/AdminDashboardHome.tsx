import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  IndianRupee, 
  TrendingUp, 
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { db } from '../../services/db';
import { formatINR } from '../../utils/formatters';
import { AdminTab } from './AdminSidebar';

interface AdminDashboardHomeProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ onNavigateTab }) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('month');
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    activeProducts: 0,
    inactiveProducts: 0,
    inStockProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalOrderValuePaise: 0,
    totalPaymentsReceivedPaise: 0,
    outstandingBalancePaise: 0,
    estimatedProfitPaise: 0,
    profitMarginPercent: '0.0',
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProductsRes, ordersRes, customersRes, profitRes] = await Promise.all([
        db.getProducts({ limit: 1000, activeOnly: false }),
        db.getOrders({ limit: 1000, dateFilter }),
        db.getCustomers({ limit: 1000 }),
        db.getReports({ type: 'profit', dateFilter })
      ]);

      const products = allProductsRes.data;
      const orders = ordersRes.data;
      const customers = customersRes.data;

      // Product metrics
      const active = products.filter(p => p.is_active).length;
      const inactive = products.length - active;
      const outOfStock = products.filter(p => p.available_stock <= 0).length;
      const lowStock = products.filter(p => p.available_stock > 0 && p.available_stock <= p.low_stock_threshold).length;
      const inStock = products.length - outOfStock;

      // Order metrics
      const pending = orders.filter(o => o.order_status === 'awaiting_confirmation').length;
      const accepted = orders.filter(o => o.order_status === 'accepted').length;
      const shipped = orders.filter(o => o.order_status === 'shipped').length;
      const delivered = orders.filter(o => o.order_status === 'delivered').length;

      const validOrders = orders.filter(o => o.order_status !== 'cancelled');
      const totalOrderValue = validOrders.reduce((sum, o) => sum + o.grand_total_paise, 0);

      const totalReceived = orders.reduce((sum, o) => {
        const orderPaid = (o.payments || []).reduce((ps, p) => ps + p.amount_paise, 0);
        return sum + orderPaid;
      }, 0);

      const outstanding = Math.max(0, totalOrderValue - totalReceived);

      setMetrics({
        activeProducts: active,
        inactiveProducts: inactive,
        inStockProducts: inStock,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        pendingOrders: pending,
        acceptedOrders: accepted,
        shippedOrders: shipped,
        deliveredOrders: delivered,
        totalOrderValuePaise: totalOrderValue,
        totalPaymentsReceivedPaise: totalReceived,
        outstandingBalancePaise: outstanding,
        estimatedProfitPaise: (profitRes as any).estimatedProfitPaise || 0,
        profitMarginPercent: (profitRes as any).profitMarginPercent || '0.0',
      });

      setRecentOrders(orders.slice(0, 5));
      setLowStockList(products.filter(p => p.available_stock <= p.low_stock_threshold).slice(0, 5));
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Operations & Performance Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time business telemetry calculated directly from PostgreSQL records
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs text-xs font-medium">
          {(['today', 'yesterday', 'week', 'month'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                dateFilter === key
                  ? 'bg-stone-900 text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {key === 'week' ? 'This Week' : key === 'month' ? 'This Month' : key}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Order Value
            </span>
            <span className="p-2 bg-stone-100 text-stone-800 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-950 font-sans tracking-tight">
              {formatINR(metrics.totalOrderValuePaise)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Active confirmed order volume
            </p>
          </div>
        </div>

        {/* Payments Collected */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Payments Received
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-sans tracking-tight">
              {formatINR(metrics.totalPaymentsReceivedPaise)}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Verified manual payment collections
            </p>
          </div>
        </div>

        {/* Outstanding Payment Balance */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Outstanding Balances
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-800 font-sans tracking-tight">
              {formatINR(metrics.outstandingBalancePaise)}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              Awaiting WhatsApp settlement
            </p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Estimated Gross Profit
            </span>
            <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-800 font-sans tracking-tight">
              {formatINR(metrics.estimatedProfitPaise)}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Sales minus purchase & packaging costs ({metrics.profitMarginPercent}% margin)
            </p>
          </div>
        </div>

      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-stone-500 block mb-1">Total Orders</span>
          <span className="text-xl font-bold text-stone-900">{metrics.totalOrders}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-amber-700 font-semibold block mb-1">Pending Confirmation</span>
          <span className="text-xl font-bold text-amber-800">{metrics.pendingOrders}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-blue-700 font-semibold block mb-1">Accepted Orders</span>
          <span className="text-xl font-bold text-blue-800">{metrics.acceptedOrders}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-teal-700 font-semibold block mb-1">Dispatched (Shipped)</span>
          <span className="text-xl font-bold text-teal-800">{metrics.shippedOrders}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-stone-500 block mb-1">Unique Customers</span>
          <span className="text-xl font-bold text-stone-900">{metrics.totalCustomers}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
          <span className="text-xs text-rose-700 font-semibold block mb-1">Low / Zero Stock</span>
          <span className="text-xl font-bold text-rose-800">
            {metrics.lowStockProducts + metrics.outOfStockProducts}
          </span>
        </div>
      </div>

      {/* Lower Dual Tables: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-base font-bold text-stone-900">
              Recent Orders
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No orders recorded in this date range.</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-stone-900 block">
                      #{o.order_number}
                    </span>
                    <span className="text-stone-500">
                      {o.customer_name} • {o.items?.length || 0} items
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">
                      {formatINR(o.grand_total_paise)}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded-sm">
                      {o.order_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock & Re-Order Alerts</span>
            </h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {lowStockList.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">All products have healthy inventory levels.</p>
            ) : (
              lowStockList.map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-stone-900 block">{p.name}</span>
                    <span className="font-mono text-[11px] text-stone-400">SKU: {p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${p.available_stock === 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                      {p.available_stock} Available
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Threshold: {p.low_stock_threshold}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
