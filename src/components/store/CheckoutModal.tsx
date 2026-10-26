import React, { useState } from 'react';
import { X, CheckCircle, MessageCircle, AlertCircle, ShoppingBag, ShieldCheck, QrCode } from 'lucide-react';
import { Product, CartItem, Order, DeliveryAddress } from '../../types';
import { formatINR, generateWhatsAppUrl, calculateDelivery } from '../../utils/formatters';
import { db } from '../../services/db';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface CheckoutModalProps {
  directProduct?: { product: Product; quantity: number } | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  directProduct,
  onClose,
  onOrderSuccess,
}) => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  // Selected checkout items: either direct "Order Now" product, or entire cart
  const checkoutItems: Array<{ product: Product; quantity: number }> = directProduct
    ? [directProduct]
    : cart;

  const [address, setAddress] = useState<DeliveryAddress>({
    recipient_name: user?.full_name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: 'Tamil Nadu',
    postal_code: '',
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  React.useEffect(() => {
    db.getBusinessSettings().then(setBusinessSettings);
  }, []);

  const subtotalPaise = checkoutItems.reduce(
    (sum, item) => sum + item.product.selling_price_paise * item.quantity,
    0
  );

  const deliveryChargePaise = businessSettings
    ? calculateDelivery(subtotalPaise, businessSettings)
    : (subtotalPaise >= 99900 ? 0 : 6000);

  const grandTotalPaise = subtotalPaise + deliveryChargePaise;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (checkoutItems.length === 0) {
      setErrorMessage('Your bag is empty.');
      return;
    }

    if (!address.recipient_name.trim()) {
      setErrorMessage('Please enter recipient name.');
      return;
    }

    const cleanPhone = address.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!address.address_line1.trim() || !address.city.trim() || !address.postal_code.trim()) {
      setErrorMessage('Please enter complete delivery address and pincode.');
      return;
    }

    setLoading(true);

    try {
      // Idempotency key per submission attempt
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const order = await db.createOrder({
        customer_id: user?.id,
        customer_name: address.recipient_name,
        customer_phone: cleanPhone,
        delivery_address: address,
        items: checkoutItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        idempotency_key: idempotencyKey,
        notes: notes.trim() || undefined
      });

      // Clear cart if this was a cart checkout
      if (!directProduct) {
        clearCart();
      }

      setCreatedOrder(order);
      onOrderSuccess(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please check item stock.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!createdOrder || !businessSettings) return;
    const url = generateWhatsAppUrl(createdOrder, businessSettings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-100">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              {createdOrder ? 'Order Placed Successfully' : 'Complete Delivery Information'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {createdOrder ? 'Your order is saved and reserved.' : 'No online card required — payment is coordinated via WhatsApp'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {createdOrder ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-rose-700 font-semibold bg-rose-50 px-3 py-1 rounded-full">
                Order #{createdOrder.order_number}
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-2">
                Order Created & Inventory Reserved
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Your dress items are reserved in our Tirupur warehouse for 24 hours. Connect with our boutique team on WhatsApp to finalize your delivery slot and preferred payment method.
              </p>
            </div>

            {/* QR Code & Parcel Badge */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 inline-flex flex-col items-center gap-2">
              <QRCodeSVG
                value={createdOrder.shipment?.qr_code_data || createdOrder.order_number}
                size={110}
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] font-mono text-stone-400">
                Shipment Token: {createdOrder.shipment?.shipment_token?.slice(0, 10)}...
              </span>
            </div>

            {/* Order Summary Snapshot */}
            <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-700 space-y-1 text-left border border-stone-200/50 max-w-md mx-auto">
              <div className="flex justify-between">
                <span>Items Total:</span>
                <span className="font-semibold">{formatINR(createdOrder.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-semibold">
                  {createdOrder.delivery_charge_paise === 0 ? 'FREE' : formatINR(createdOrder.delivery_charge_paise)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200 text-sm">
                <span>Grand Total:</span>
                <span className="text-rose-800">{formatINR(createdOrder.grand_total_paise)}</span>
              </div>
            </div>

            {/* WhatsApp CTA Button */}
            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={openWhatsApp}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-98 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Continue to WhatsApp to Confirm</span>
              </button>
              <p className="text-[11px] text-stone-400">
                A prefilled message with your Order ID, items, and delivery address will be opened in WhatsApp.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Back to Boutique Store
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handlePlaceOrder} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selected Items Mini-Preview */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-200 pb-2">
                <span>Items Summary ({checkoutItems.length})</span>
                <span className="text-rose-700">{formatINR(grandTotalPaise)}</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-2 text-xs">
                {checkoutItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-stone-600">
                    <span className="truncate max-w-[280px]">
                      {item.quantity} × {item.product.name}
                    </span>
                    <span className="font-mono font-medium text-stone-900">
                      {formatINR(item.product.selling_price_paise * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-stone-500 pt-1 flex justify-between border-t border-stone-200/60">
                <span>Delivery: {deliveryChargePaise === 0 ? 'FREE' : formatINR(deliveryChargePaise)}</span>
                <span className="font-semibold text-stone-900">Grand Total: {formatINR(grandTotalPaise)}</span>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                1. Recipient & Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="recipient_name"
                    value={address.recipient_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mobile Number (for WhatsApp & Courier) *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={address.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit number e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                2. Shipping Address
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    House / Flat / Door No. & Street *
                  </label>
                  <input
                    type="text"
                    required
                    name="address_line1"
                    value={address.address_line1}
                    onChange={handleInputChange}
                    placeholder="e.g. 42B, South Cotton Mills Street"
                    className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Area / Colony (Optional)
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      value={address.address_line2 || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Gandhi Nagar"
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={address.landmark || ''}
                      onChange={handleInputChange}
                      placeholder="Near Bus Stand / Temple"
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      City / Town *
                    </label>
                    <input
                      type="text"
                      required
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Tirupur"
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      placeholder="Tamil Nadu"
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      name="postal_code"
                      value={address.postal_code}
                      onChange={handleInputChange}
                      placeholder="641604"
                      className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Order Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific instructions or sizing notes..."
                className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:bg-white focus:border-rose-600 focus:outline-hidden"
              />
            </div>

            {/* Submission Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-rose-700 hover:bg-rose-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-98 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Reserving Stock & Placing Order...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Order ({formatINR(grandTotalPaise)})</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-stone-400 mt-2">
                Clicking confirms your order in our database. You will then connect via WhatsApp to finalize dispatch.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
