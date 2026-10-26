import { Order, BusinessSettings } from '../types';

/**
 * Formats integer paise into Indian Rupee (INR) representation
 * Example: 49900 -> "₹499.00"
 */
export function formatINR(paise: number, includeDecimals = true): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats ISO date string to readable human format (e.g. 26 Oct 2026, 04:30 PM)
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Strips all non-digit characters and ensures country code
 */
export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Builds structured pre-filled WhatsApp click-to-chat message URL
 * Does not expose sensitive passwords or private customer data to outside parties.
 */
export function generateWhatsAppUrl(order: Order, settings: BusinessSettings): string {
  const cleanPhone = sanitizePhone(settings.whatsapp_number);
  
  const itemsText = (order.items || [])
    .map((item, idx) => `  ${idx + 1}. *${item.product_name_snapshot}* (${item.sku_snapshot})\n     Qty: ${item.quantity} × ${formatINR(item.unit_price_paise)} = ${formatINR(item.item_total_paise)}`)
    .join('\n\n');

  const addr = order.delivery_address_snapshot;
  const addressText = `${addr.recipient_name}\n${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}\n${addr.landmark ? 'Landmark: ' + addr.landmark + '\n' : ''}${addr.city}, ${addr.state} - ${addr.postal_code}\nPh: ${addr.phone}`;

  const message = `✨ *NEW ORDER: ${order.order_number}* ✨
From: *${settings.business_name}*
────────────────────────
👤 *CUSTOMER DETAILS:*
${order.customer_name} (${order.customer_phone})

📍 *DELIVERY ADDRESS:*
${addressText}
────────────────────────
🛍️ *ORDER ITEMS:*
${itemsText}
────────────────────────
💵 *PAYMENT SUMMARY:*
Subtotal: ${formatINR(order.subtotal_paise)}
Delivery: ${order.delivery_charge_paise === 0 ? 'FREE' : formatINR(order.delivery_charge_paise)}
*Grand Total: ${formatINR(order.grand_total_paise)}*
────────────────────────
💬 *Next Steps:*
Hello V2 Boutique! I have placed order *#${order.order_number}*. Please confirm availability and share payment instructions (GPay / PhonePe / UPI ID / Account Details). Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Calculates delivery charge based on business rules
 */
export function calculateDelivery(
  subtotalPaise: number,
  settings: { default_delivery_charge_paise: number; free_delivery_threshold_paise: number }
): number {
  if (subtotalPaise >= settings.free_delivery_threshold_paise) {
    return 0;
  }
  return settings.default_delivery_charge_paise;
}
