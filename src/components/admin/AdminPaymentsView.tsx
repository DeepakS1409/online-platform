import React, { useState, useEffect } from 'react';
import { CreditCard, Search, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { db } from '../../services/db';
import { formatINR, formatDate } from '../../utils/formatters';
import { PaymentRecord, Order, PaymentMethod } from '../../types';

export const AdminPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const records = await db.getReports({ type: 'payments' });
      setPayments(records as any[]);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchesSearch = 
      p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (p.ref && p.ref.toLowerCase().includes(search.toLowerCase()));
    const matchesMethod = filterMethod ? p.method === filterMethod : true;
    return matchesSearch && matchesMethod;
  });

  const totalCollectedPaise = filtered.reduce((sum, p) => sum + p.amountPaise, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Payment Records & Collections
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manual settlement tracking for WhatsApp orders (UPI, Bank Transfer, COD, Cash)
          </p>
        </div>

        <div className="bg-white px-4 py-2.5 rounded-2xl border border-stone-200 shadow-2xs text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Filtered Collections Total
          </span>
          <span className="text-lg font-bold text-emerald-700 font-sans">
            {formatINR(totalCollectedPaise)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer name, or UTR / reference..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
        >
          <option value="">All Payment Methods</option>
          <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
          <option value="bank_transfer">Bank Transfer / NEFT</option>
          <option value="cod">Cash on Delivery</option>
          <option value="cash">Direct Cash</option>
        </select>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount Received</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction Ref / UTR</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">Loading payment entries...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">No payment records found.</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 text-stone-500 font-mono">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      #{p.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 font-sans">
                      {formatINR(p.amountPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                      {p.ref || '—'}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px] max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
