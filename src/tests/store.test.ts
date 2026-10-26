import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDelivery, formatINR, generateWhatsAppUrl, sanitizePhone } from '../utils/formatters';
import { db } from '../services/db';
import { INITIAL_BUSINESS_SETTINGS } from '../data/seedData';

describe('Pricing & Delivery Calculations (Integer Paise)', () => {
  it('formats integer paise to INR correctly', () => {
    expect(formatINR(49900)).toBe('₹499.00');
    expect(formatINR(125050)).toBe('₹1,250.50');
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('calculates standard delivery charge below threshold', () => {
    const charge = calculateDelivery(50000, INITIAL_BUSINESS_SETTINGS);
    expect(charge).toBe(6000); // ₹60.00
  });

  it('awards free delivery at or above threshold', () => {
    const charge = calculateDelivery(99900, INITIAL_BUSINESS_SETTINGS);
    expect(charge).toBe(0);

    const higherCharge = calculateDelivery(150000, INITIAL_BUSINESS_SETTINGS);
    expect(higherCharge).toBe(0);
  });
});

describe('WhatsApp Link Generation', () => {
  it('generates a valid WhatsApp click-to-chat URL with prefilled itemized order details', () => {
    const mockOrder: any = {
      id: 'ord-123',
      order_number: 'V2-20261026-1234',
      customer_name: 'Priya Sharma',
      customer_phone: '9876543210',
      subtotal_paise: 49900,
      delivery_charge_paise: 6000,
      grand_total_paise: 55900,
      delivery_address_snapshot: {
        recipient_name: 'Priya Sharma',
        phone: '9876543210',
        address_line1: '42 Cotton Street',
        city: 'Tirupur',
        state: 'Tamil Nadu',
        postal_code: '641604'
      },
      items: [
        {
          id: 'item-1',
          product_name_snapshot: 'V2 Heritage Nighty',
          sku_snapshot: 'V2-NGT-FLR-01',
          unit_price_paise: 49900,
          quantity: 1,
          item_total_paise: 49900
        }
      ]
    };

    const url = generateWhatsAppUrl(mockOrder, INITIAL_BUSINESS_SETTINGS);
    expect(url).toContain('https://wa.me/917306117078?text=');
    expect(url).toContain(encodeURIComponent('V2-20261026-1234'));
    expect(url).toContain(encodeURIComponent('Priya Sharma'));
    expect(url).toContain(encodeURIComponent('₹559.00'));
  });
});

describe('Database Engine & Inventory Stock Workflow', () => {
  it('loads initial categories with initial 5 collections', async () => {
    const categories = await db.getCategories(true);
    expect(categories.length).toBeGreaterThanOrEqual(5);
    const names = categories.map(c => c.name);
    expect(names).toContain('Nighty');
    expect(names).toContain('Panties');
    expect(names).toContain('Banians');
    expect(names).toContain('Nightdress');
    expect(names).toContain('Inskirts (Pavadai)');
  });

  it('prevents creating orders with insufficient stock', async () => {
    const products = await db.getProducts({ limit: 1 });
    const product = products.data[0];

    await expect(
      db.createOrder({
        customer_name: 'Test Customer',
        customer_phone: '9123456780',
        delivery_address: {
          recipient_name: 'Test Customer',
          phone: '9123456780',
          address_line1: '123 Test St',
          city: 'Tirupur',
          state: 'Tamil Nadu',
          postal_code: '641604'
        },
        items: [{ product_id: product.id, quantity: product.available_stock + 999 }]
      })
    ).rejects.toThrow(/Insufficient stock/);
  });

  it('atomically creates order, reserves stock, and calculates backend price snapshot', async () => {
    const products = await db.getProducts({ limit: 1 });
    const product = products.data[0];
    const initialReserved = product.stock_reserved || 0;
    const initialPhysical = product.stock_physical;

    const order = await db.createOrder({
      customer_name: 'Lakshmi Narayanan',
      customer_phone: '9842109876',
      delivery_address: {
        recipient_name: 'Lakshmi Narayanan',
        phone: '9842109876',
        address_line1: '75 Mill Colony',
        city: 'Tirupur',
        state: 'Tamil Nadu',
        postal_code: '641604'
      },
      items: [{ product_id: product.id, quantity: 2 }]
    });

    expect(order.order_status).toBe('awaiting_confirmation');
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].unit_price_paise).toBe(product.selling_price_paise);
    expect(order.items[0].item_total_paise).toBe(product.selling_price_paise * 2);

    // Verify stock reserved increased by 2
    const freshProduct = await db.getProductById(product.id);
    expect(freshProduct?.stock_reserved).toBe(initialReserved + 2);
    expect(freshProduct?.available_stock).toBe(initialPhysical - (initialReserved + 2));

    // Now test cancellation releases the reserved stock
    await db.cancelOrder(order.id, 'Test cancellation');
    const cancelledProduct = await db.getProductById(product.id);
    expect(cancelledProduct?.stock_reserved).toBe(initialReserved);
  });

  it('records manual payment and updates payment status', async () => {
    const products = await db.getProducts({ limit: 1 });
    const product = products.data[0];

    const order = await db.createOrder({
      customer_name: 'Revathi',
      customer_phone: '9876501234',
      delivery_address: {
        recipient_name: 'Revathi',
        phone: '9876501234',
        address_line1: '9 Bazaar St',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        postal_code: '641001'
      },
      items: [{ product_id: product.id, quantity: 1 }]
    });

    expect(order.payment_status).toBe('unpaid');

    // Record partial payment
    const partialRes = await db.recordPayment({
      order_id: order.id,
      amount_paise: 20000, // ₹200
      payment_method: 'upi',
      transaction_reference: 'UPI12345678'
    });

    expect(partialRes.order.payment_status).toBe('partially_paid');
    expect(partialRes.outstanding_paise).toBe(order.grand_total_paise - 20000);

    // Record remaining payment
    const fullRes = await db.recordPayment({
      order_id: order.id,
      amount_paise: partialRes.outstanding_paise,
      payment_method: 'gpay'
    });

    expect(fullRes.order.payment_status).toBe('paid');
    expect(fullRes.outstanding_paise).toBe(0);
  });

  it('verifies shipment token and prevents duplicate dispatch operations', async () => {
    const products = await db.getProducts({ limit: 1 });
    const product = products.data[0];

    const order = await db.createOrder({
      customer_name: 'Ananya',
      customer_phone: '9988776655',
      delivery_address: {
        recipient_name: 'Ananya',
        phone: '9988776655',
        address_line1: '14 Park Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600001'
      },
      items: [{ product_id: product.id, quantity: 1 }]
    });

    const token = order.shipment!.shipment_token;
    const lookup = await db.getShipmentByToken(token);
    expect(lookup).not.toBeNull();
    expect(lookup?.order.order_number).toBe(order.order_number);

    // Ship via token
    const shippedOrder = await db.shipOrderByToken(token, 'admin-001');
    expect(shippedOrder.order_status).toBe('shipped');
    expect(shippedOrder.shipment?.shipped_at).toBeDefined();

    // Duplicate scan must throw an error
    await expect(
      db.shipOrderByToken(token, 'admin-001')
    ).rejects.toThrow(/ALREADY been dispatched/);
  });
});

describe('Product CSV Parser & Validation Engine', () => {
  it('validates CSV headers and identifies duplicate SKUs', async () => {
    const invalidCsv = `Name,SKU,Category,Selling_Price
"Sample Nighty",V2-SMP-01,Nighty,499.00`;

    // Missing 'stock' header
    await expect(db.previewAndValidateCsv(invalidCsv)).rejects.toThrow(/Missing required CSV header: "stock"/);

    const validCsvWithDuplicate = `Name,SKU,Category,Selling_Price,Stock
"Dress 1",V2-DUP-01,Nighty,499.00,20
"Dress 2",V2-DUP-01,Nighty,599.00,10`;

    const result = await db.previewAndValidateCsv(validCsvWithDuplicate);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Duplicate SKU "V2-DUP-01"');
    expect(result.validRows.length).toBe(1);
  });
});
