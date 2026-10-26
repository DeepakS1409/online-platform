import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle, History, ArrowUpDown, Plus, Minus, Edit3, X } from 'lucide-react';
import { db } from '../../services/db';
import { Product, InventoryMovement } from '../../types';
import { formatDate } from '../../utils/formatters';

export const AdminInventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHealth, setFilterHealth] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  // Stock Adjust Modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [newStockCount, setNewStockCount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Movements Audit History Modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await db.getProducts({ limit: 1000, activeOnly: false });
      setProducts(res.data);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjust = (p: Product) => {
    setAdjustProduct(p);
    setNewStockCount(p.stock_physical);
    setAdjustReason('Physical inventory recount');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    try {
      await db.adjustStock(adjustProduct.id, newStockCount, adjustReason);
      setAdjustProduct(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openHistory = async (p: Product) => {
    setHistoryProduct(p);
    setLoadingHistory(true);
    try {
      const list = await db.getInventoryMovements(p.id);
      setMovements(list);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterHealth === 'out') return p.available_stock <= 0;
    if (filterHealth === 'low') return p.available_stock > 0 && p.available_stock <= p.low_stock_threshold;
    if (filterHealth === 'healthy') return p.available_stock > p.low_stock_threshold;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Inventory Control & Stock Audit
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Atomic warehouse stock levels: Physical Stock − Reserved in Active Orders = Available for Public Sale
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dress title or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterHealth}
          onChange={(e) => setFilterHealth(e.target.value as any)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
        >
          <option value="all">All Inventory States</option>
          <option value="low">Low Stock Alerts Only</option>
          <option value="out">Out of Stock Only</option>
          <option value="healthy">Healthy Stock Levels</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Physical Stock</th>
                <th className="py-3 px-4 text-center">Reserved in Orders</th>
                <th className="py-3 px-4 text-center">Available for Sale</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Inventory Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">Loading stock records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">No matching stock items found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-900 block">{p.name}</span>
                      <span className="font-mono text-[11px] text-stone-400">SKU: {p.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{p.category?.name || '—'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">{p.stock_physical}</td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700">{p.stock_reserved}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-base">
                      <span className={p.available_stock <= 0 ? 'text-rose-600' : p.available_stock <= p.low_stock_threshold ? 'text-amber-600' : 'text-emerald-700'}>
                        {p.available_stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500">{p.low_stock_threshold}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.available_stock <= 0
                          ? 'bg-rose-100 text-rose-800'
                          : p.available_stock <= p.low_stock_threshold
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.available_stock <= 0 ? 'Out of Stock' : p.available_stock <= p.low_stock_threshold ? 'Low Stock' : 'Healthy'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openHistory(p)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                        title="View Movement Audit Trail"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openAdjust(p)}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Adjust Physical Stock
              </h3>
              <button onClick={() => setAdjustProduct(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Product: <strong>{adjustProduct.name}</strong> ({adjustProduct.sku})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">New Physical Stock Count *</label>
                <input
                  type="number"
                  min={adjustProduct.stock_reserved}
                  required
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-base font-bold"
                />
                <span className="text-[11px] text-stone-400 block mt-1">
                  Cannot be lower than reserved stock ({adjustProduct.stock_reserved})
                </span>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received new shipment from manufacturer"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg"
                >
                  Save & Log Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Audit Trail Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Stock Movements History
                </h3>
                <p className="text-xs text-stone-400">{historyProduct.name} ({historyProduct.sku})</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-6 text-center text-xs text-stone-400">Loading audit movements...</div>
            ) : movements.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">No stock movements recorded.</div>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {movements.map((m) => (
                  <div key={m.id} className="py-2.5 flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-stone-900 block capitalize">
                        {m.change_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-stone-500">{m.notes}</span>
                      <span className="text-[10px] text-stone-400 block">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${m.quantity_change > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Physical: {m.stock_physical_after} | Reserved: {m.stock_reserved_after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
