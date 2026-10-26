import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, ShoppingBag, Eye, X } from 'lucide-react';
import { db } from '../../services/db';
import { formatINR, formatDate } from '../../utils/formatters';
import { Order } from '../../types';

export const AdminCustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await db.getCustomers({ search: search || undefined });
      setCustomers(res.data);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Customer Accounts & Loyalty Directory
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          View registered customer profiles, lifetime purchase value, and outstanding balances
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="max-w-md relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-hidden focus:bg-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">City / Region</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Paid Collected</th>
                <th className="py-3 px-4">Outstanding Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">No customers found.</td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {c.address?.city || '—'}, {c.address?.state || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold">
                        {c.totalOrders}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {formatINR(c.totalSpentPaise)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {formatINR(c.totalPaidPaise)}
                    </td>
                    <td className="py-3 px-4">
                      {c.outstandingBalancePaise > 0 ? (
                        <span className="font-bold text-amber-700">
                          {formatINR(c.outstandingBalancePaise)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Clear</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        Orders ({c.orders.length})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {selectedCustomer.name}'s Orders
                </h3>
                <p className="text-xs text-stone-400 font-mono">Phone: {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {selectedCustomer.orders.map((o: Order) => (
                <div key={o.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-stone-900 block">#{o.order_number}</span>
                    <span className="text-[11px] text-stone-400">{formatDate(o.created_at)}</span>
                    <span className="text-[10px] uppercase font-bold text-stone-600 block mt-0.5">
                      Status: {o.order_status} • Payment: {o.payment_status}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900">
                    {formatINR(o.grand_total_paise)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
