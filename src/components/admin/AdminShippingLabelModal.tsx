import React, { useEffect, useState } from 'react';
import { X, Printer, Package, Check, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, BusinessSettings } from '../../types';
import { db } from '../../services/db';
import { formatDate } from '../../utils/formatters';

interface AdminShippingLabelModalProps {
  order: Order;
  onClose: () => void;
}

export const AdminShippingLabelModal: React.FC<AdminShippingLabelModalProps> = ({ order, onClose }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    db.getBusinessSettings().then(setSettings);
    db.markLabelPrinted(order.id);
  }, [order.id]);

  const handlePrint = () => {
    window.print();
  };

  const addr = order.delivery_address_snapshot;
  const qrData = order.shipment?.qr_code_data || `V2-SHIP:${order.order_number}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-100 my-8">
        
        {/* Modal Controls (Hidden during print) */}
        <div className="flex justify-between items-center border-b border-stone-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-700" />
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Printable Parcel Shipping Label
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Label
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label Sheet */}
        <div 
          id="printable-shipping-label"
          className="bg-white p-6 border-2 border-stone-900 rounded-xl space-y-4 text-stone-900 font-sans text-xs"
        >
          {/* Header Row */}
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-black tracking-tight">V2 BOUTIQUE</span>
                <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">
                  EXPRESS PARCEL
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Dispatch Hub: {settings?.address || 'Savithri, 2/373-2/2, Park Avenue West, Myleripalayam, Coimbatore - 641032'}
              </p>
              <p className="text-[11px] text-stone-500 font-mono">
                Support: {settings?.contact_phone || '+91 73061 17078'}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="text-center flex flex-col items-center">
              <div className="p-1.5 bg-white border border-stone-900 rounded-lg">
                <QRCodeSVG
                  value={qrData}
                  size={96}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="font-mono text-[9px] text-stone-500 mt-1 uppercase">
                Scan to Ship
              </span>
            </div>
          </div>

          {/* Order Reference and Date */}
          <div className="grid grid-cols-2 gap-2 border-b border-stone-300 pb-2 text-[11px]">
            <div>
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Order Number</span>
              <span className="font-mono text-sm font-black">#{order.order_number}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Booking Date</span>
              <span className="font-mono">{formatDate(order.created_at)}</span>
            </div>
          </div>

          {/* Delivery To Address */}
          <div className="border-b-2 border-stone-900 pb-3 bg-stone-50/80 p-3 rounded-lg">
            <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px] block mb-1">
              DELIVER TO RECIPIENT:
            </span>
            <div className="text-sm font-bold text-stone-950">
              {addr.recipient_name}
            </div>
            <div className="text-xs text-stone-800 leading-snug mt-1">
              {addr.address_line1} {addr.address_line2 ? `, ${addr.address_line2}` : ''}
              {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
              <br />
              {addr.city}, {addr.state} - <strong className="font-mono text-sm">{addr.postal_code}</strong>
            </div>
            <div className="mt-2 text-xs font-mono font-bold text-stone-900 flex items-center gap-1.5">
              <span>Primary Phone: {addr.phone}</span>
            </div>
          </div>

          {/* Manifest / Itemized Packing List */}
          <div>
            <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block mb-1.5">
              PARCEL CONTENTS & PACKING MANIFEST ({order.items.length} items):
            </span>
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-stone-300 text-stone-500 font-semibold">
                  <th className="py-1">Item Description</th>
                  <th className="py-1">SKU</th>
                  <th className="py-1 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-1 font-medium">{i.product_name_snapshot}</td>
                    <td className="py-1 font-mono text-[10px] text-stone-500">{i.sku_snapshot}</td>
                    <td className="py-1 text-right font-bold font-mono">{i.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="border-t border-stone-300 pt-2 flex justify-between items-center text-[10px] text-stone-500">
            <span>Verified 100% Pure Combed Cotton • Non-hazardous Textiles</span>
            <span className="font-mono">Token: {order.shipment?.shipment_token.slice(0, 8)}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
