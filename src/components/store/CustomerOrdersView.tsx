import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, AlertTriangle, Truck, ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { db } from '../../services/db';
import { formatINR, formatDate, generateWhatsAppUrl } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface CustomerOrdersViewProps {
  onBackToStore: () => void;
}

const STATUS_STEPS: OrderStatus[] = [
  'awaiting_confirmation',
  'accepted',
  'preparing',
  'ready_to_ship',
  'shipped',
  'delivered'
];

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  awaiting_confirmation: { label: 'Awaiting Confirmation', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted: { label: 'Accepted by Boutique', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  preparing: { label: 'Tailoring & Packing', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  ready_to_ship: { label: 'Ready for Dispatch', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  shipped: { label: 'Dispatched & On the Way', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ onBackToStore }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState(user?.phone || '');
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  const fetchOrders = async (phoneToSearch?: string) => {
    setLoading(true);
    try {
      const q = phoneToSearch || searchPhone;
      const res = await db.getOrders({
        limit: 50,
        search: q || undefined
      });
      setOrders(res.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    db.getBusinessSettings().then(setBusinessSettings);
    fetchOrders(user?.phone);
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchPhone);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Storefront
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Track My Orders & Delivery Status
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time status tracking for orders placed at V2 Boutique
          </p>
        </div>

        {/* Lookup by Phone */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="Enter mobile number"
            className="px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:border-rose-600 shadow-inner"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 text-xs">Loading order records...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3 shadow-xs">
          <Package className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-stone-800">
            No orders found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            We couldn't find any orders matching {searchPhone ? `"${searchPhone}"` : 'your account'}. Please place an order or double check your mobile number.
          </p>
          <button
            onClick={onBackToStore}
            className="px-5 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800 mt-2"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.order_status] || { label: order.order_status, color: 'bg-stone-100 text-stone-800 border-stone-200' };
            const isCancelled = order.order_status === 'cancelled';
            const isRejected = order.order_status === 'rejected';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-900">
                        #{order.order_number}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">Grand Total</span>
                    <span className="text-base font-bold text-stone-900">
                      {formatINR(order.grand_total_paise)}
                    </span>
                  </div>
                </div>

                {/* Status Timeline Step Indicator (if active) */}
                {!isCancelled && !isRejected && (
                  <div className="px-5 py-4 border-b border-stone-100 bg-white">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-stone-200 z-0"></div>
                      {STATUS_STEPS.map((step, idx) => {
                        const currentIdx = STATUS_STEPS.indexOf(order.order_status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                isCompleted
                                  ? 'bg-rose-700 text-white ring-4 ring-rose-50'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 hidden sm:block ${isCurrent ? 'font-bold text-rose-800' : 'text-stone-400'}`}>
                              {STATUS_LABELS[step]?.label?.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Ordered Dresses
                  </h4>
                  <div className="divide-y divide-stone-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-stone-800">{item.product_name_snapshot}</p>
                          <p className="text-[11px] text-stone-400 font-mono">
                            SKU: {item.sku_snapshot} • Qty: {item.quantity} × {formatINR(item.unit_price_paise)}
                          </p>
                        </div>
                        <span className="font-semibold text-stone-900">
                          {formatINR(item.item_total_paise)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address & WhatsApp Support Button */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50 p-3 rounded-xl">
                    <div className="text-xs text-stone-600">
                      <span className="font-semibold text-stone-800 block mb-0.5">Delivery Address:</span>
                      <p className="line-clamp-1">
                        {order.delivery_address_snapshot.recipient_name}, {order.delivery_address_snapshot.address_line1}, {order.delivery_address_snapshot.city} - {order.delivery_address_snapshot.postal_code}
                      </p>
                    </div>

                    {businessSettings && (
                      <a
                        href={generateWhatsAppUrl(order, businessSettings)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
