import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { StorefrontHome } from './components/store/StorefrontHome';
import { ProductDetailsModal } from './components/store/ProductDetailsModal';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { CustomerOrdersView } from './components/store/CustomerOrdersView';
import { AuthModal } from './components/common/AuthModal';

// Admin Views
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { AdminDashboardHome } from './components/admin/AdminDashboardHome';
import { AdminProductManagement } from './components/admin/AdminProductManagement';
import { AdminCategoryManagement } from './components/admin/AdminCategoryManagement';
import { AdminInventoryManagement } from './components/admin/AdminInventoryManagement';
import { AdminOrderManagement } from './components/admin/AdminOrderManagement';
import { AdminShipScanner } from './components/admin/AdminShipScanner';
import { AdminPaymentsView } from './components/admin/AdminPaymentsView';
import { AdminCustomersView } from './components/admin/AdminCustomersView';
import { AdminReportsView } from './components/admin/AdminReportsView';
import { AdminCsvImportModal } from './components/admin/AdminCsvImportModal';
import { AdminSettingsView } from './components/admin/AdminSettingsView';

import { db } from './services/db';
import { Category, Product, Order } from './types';
import { useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';

export function App() {
  const { isAdmin } = useAuth();

  // Navigation State
  const [activeView, setActiveView] = useState<'store' | 'orders' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [adminMobileOpen, setAdminMobileOpen] = useState(false);

  // Storefront Filtering State
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [directCheckoutProduct, setDirectCheckoutProduct] = useState<{ product: Product; quantity: number } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    db.getCategories(false).then(setCategories);
  }, []);

  const handleOrderNow = (product: Product, quantity = 1) => {
    setDirectCheckoutProduct({ product, quantity });
    setIsCheckoutOpen(true);
  };

  const handleProceedFromCart = () => {
    setDirectCheckoutProduct(null);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-rose-200">
      
      {/* RENDER ADMIN CONSOLE */}
      {activeView === 'admin' ? (
        <div className="min-h-screen flex bg-stone-100">
          <AdminSidebar
            currentTab={adminTab}
            onSelectTab={setAdminTab}
            onExitAdmin={() => setActiveView('store')}
            isOpen={adminMobileOpen}
            onCloseMobile={() => setAdminMobileOpen(false)}
          />

          <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
            {/* Top Admin Mobile Header */}
            <div className="lg:hidden bg-stone-950 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
              <button
                onClick={() => setAdminMobileOpen(true)}
                className="p-1 text-stone-300 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-serif font-bold text-sm tracking-wide">
                V2 Operations
              </span>
              <button
                onClick={() => setActiveView('store')}
                className="text-xs text-rose-400 font-semibold"
              >
                Storefront
              </button>
            </div>

            {/* Admin Main Body */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {adminTab === 'dashboard' && <AdminDashboardHome onNavigateTab={setAdminTab} />}
              {adminTab === 'products' && <AdminProductManagement />}
              {adminTab === 'categories' && <AdminCategoryManagement />}
              {adminTab === 'inventory' && <AdminInventoryManagement />}
              {adminTab === 'orders' && <AdminOrderManagement />}
              {adminTab === 'scanner' && <AdminShipScanner />}
              {adminTab === 'payments' && <AdminPaymentsView />}
              {adminTab === 'customers' && <AdminCustomersView />}
              {adminTab === 'reports' && <AdminReportsView />}
              {adminTab === 'import' && <AdminCsvImportModal />}
              {adminTab === 'settings' && <AdminSettingsView />}
            </main>
          </div>
        </div>
      ) : (
        /* RENDER CUSTOMER STOREFRONT & ORDERS */
        <>
          <Navbar
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeView={activeView}
            setActiveView={setActiveView}
            onOpenAuth={() => setIsAuthOpen(true)}
          />

          <main className="flex-1">
            {activeView === 'orders' ? (
              <CustomerOrdersView onBackToStore={() => setActiveView('store')} />
            ) : (
              <StorefrontHome
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                searchQuery={searchQuery}
                onOpenDetails={setDetailsProduct}
                onOrderNow={handleOrderNow}
              />
            )}
          </main>

          <Footer
            categories={categories}
            onSelectCategory={setActiveCategory}
            onOpenAdmin={() => setActiveView('admin')}
          />

          {/* Customer Overlays & Modals */}
          <CartDrawer onProceedToCheckout={handleProceedFromCart} />

          <ProductDetailsModal
            product={detailsProduct}
            onClose={() => setDetailsProduct(null)}
            onOrderNow={handleOrderNow}
          />

          {isCheckoutOpen && (
            <CheckoutModal
              directProduct={directCheckoutProduct}
              onClose={() => {
                setIsCheckoutOpen(false);
                setDirectCheckoutProduct(null);
              }}
              onOrderSuccess={(order) => {
                // Keep modal open on success confirmation screen
              }}
            />
          )}

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
          />
        </>
      )}

    </div>
  );
}
export default App;
