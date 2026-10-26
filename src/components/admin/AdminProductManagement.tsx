import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Boxes, 
  Check, 
  X, 
  AlertCircle, 
  ArrowUpDown, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product, Category } from '../../types';
import { db } from '../../services/db';
import { formatINR } from '../../utils/formatters';
import { ProductImageUploader, UploadedImageItem } from './ProductImageUploader';

export const AdminProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock'>('newest');
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [stockReason, setStockReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sku: '',
    selling_price_rupees: '',
    purchase_cost_rupees: '',
    packaging_cost_rupees: '',
    stock_physical: 10,
    low_stock_threshold: 5,
    is_active: true,
    image_url_1: '',
    image_url_2: '',
  });

  const [formError, setFormError] = useState('');
  const [productImages, setProductImages] = useState<UploadedImageItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prodRes] = await Promise.all([
        db.getCategories(true),
        db.getProducts({
          page,
          limit: 10,
          search: search || undefined,
          categorySlug: categorySlug !== 'all' ? categorySlug : undefined,
          sortBy,
          activeOnly: activeOnly,
        })
      ]);
      setCategories(cats);
      setProducts(prodRes.data);
      setTotalPages(prodRes.totalPages);
      setTotalItems(prodRes.total);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, categorySlug, sortBy, activeOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      sku: 'V2-' + Math.floor(100 + Math.random() * 900),
      selling_price_rupees: '',
      purchase_cost_rupees: '',
      packaging_cost_rupees: '',
      stock_physical: 20,
      low_stock_threshold: 5,
      is_active: true,
      image_url_1: '',
      image_url_2: '',
    });
    setProductImages([]);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      category_id: p.category_id,
      sku: p.sku,
      selling_price_rupees: (p.selling_price_paise / 100).toString(),
      purchase_cost_rupees: (p.purchase_cost_paise / 100).toString(),
      packaging_cost_rupees: (p.packaging_cost_paise / 100).toString(),
      stock_physical: p.stock_physical,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      image_url_1: '',
      image_url_2: '',
    });
    // Preserve existing product images
    const existingImages: UploadedImageItem[] = (p.images && p.images.length > 0)
      ? p.images.map((img, idx) => ({
          id: img.id,
          image_url: img.image_url,
          storage_path: img.storage_path,
          is_thumbnail: img.is_thumbnail ?? idx === 0,
        }))
      : [];
    setProductImages(existingImages);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const price = parseFloat(formData.selling_price_rupees);
    if (isNaN(price) || price < 0) {
      setFormError('Please enter a valid selling price in ₹.');
      return;
    }

    if (productImages.length === 0) {
      setFormError('Please add at least one product photo using "Upload from Gallery" or "Take Photo".');
      return;
    }

    const purchase = parseFloat(formData.purchase_cost_rupees || '0') || 0;
    const packaging = parseFloat(formData.packaging_cost_rupees || '0') || 0;

    const formattedImages = productImages.map((img, idx) => ({
      id: img.id || `img-${Date.now()}-${idx}`,
      product_id: editingProduct?.id,
      image_url: img.image_url,
      storage_path: img.storage_path || `products/${editingProduct?.id || 'new'}-${idx}.jpg`,
      display_order: idx + 1,
      is_thumbnail: img.is_thumbnail ?? idx === 0,
    }));

    // Ensure at least one thumbnail is marked
    if (!formattedImages.some(img => img.is_thumbnail) && formattedImages.length > 0) {
      formattedImages[0].is_thumbnail = true;
    }

    try {
      if (editingProduct) {
        await db.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          sku: formData.sku.trim(),
          selling_price_paise: Math.round(price * 100),
          purchase_cost_paise: Math.round(purchase * 100),
          packaging_cost_paise: Math.round(packaging * 100),
          low_stock_threshold: formData.low_stock_threshold,
          is_active: formData.is_active,
          images: formattedImages,
        });
      } else {
        await db.createProduct({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          sku: formData.sku.trim(),
          selling_price_paise: Math.round(price * 100),
          purchase_cost_paise: Math.round(purchase * 100),
          packaging_cost_paise: Math.round(packaging * 100),
          stock_physical: formData.stock_physical,
          low_stock_threshold: formData.low_stock_threshold,
          is_active: formData.is_active,
          images: formattedImages,
        });
      }

      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    }
  };

  const openStockModal = (p: Product) => {
    setStockProduct(p);
    setNewStockVal(p.stock_physical);
    setStockReason('Stock physical count adjustment');
    setIsStockModalOpen(true);
  };

  const handleStockSave = async () => {
    if (!stockProduct) return;
    try {
      await db.adjustStock(stockProduct.id, newStockVal, stockReason);
      setIsStockModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleProductActive = async (p: Product) => {
    try {
      await db.updateProduct(p.id, { is_active: !p.is_active });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Product Catalogue Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage dress listings, imagery, pricing in INR, SKUs, and stock visibility
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU, or details..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categorySlug}
            onChange={(e) => { setCategorySlug(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock">Stock Quantity</option>
          </select>

          {/* Active status */}
          <select
            value={activeOnly === undefined ? 'all' : activeOnly ? 'active' : 'inactive'}
            onChange={(e) => {
              if (e.target.value === 'all') setActiveOnly(undefined);
              else if (e.target.value === 'active') setActiveOnly(true);
              else setActiveOnly(false);
              setPage(1);
            }}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived / Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (₹)</th>
                <th className="py-3 px-4">Costs & Margin</th>
                <th className="py-3 px-4">Stock Breakdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">No products match current filters.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const img = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
                  const marginPaise = p.selling_price_paise - (p.purchase_cost_paise || 0) - (p.packaging_cost_paise || 0);

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={img} alt="" className="w-10 h-12 object-cover rounded-md bg-stone-100 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-stone-900 block line-clamp-1">{p.name}</span>
                            <span className="font-mono text-[11px] text-stone-400">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                          {p.category?.name || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-stone-900">
                        {formatINR(p.selling_price_paise)}
                      </td>

                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        <div>Purchase: {formatINR(p.purchase_cost_paise || 0)}</div>
                        <div className="text-emerald-700 font-semibold">Margin: {formatINR(marginPaise)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <span className={`font-bold block ${p.available_stock <= 0 ? 'text-rose-600' : p.available_stock <= p.low_stock_threshold ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {p.available_stock} Available
                          </span>
                          <span className="text-stone-400">
                            Physical: {p.stock_physical} | Reserved: {p.stock_reserved}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleProductActive(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openStockModal(p)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                          title="Adjust Stock"
                        >
                          <Boxes className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-stone-600 hover:text-rose-700 hover:bg-stone-100 rounded-md"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
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
          <span>Showing page {page} of {totalPages} ({totalItems} total products)</span>
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

      {/* Add / Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-100 my-8">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                {editingProduct ? 'Edit Dress Details' : 'Add New Dress to Boutique'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. V2 Heritage Floral Combed Nighty"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. V2-NGT-FLR-01"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Selling Price in INR (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price_rupees}
                    onChange={(e) => setFormData({ ...formData, selling_price_rupees: e.target.value })}
                    placeholder="499.00"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Purchase Cost in INR (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost_rupees}
                    onChange={(e) => setFormData({ ...formData, purchase_cost_rupees: e.target.value })}
                    placeholder="275.00"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Packaging Cost in INR (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.packaging_cost_rupees}
                    onChange={(e) => setFormData({ ...formData, packaging_cost_rupees: e.target.value })}
                    placeholder="20.00"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Initial Physical Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock_physical}
                      onChange={(e) => setFormData({ ...formData, stock_physical: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value, 10) || 5 })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-stone-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fabric details, fit type, wash instructions..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <ProductImageUploader
                images={productImages}
                onChange={setProductImages}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded-sm"
                />
                <label htmlFor="prod_active" className="text-stone-800 font-medium cursor-pointer">
                  Active (Visible in customer storefront when available stock &gt; 0)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && stockProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Adjust Physical Stock: {stockProduct.name}
            </h3>
            <p className="text-xs text-stone-500">
              Current Physical: <strong>{stockProduct.stock_physical}</strong> • Currently Reserved in Orders: <strong>{stockProduct.stock_reserved}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">New Physical Stock Count</label>
                <input
                  type="number"
                  min={stockProduct.stock_reserved}
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-sm"
                />
                <span className="text-[11px] text-stone-400">
                  New Available Stock will be {Math.max(0, newStockVal - stockProduct.stock_reserved)}
                </span>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Adjustment Reason (Audit Log)</label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. Physical inventory count / batch delivery received"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 text-xs">
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleStockSave}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
