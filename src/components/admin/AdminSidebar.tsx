import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Boxes, 
  ShoppingBag, 
  QrCode, 
  CreditCard, 
  Users, 
  BarChart3, 
  Upload, 
  Settings, 
  ArrowLeft,
  X
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'scanner'
  | 'payments'
  | 'customers'
  | 'reports'
  | 'import'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  isOpen,
  onCloseMobile,
}) => {
  const menuItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag },
    { id: 'scanner', label: 'QR Ship Scanner', icon: QrCode },
    { id: 'payments', label: 'Payment Records', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Sales & Profit Reports', icon: BarChart3 },
    { id: 'import', label: 'Bulk CSV Import', icon: Upload },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-950 text-stone-200 border-r border-stone-800 flex flex-col justify-between transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-rose-700 to-rose-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md shadow-rose-900/30">
              V2
            </div>
            <div>
              <span className="font-serif text-base font-bold text-white block leading-tight">
                V2 Operations
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400">
                Admin Console
              </span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile} 
            className="lg:hidden text-stone-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-900/80 text-white font-semibold shadow-xs border border-rose-700/50'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom footer button to exit to storefront */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-stone-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </aside>
    </>
  );
};
