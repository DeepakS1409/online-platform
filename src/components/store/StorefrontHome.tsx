import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  MessageCircle, 
  ArrowRight, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { Product, Category } from '../../types';
import { db } from '../../services/db';
import { ProductCard } from './ProductCard';

interface StorefrontHomeProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onOpenDetails: (product: Product) => void;
  onOrderNow: (product: Product, quantity?: number) => void;
}

export const StorefrontHome: React.FC<StorefrontHomeProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onOpenDetails,
  onOrderNow,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock'>('newest');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await db.getProducts({
        page,
        limit: 12,
        categorySlug: activeCategory !== 'all' ? activeCategory : undefined,
        search: searchQuery || undefined,
        sortBy,
        inStockOnly: true, // Only show products with positive available stock to customers!
        activeOnly: true,
      });
      setProducts(res.data);
      setTotalPages(res.totalPages);
      setTotalProducts(res.total);
    } catch {
      // Handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, activeCategory, searchQuery, sortBy]);

  // Reset page when category or search changes
  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Banner (Only when on 'all' categories and no search query) */}
      {activeCategory === 'all' && !searchQuery && (
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-stone-900 via-rose-950 to-stone-900 text-white shadow-xl mx-4 sm:mx-6 lg:mx-8 mt-4">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>100% Pure Combed Cotton • Tirupur Direct</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Breathable Comfort, <br />
                <span className="italic font-normal text-rose-300">Every Single Night.</span>
              </h1>

              <p className="text-sm sm:text-base text-stone-300 max-w-lg leading-relaxed">
                Discover handcrafted pure cotton Nighties, Panties, Banians, Nightdresses, and Inskirts. Superior soft weaves designed for Indian tropical weather.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onSelectCategory('nighty')}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-rose-900/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Explore Nighties</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-xs text-stone-300 bg-white/5 px-4 py-3 rounded-full border border-white/10">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Free shipping on orders ₹999+</span>
                </div>
              </div>
            </div>

            {/* Featured Image Collage */}
            <div className="relative hidden lg:flex justify-end">
              <div className="relative w-80 h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
                  alt="V2 Pure Cotton Collection"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-rose-300 block">Featured Collection</span>
                    <span className="font-serif text-lg font-bold">Heritage Floral Combed Cotton</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Boutique Categories Visual Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Shop by Essential Collections
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Select category to filter available cotton styles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-300'
                    : 'bg-white hover:bg-stone-50 border-stone-200/80 text-stone-900 shadow-2xs hover:border-rose-300'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isSelected ? 'text-rose-300' : 'text-rose-700'}`}>
                    Collection
                  </span>
                  <h3 className="font-serif text-base font-bold leading-tight">
                    {cat.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-rose-200' : 'text-stone-400'}>
                    {cat.product_count || 0} styles
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Product Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sorting and Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
              <span>{activeCategory === 'all' ? 'All Dresses & Nightwear' : categories.find(c => c.slug === activeCategory)?.name || 'Collection'}</span>
              <span className="text-xs font-mono font-normal text-stone-400">
                ({totalProducts} in stock)
              </span>
            </h2>
            {searchQuery && (
              <p className="text-xs text-stone-500 mt-0.5">
                Showing results for "<strong className="text-stone-900">{searchQuery}</strong>"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-1.5 font-medium text-stone-700 focus:outline-hidden"
            >
              <option value="newest">Featured & Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock">High Availability</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-stone-100 rounded-2xl aspect-4/5 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-800">
              No matching dresses found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `No products matched your search "${searchQuery}". Try searching for Nighty, Panty, Banian, or SKU.`
                : 'All items in this collection are currently out of stock or reserved.'}
            </p>
            <button
              onClick={() => onSelectCategory('all')}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg mt-2 cursor-pointer"
            >
              View All Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={onOpenDetails}
                onOrderNow={(p) => onOrderNow(p, 1)}
              />
            ))}
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2 text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-semibold transition-colors cursor-pointer ${
                    page === pageNum
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* Brand Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">Direct Tirupur Mill Quality</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Zero synthetic adulteration. 100% combed cotton ensuring skin friendliness and shrink-resistant durability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">24-Hour Dispatch Guarantee</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Orders verified via WhatsApp are packed with barcoded shipping labels and dispatched within 24 business hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">WhatsApp Assisted Ordering</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                No complex payment gateways required. Place your order here and easily coordinate payment & delivery slots on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
