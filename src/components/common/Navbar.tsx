import React, { useState } from 'react';
import { ShoppingBag, Search, Shield, User, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../types';

interface NavbarProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeView: 'store' | 'orders' | 'admin';
  setActiveView: (view: 'store' | 'orders' | 'admin') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activeView,
  setActiveView,
  onOpenAuth,
}) => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const { user, isAdmin, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all shadow-xs">
      {/* Top Notification Bar */}
      <div className="bg-stone-900 text-stone-200 px-4 py-1.5 text-xs font-medium flex justify-between items-center tracking-wide">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Free Delivery across India on orders above ₹999 • Pure Cotton Guarantee</span>
        </div>
        <div className="flex items-center gap-4 text-stone-400">
          <button 
            onClick={() => switchRole(isAdmin ? 'customer' : 'admin')}
            className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            title="Toggle between Storefront and Admin Mode for testing"
          >
            <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-400' : 'text-stone-400'}`} />
            <span>Mode: <strong className={isAdmin ? 'text-amber-400' : 'text-stone-200'}>{isAdmin ? 'Admin' : 'Customer'}</strong></span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* V2 Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('store')}>
            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-rose-800 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
              <span className="font-serif font-bold text-2xl tracking-tighter">V2</span>
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block leading-none">
                V2 BOUTIQUE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-rose-700 font-semibold block mt-0.5">
                Pure Cotton Nightwear
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search nighties, panties, banians, nightdress, SKU..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-sm text-stone-900 rounded-full border border-stone-200 focus:border-rose-600 focus:outline-hidden transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setActiveView(activeView === 'admin' ? 'store' : 'admin')}
                className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs ${
                  activeView === 'admin'
                    ? 'bg-rose-900 text-white'
                    : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>{activeView === 'admin' ? 'View Storefront' : 'Admin Dashboard'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveView('orders')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeView === 'orders' ? 'text-rose-700 bg-rose-50' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <span>My Orders</span>
            </button>

            {/* Auth / Account */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                <button
                  onClick={logout}
                  className="text-xs text-stone-600 hover:text-rose-700 font-medium py-1 px-2 rounded-md hover:bg-stone-100"
                  title="Logout"
                >
                  Logout ({user.phone.slice(-4)})
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-rose-700 p-2 rounded-lg hover:bg-stone-100 transition-colors"
                title="Customer Login"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-stone-900 hover:bg-rose-900 text-white rounded-full transition-colors flex items-center justify-center shadow-md shadow-stone-900/10"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-scale">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav className="hidden lg:flex items-center space-x-1 border-t border-stone-100 py-2.5 overflow-x-auto text-xs font-medium tracking-wide">
          <button
            onClick={() => { onSelectCategory('all'); setActiveView('store'); }}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              activeCategory === 'all' && activeView === 'store'
                ? 'bg-rose-700 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onSelectCategory(cat.slug); setActiveView('store'); }}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                activeCategory === cat.slug && activeView === 'store'
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-stone-100 text-sm rounded-lg border border-stone-200 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold px-2 mb-1">
              Categories
            </p>
            <button
              onClick={() => { onSelectCategory('all'); setActiveView('store'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              All Collections
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { onSelectCategory(cat.slug); setActiveView('store'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 flex justify-between items-center"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </button>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-3 space-y-2">
            <button
              onClick={() => { setActiveView('orders'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              Track My Orders
            </button>
            {isAdmin && (
              <button
                onClick={() => { setActiveView('admin'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50"
              >
                Go to Administrator Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
