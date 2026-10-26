import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Printer, 
  CreditCard, 
  Truck, 
  Clock, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types';
import { db } from '../../services/db';
import { formatINR, formatDate, generateWhatsAppUrl } from '../../utils/formatters';
import { AdminShippingLabelModal } from './AdminShippingLabelModal';

export const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [orderForLabel, setOrderForLabel] = useState<Order | null>(null);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Cancel Reason Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [businessSettings, setBusinessSettings] = useState<any>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [res, settings] = await Promise.all([
        db.getOrders({
          page,
          limit: 15,
          search: search || undefined,
          status: (statusFilter as OrderStatus) || undefined,
          paymentStatus: (paymentFilter as PaymentStatus) || undefined
        }),
        db.getBusinessSettings()
      ]);
      setOrders(res.data);
      setTotalPages(res.totalPages);
      setTotalOrders(res.total);
      setBusinessSettings(settings);

      // Refresh currently selected order if open
      if (selectedOrder) {
        const fresh = res.data.find(o => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, search, statusFilter, paymentFilter]);

  const handleAccept = async (orderId: string) => {
    try {
      await db.acceptOrder(orderId, 'admin-001');
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus, note?: string) => {
    try {
      await db.updateOrderStatus(orderId, nextStatus, note, 'admin-001');
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedOrder) return;
    try {
      await db.cancelOrder(selectedOrder.id, cancelReason || 'Order cancelled by administrator', 'admin-001');
      setIsCancelModalOpen(false);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setPaymentError('');

    const val = parseFloat(paymentAmountRupees);
    if (isNaN(val) || val <= 0) {
      setPaymentError('Please enter a valid positive payment amount in ₹.');
      return;
    }

    try {
      await db.recordPayment({
        order_id: selectedOrder.id,
        amount_paise: Math.round(val * 100),
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        notes: paymentNotes,
        admin_id: 'admin-001'
      });
      setIsPaymentModalOpen(false);
      setPaymentAmountRupees('');
      setTransactionRef('');
      setPaymentNotes('');
      loadOrders();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment.');
    }
  };

  const openLabel = (order: Order) => {
    setOrderForLabel(order);
    setIsLabelModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Order Processing & Parcel Dispatch
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Review customer orders, accept reservations, generate shipping labels with secure QR codes, and record manual payments
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order number (V2-...), customer name, or phone..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
          >
            <option value="">All Order Statuses</option>
            <option value="awaiting_confirmation">Awaiting Confirmation</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="ready_to_ship">Ready to Ship</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
          >
            <option value="">All Payment Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">Loading order records...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">No matching orders found.</td>
                </tr>
              ) : (
                orders.map((o) => {
                  const totalPaid = (o.payments || []).reduce((sum, p) => sum + p.amount_paise, 0);
                  const outstanding = Math.max(0, o.grand_total_paise - totalPaid);

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900 block">
                          #{o.order_number}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {formatDate(o.created_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800 block">{o.customer_name}</span>
                        <span className="font-mono text-[11px] text-stone-400">{o.customer_phone}</span>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        <span className="font-medium text-stone-900 block">
                          {o.items?.length || 0} item(s)
                        </span>
                        <span className="text-[11px] text-stone-400 line-clamp-1">
                          {o.items?.map(i => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-stone-900">
                        {formatINR(o.grand_total_paise)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider block w-max ${
                          o.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.payment_status === 'partially_paid'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {o.payment_status.replace('_', ' ')}
                        </span>
                        {outstanding > 0 && o.order_status !== 'cancelled' && (
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            Due: {formatINR(outstanding)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          o.order_status === 'awaiting_confirmation'
                            ? 'bg-amber-100 text-amber-800'
                            : o.order_status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : o.order_status === 'shipped'
                            ? 'bg-teal-100 text-teal-800'
                            : o.order_status === 'cancelled'
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {o.order_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <span>Showing page {page} of {totalPages} ({totalOrders} total orders)</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-white border border-stone-200 rounded-md disabled:opacity-50 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-white border border-stone-200 rounded-md disabled:opacity-50 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details & Processing Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-100 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Top Bar */}
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-stone-900">
                    #{selectedOrder.order_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                    {selectedOrder.order_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Placed on {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Customer
                </span>
                <p className="font-semibold text-stone-900">{selectedOrder.customer_name}</p>
                <p className="font-mono text-stone-600">{selectedOrder.customer_phone}</p>
                {businessSettings && (
                  <a
                    href={generateWhatsAppUrl(selectedOrder, businessSettings)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold mt-2 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" /> Open in WhatsApp
                  </a>
                )}
              </div>

              <div>
                <span className="font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Delivery Destination
                </span>
                <p className="text-stone-700 leading-snug">
                  {selectedOrder.delivery_address_snapshot.recipient_name}<br />
                  {selectedOrder.delivery_address_snapshot.address_line1} {selectedOrder.delivery_address_snapshot.address_line2 || ''}<br />
                  {selectedOrder.delivery_address_snapshot.city}, {selectedOrder.delivery_address_snapshot.state} - {selectedOrder.delivery_address_snapshot.postal_code}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Order Items (Snapshots)
              </h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-900">{item.product_name_snapshot}</p>
                      <p className="text-[11px] font-mono text-stone-400">
                        SKU: {item.sku_snapshot} • {item.quantity} × {formatINR(item.unit_price_paise)}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 font-mono">
                      {formatINR(item.item_total_paise)}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-stone-50 space-y-1 text-right text-stone-600">
                  <div>Subtotal: <span className="font-semibold text-stone-900">{formatINR(selectedOrder.subtotal_paise)}</span></div>
                  <div>Delivery: <span className="font-semibold text-stone-900">{selectedOrder.delivery_charge_paise === 0 ? 'FREE' : formatINR(selectedOrder.delivery_charge_paise)}</span></div>
                  <div className="text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                    Grand Total: <span className="text-rose-800">{formatINR(selectedOrder.grand_total_paise)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary & Recording */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-800">Payment Status & Audit</span>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {selectedOrder.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-stone-200/60">
                      <div>
                        <span className="font-bold text-emerald-700">{formatINR(p.amount_paise)}</span> via <span className="uppercase font-semibold">{p.payment_method}</span>
                        {p.transaction_reference && <span className="text-stone-400 ml-1">({p.transaction_reference})</span>}
                      </div>
                      <span className="text-stone-400">{formatDate(p.payment_date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-center py-1">No payment entries recorded yet.</p>
              )}
            </div>

            {/* Status Transition Action Buttons */}
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                Workflow Actions
              </span>

              <div className="flex flex-wrap gap-2 text-xs">
                {selectedOrder.order_status === 'awaiting_confirmation' && (
                  <button
                    onClick={() => handleAccept(selectedOrder.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Accept Order
                  </button>
                )}

                {selectedOrder.order_status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing', 'Boutique started packaging')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Mark Preparing
                  </button>
                )}

                {selectedOrder.order_status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ready_to_ship', 'Parcel packed and ready for courier pickup')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Mark Ready to Ship
                  </button>
                )}

                {/* Print Shipping Label */}
                {['accepted', 'preparing', 'ready_to_ship', 'shipped'].includes(selectedOrder.order_status) && (
                  <button
                    onClick={() => openLabel(selectedOrder)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Shipping Label
                  </button>
                )}

                {/* Delivered */}
                {selectedOrder.order_status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered', 'Delivered to customer')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Mark Delivered
                  </button>
                )}

                {/* Cancel Order */}
                {!['cancelled', 'shipped', 'delivered'].includes(selectedOrder.order_status) && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl ml-auto cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Record Payment Sub-Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Record Manual Payment: #{selectedOrder.order_number}
            </h3>
            
            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Amount in INR (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(e.target.value)}
                  placeholder="e.g. 500.00"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="bank_transfer">Direct Bank / NEFT / IMPS</option>
                  <option value="cod">Cash on Delivery (Collected by Courier)</option>
                  <option value="cash">Direct Cash at Boutique</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Transaction Ref / UTR (Optional)</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref #4298104812"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 50% advance received via WhatsApp screenshot"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Sub-Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Confirm Order Cancellation
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cancelling order <strong>#{selectedOrder.order_number}</strong> will automatically release all reserved dresses back into public available stock.
            </p>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Cancellation Reason</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation / address unreachable"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg"
              >
                Release Stock & Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Shipping Label Modal */}
      {isLabelModalOpen && orderForLabel && (
        <AdminShippingLabelModal
          order={orderForLabel}
          onClose={() => {
            setIsLabelModalOpen(false);
            setOrderForLabel(null);
          }}
        />
      )}
    </div>
  );
};
