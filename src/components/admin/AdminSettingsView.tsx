import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, Store, MessageCircle, Truck, Clock } from 'lucide-react';
import { db } from '../../services/db';
import { BusinessSettings } from '../../types';
import { formatINR } from '../../utils/formatters';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [deliveryChargeRupees, setDeliveryChargeRupees] = useState('60');
  const [freeDeliveryThresholdRupees, setFreeDeliveryThresholdRupees] = useState('999');
  const [minOrderRupees, setMinOrderRupees] = useState('200');
  const [address, setAddress] = useState('');
  const [reservationHours, setReservationHours] = useState(24);

  useEffect(() => {
    db.getBusinessSettings().then((s) => {
      setSettings(s);
      setBusinessName(s.business_name);
      setTagline(s.tagline);
      setWhatsappNumber(s.whatsapp_number);
      setContactPhone(s.contact_phone);
      setContactEmail(s.contact_email);
      setDeliveryChargeRupees((s.default_delivery_charge_paise / 100).toString());
      setFreeDeliveryThresholdRupees((s.free_delivery_threshold_paise / 100).toString());
      setMinOrderRupees((s.min_order_value_paise / 100).toString());
      setAddress(s.address);
      setReservationHours(s.reservation_expiry_hours || 24);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    const charge = parseFloat(deliveryChargeRupees) || 0;
    const freeThresh = parseFloat(freeDeliveryThresholdRupees) || 0;
    const minVal = parseFloat(minOrderRupees) || 0;

    const updated = await db.updateBusinessSettings({
      business_name: businessName.trim(),
      tagline: tagline.trim(),
      whatsapp_number: whatsappNumber.replace(/\D/g, ''),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      default_delivery_charge_paise: Math.round(charge * 100),
      free_delivery_threshold_paise: Math.round(freeThresh * 100),
      min_order_value_paise: Math.round(minVal * 100),
      address: address.trim(),
      reservation_expiry_hours: reservationHours,
    });

    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading) return <div className="p-8 text-center text-xs text-stone-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Store & Delivery Configuration
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure V2 business profile, WhatsApp order handoff number, and shipping thresholds
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-bold">Settings updated and saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 text-xs">
        
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-stone-500" />
            <span>1. Boutique Brand & Contact</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                WhatsApp Business Number (with country code) *
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919876543210"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-stone-400">Used for WhatsApp order links</span>
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Display Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Customer Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Physical Dispatch Hub / Warehouse Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Tirupur, Tamil Nadu"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Pricing and Delivery Rules */}
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-stone-500" />
            <span>2. Delivery Charges & Thresholds (INR)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Default Delivery Charge (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={deliveryChargeRupees}
                onChange={(e) => setDeliveryChargeRupees(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono text-sm"
              />
              <span className="text-[10px] text-stone-400">Applied to orders below threshold</span>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Free Delivery Threshold (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={freeDeliveryThresholdRupees}
                onChange={(e) => setFreeDeliveryThresholdRupees(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono text-sm text-emerald-700 font-bold"
              />
              <span className="text-[10px] text-stone-400">Orders above this get free shipping</span>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Stock Reservation Expiry (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                required
                value={reservationHours}
                onChange={(e) => setReservationHours(parseInt(e.target.value, 10) || 24)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono text-sm"
              />
              <span className="text-[10px] text-stone-400">Hours before unpaid reservation auto-expires</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
};
