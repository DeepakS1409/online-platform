import React from 'react';
import { MessageCircle, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 text-xs border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-rose-700 to-rose-500 flex items-center justify-center text-white font-serif font-bold text-lg">
                V2
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">
                V2 BOUTIQUE
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Tirupur's premier pure combed cotton nightwear manufacturer. Dedicated to breathable comfort, vibrant color-fastness, and authentic boutique prices.
            </p>
            <div className="pt-2 flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Pure Combed Cotton Guarantee</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-3">
              Collections
            </h4>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(c.slug);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-stone-400 hover:text-rose-300"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & WhatsApp */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-3">
              WhatsApp & Support
            </h4>
            <div className="space-y-2.5 text-stone-400 text-[11px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <span>Savithri, 2/373-2/2, Park Avenue West, Myleripalayam, Coimbatore - 641032</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+91 73061 17078</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>orders@v2boutique.in</span>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="https://wa.me/917306117078"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Technical Architecture & Administration */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-3">
              Platform & Administration
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
              Built on React, TypeScript, and Supabase PostgreSQL with atomic stock reservation and QR-based shipping management.
            </p>
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
            >
              Open Administrator Console
            </button>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} V2 Online Dress Store. All rights reserved.</p>
          <p>Manual WhatsApp settlement active • Free delivery on orders over ₹999</p>
        </div>
      </div>
    </footer>
  );
};
