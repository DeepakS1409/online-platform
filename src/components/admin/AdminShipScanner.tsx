import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Truck, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';

export const AdminShipScanner: React.FC = () => {
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState<{ order: Order; token: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment. Please use manual token input.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access device camera. Please check browser camera permissions or use manual token lookup below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleLookup = async (inputStr: string) => {
    const raw = inputStr.trim();
    if (!raw) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await db.getShipmentByToken(raw);
      if (!res) {
        throw new Error(`No order found matching QR code / token "${raw}". Please verify the printed label.`);
      }

      setScannedResult({
        order: res.order,
        token: res.shipment.shipment_token
      });
      setManualInput('');
      stopCamera();
    } catch (err: any) {
      setErrorMsg(err.message);
      setScannedResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipment = async () => {
    if (!scannedResult) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const updatedOrder = await db.shipOrderByToken(
        scannedResult.token,
        'admin-001',
        dispatchNotes.trim() || 'Dispatched via warehouse QR scanner'
      );

      setSuccessMsg(`Order #${updatedOrder.order_number} has been confirmed as SHIPPED. Inventory deducted and tracking timeline updated.`);
      setScannedResult(null);
      setDispatchNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update shipment status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Ship Scanner & Dispatch Station
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Scan parcel QR code at the packing station to confirm dispatch and deduct warehouse physical inventory atomically
        </p>
      </div>

      {/* Camera and Scan Viewport */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-700" />
            <h3 className="font-serif text-base font-bold text-stone-900">
              Live QR Scanner
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Start Device Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                Stop Camera
              </button>
            )}
          </div>
        </div>

        {/* Video feed or fallback */}
        {isCameraActive ? (
          <div className="relative aspect-video max-w-md mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-rose-500">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-4 border-rose-600/40 pointer-events-none animate-pulse rounded-2xl flex items-center justify-center">
              <span className="text-white bg-black/60 px-3 py-1 text-[11px] rounded-full backdrop-blur-xs">
                Center QR code within scanner
              </span>
            </div>
          </div>
        ) : cameraError ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Camera Access Notice</p>
              <p className="mt-0.5 text-[11px] text-amber-700/90">{cameraError}</p>
              <p className="mt-1 text-[11px] text-amber-800 font-medium">
                You can scan using a handheld USB barcode scanner or paste the Order ID / Shipment Token in the lookup box below.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2">
            <Camera className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-600 font-medium">Camera is currently standby</p>
            <p className="text-[11px] text-stone-400">
              Click "Start Device Camera" to scan parcel shipping labels directly, or enter the code manually below.
            </p>
          </div>
        )}

        {/* Manual Input / Handheld Scanner Bar */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
            Manual Token or Order Number Lookup
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup(manualInput)}
                placeholder="Scan / paste QR token or enter order number (e.g. V2-20261026-XXXX)..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:bg-white font-mono"
              />
            </div>
            <button
              onClick={() => handleLookup(manualInput)}
              disabled={loading || !manualInput.trim()}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Verify
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Shipment Confirmed!</p>
              <p className="mt-0.5 text-emerald-700">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Scanned Order Details & Dispatch Confirmation Card */}
      {scannedResult && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-start border-b border-stone-100 pb-3">
            <div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Verified Parcel Token
              </span>
              <h2 className="font-serif text-xl font-bold text-stone-900 mt-1">
                Order #{scannedResult.order.order_number}
              </h2>
              <p className="text-xs text-stone-500">
                Customer: <strong>{scannedResult.order.customer_name}</strong> • Phone: {scannedResult.order.customer_phone}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Current Status</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 uppercase">
                {scannedResult.order.order_status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          <div className="bg-stone-50 p-4 rounded-xl text-xs text-stone-700 space-y-1">
            <span className="font-bold text-stone-900 block">Delivery Address:</span>
            <p>
              {scannedResult.order.delivery_address_snapshot.recipient_name}, {scannedResult.order.delivery_address_snapshot.address_line1}, {scannedResult.order.delivery_address_snapshot.city} - {scannedResult.order.delivery_address_snapshot.postal_code}
            </p>
          </div>

          {/* Items Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Dresses Inside Parcel ({scannedResult.order.items.length})
            </h4>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden text-xs">
              {scannedResult.order.items.map((i) => (
                <div key={i.id} className="p-3 flex justify-between items-center bg-white">
                  <div>
                    <span className="font-semibold text-stone-900">{i.product_name_snapshot}</span>
                    <span className="font-mono text-[11px] text-stone-400 block">SKU: {i.sku_snapshot}</span>
                  </div>
                  <span className="font-mono font-bold text-stone-900 px-3 py-1 bg-stone-100 rounded-md">
                    Qty: {i.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Dispatch / Courier Handover Note (Optional)
            </label>
            <input
              type="text"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Handed to ST Courier / India Post Speed Post"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Confirmation CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
            <p className="text-[11px] text-stone-400">
              * Confirms physical handover, updates customer timeline, and deducts inventory.
            </p>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setScannedResult(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShipment}
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/10 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Parcel Shipped</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
