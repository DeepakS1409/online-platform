import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Boxes, Package, CreditCard, Users } from 'lucide-react';
import { db } from '../../services/db';
import { formatINR, formatDate } from '../../utils/formatters';

type ReportType = 'product' | 'category' | 'date' | 'customer' | 'payments' | 'inventory' | 'profit';

export const AdminReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('product');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await db.getReports({ type: reportType, dateFilter });
      setData(res);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, dateFilter]);

  const exportCsv = () => {
    if (!data) return;
    let csvContent = '';

    if (reportType === 'product') {
      csvContent = 'Product Name,SKU,Category,Units Sold,Gross Sales (INR)\n' +
        data.map((r: any) => `"${r.productName}","${r.sku}","${r.categoryName}",${r.unitsSold},${(r.grossSalesPaise / 100).toFixed(2)}`).join('\n');
    } else if (reportType === 'category') {
      csvContent = 'Category,Units Sold,Total Sales (INR)\n' +
        data.map((r: any) => `"${r.categoryName}",${r.unitsSold},${(r.totalSalesPaise / 100).toFixed(2)}`).join('\n');
    } else if (reportType === 'date') {
      csvContent = 'Date,Orders Created,Orders Accepted,Orders Cancelled,Sales Value (INR),Payments Received (INR)\n' +
        data.map((r: any) => `"${r.date}",${r.created},${r.accepted},${r.cancelled},${(r.salesPaise / 100).toFixed(2)},${(r.receivedPaise / 100).toFixed(2)}`).join('\n');
    } else if (reportType === 'inventory') {
      csvContent = 'Product Name,SKU,Category,Physical Stock,Reserved Stock,Available Stock,Units Sold,Status\n' +
        data.map((r: any) => `"${r.name}","${r.sku}","${r.categoryName}",${r.physicalStock},${r.reservedStock},${r.availableStock},${r.unitsSold},"${r.status}"`).join('\n');
    } else if (reportType === 'payments') {
      csvContent = 'Date,Order Number,Customer Name,Amount Received (INR),Method,Reference\n' +
        data.map((r: any) => `"${r.paymentDate}","${r.orderNumber}","${r.customerName}",${(r.amountPaise / 100).toFixed(2)},"${r.method}","${r.ref || ''}"`).join('\n');
    } else if (reportType === 'profit') {
      csvContent = 'Metric,Value (INR)\n' +
        `Total Sales,${(data.totalSalesPaise / 100).toFixed(2)}\n` +
        `Product Purchase Cost,${(data.totalPurchaseCostPaise / 100).toFixed(2)}\n` +
        `Packaging Expenses,${(data.totalPackagingCostPaise / 100).toFixed(2)}\n` +
        `Estimated Profit,${(data.estimatedProfitPaise / 100).toFixed(2)}\n` +
        `Profit Margin Percent,${data.profitMarginPercent}%\n` +
        `Units Sold,${data.unitsSold}\n` +
        `Order Count,${data.orderCount}`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `V2_Report_${reportType}_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: Array<{ id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'product', label: 'Product-wise', icon: Package },
    { id: 'category', label: 'Category-wise', icon: BarChart3 },
    { id: 'date', label: 'Date-wise', icon: Calendar },
    { id: 'inventory', label: 'Inventory Health', icon: Boxes },
    { id: 'payments', label: 'Payment Audit', icon: CreditCard },
    { id: 'profit', label: 'Profit Estimate', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header and CSV Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Sales, Inventory & Profit Reports
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Aggregated from actual database orders, unit price snapshots, and expense figures
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-rose-400" />
          <span>Export Active Report (CSV)</span>
        </button>
      </div>

      {/* Tabs & Date Filters */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Report Types */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        {reportType !== 'inventory' && (
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['today', 'yesterday', 'week', 'month'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1 rounded-lg capitalize transition-all font-medium ${
                  dateFilter === d ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {d === 'week' ? 'This Week' : d === 'month' ? 'This Month' : d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Report Render Body */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Compiling database report...</div>
        ) : !data ? (
          <div className="p-8 text-center text-stone-400 text-xs">No records found.</div>
        ) : reportType === 'profit' ? (
          /* PROFIT ESTIMATION VIEW */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Gross Profit & Expense Analysis
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Calculated strictly as: Gross Dress Sales − Purchase Costs − Packaging Expenses
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Gross Item Sales
                </span>
                <span className="text-2xl font-bold text-stone-900 font-sans">
                  {formatINR(data.totalSalesPaise)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Across {data.orderCount} valid orders ({data.unitsSold} units)
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Dresses Purchase Cost
                </span>
                <span className="text-2xl font-bold text-stone-700 font-sans">
                  {formatINR(data.totalPurchaseCostPaise)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Cost of goods sold (COGS)
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Packaging Expenses
                </span>
                <span className="text-2xl font-bold text-stone-700 font-sans">
                  {formatINR(data.totalPackagingCostPaise)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Pouches, boxes, and tags
                </span>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                  Estimated Gross Profit
                </span>
                <span className="text-2xl font-bold text-rose-900 font-sans">
                  {formatINR(data.estimatedProfitPaise)}
                </span>
                <span className="text-[11px] text-rose-700 font-bold block mt-1">
                  {data.profitMarginPercent}% Margin on sales
                </span>
              </div>
            </div>
          </div>
        ) : reportType === 'product' ? (
          /* PRODUCT REPORT */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Sales Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-semibold text-stone-900">{r.productName}</td>
                    <td className="py-3 px-4 font-mono text-stone-500">{r.sku}</td>
                    <td className="py-3 px-4 text-stone-600">{r.categoryName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">{r.unitsSold}</td>
                    <td className="py-3 px-4 text-right font-bold text-stone-950 font-sans">{formatINR(r.grossSalesPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === 'category' ? (
          /* CATEGORY REPORT */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Total Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Sales Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-semibold text-stone-900">{r.categoryName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">{r.unitsSold}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-800 font-sans">{formatINR(r.totalSalesPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === 'date' ? (
          /* DATE REPORT */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Orders Created</th>
                  <th className="py-3 px-4 text-center">Orders Accepted</th>
                  <th className="py-3 px-4 text-center">Orders Cancelled</th>
                  <th className="py-3 px-4 text-right">Order Sales Value</th>
                  <th className="py-3 px-4 text-right">Payments Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-stone-900">{r.date}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.created}</td>
                    <td className="py-3 px-4 text-center font-mono text-blue-700">{r.accepted}</td>
                    <td className="py-3 px-4 text-center font-mono text-rose-600">{r.cancelled}</td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900">{formatINR(r.salesPaise)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatINR(r.receivedPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === 'inventory' ? (
          /* INVENTORY REPORT */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Physical Stock</th>
                  <th className="py-3 px-4 text-center">Reserved Stock</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-900 block">{r.name}</span>
                      <span className="font-mono text-[11px] text-stone-400">SKU: {r.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{r.categoryName}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.physicalStock}</td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700">{r.reservedStock}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{r.availableStock}</td>
                    <td className="py-3 px-4 text-center font-mono text-stone-500">{r.unitsSold}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'Out of Stock'
                          ? 'bg-rose-100 text-rose-800'
                          : r.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* PAYMENTS REPORT */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono text-stone-500">{formatDate(r.paymentDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">#{r.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-stone-800">{r.customerName}</td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px]">{r.method}</td>
                    <td className="py-3 px-4 font-mono text-stone-500">{r.ref || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatINR(r.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
