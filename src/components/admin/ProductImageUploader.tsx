import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Trash2, 
  Star, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Image as ImageIcon,
  SwitchCamera,
  Link as LinkIcon
} from 'lucide-react';
import { validateImageFile, uploadProductImage, captureVideoFrame } from '../../utils/imageUtils';

export interface UploadedImageItem {
  id?: string;
  image_url: string;
  storage_path?: string;
  is_thumbnail: boolean;
}

interface ProductImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  maxImages?: number;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 10,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Camera Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<{ dataUrl: string; blobPromise: Promise<Blob> } | null>(null);

  // Direct URL Input State
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  // Refs
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Stop camera media tracks immediately
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start in-page camera feed
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    setCapturedPreview(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('In-browser camera preview is not supported by your browser. Please use the "Native Device Camera" option below.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar or use the device camera app below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam or upload from your gallery.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application. Please close other camera apps and retry.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  };

  const handleOpenLiveCamera = () => {
    setIsCameraModalOpen(true);
    setCameraError('');
    setCapturedPreview(null);
    setTimeout(() => {
      startCamera(facingMode);
    }, 150);
  };

  const handleCloseCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCapturedPreview(null);
    setCameraError('');
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    try {
      const captured = captureVideoFrame(videoRef.current);
      setCapturedPreview(captured);
      stopCameraStream();
    } catch (err: any) {
      setCameraError(err.message || 'Failed to capture frame.');
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  const handleConfirmCapturedPhoto = async () => {
    if (!capturedPreview) return;
    setIsProcessing(true);
    try {
      const blob = await capturedPreview.blobPromise;
      const uploaded = await uploadProductImage(blob);

      const newImages = [...images];
      const isFirst = newImages.length === 0;

      newImages.push({
        id: `img-${Date.now()}-${newImages.length}`,
        image_url: uploaded.image_url,
        storage_path: uploaded.storage_path,
        is_thumbnail: isFirst,
      });

      onChange(newImages);
      setSuccessMessage('Photo captured and added to product!');
      setTimeout(() => setSuccessMessage(''), 2500);
      handleCloseCameraModal();
    } catch (err: any) {
      setCameraError(err.message || 'Failed to save captured photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Gallery File Selection
  const handleGalleryFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage('');
    setIsProcessing(true);

    try {
      const addedList: UploadedImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const uploaded = await uploadProductImage(file);
        addedList.push({
          id: `img-${Date.now()}-${i}`,
          image_url: uploaded.image_url,
          storage_path: uploaded.storage_path,
          is_thumbnail: images.length === 0 && i === 0,
        });
      }

      const updated = [...images, ...addedList];
      // Ensure at least one thumbnail is marked
      if (!updated.some((img) => img.is_thumbnail) && updated.length > 0) {
        updated[0].is_thumbnail = true;
      }

      onChange(updated);
      setSuccessMessage(`${files.length} photo(s) added successfully!`);
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process selected images.');
    } finally {
      setIsProcessing(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  // Native Mobile Camera Input
  const handleMobileCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage('');
    setIsProcessing(true);

    try {
      const file = files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const uploaded = await uploadProductImage(file);
      const updated = [
        ...images,
        {
          id: `img-${Date.now()}`,
          image_url: uploaded.image_url,
          storage_path: uploaded.storage_path,
          is_thumbnail: images.length === 0,
        },
      ];

      onChange(updated);
      setSuccessMessage('Photo captured and added successfully!');
      setTimeout(() => setSuccessMessage(''), 2500);
      handleCloseCameraModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload captured photo.');
    } finally {
      setIsProcessing(false);
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.value = '';
      }
    }
  };

  // Add Image via Direct URL
  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }

    const updated = [
      ...images,
      {
        id: `img-${Date.now()}`,
        image_url: trimmed,
        storage_path: `products/external-${Date.now()}.jpg`,
        is_thumbnail: images.length === 0,
      },
    ];

    onChange(updated);
    setManualUrl('');
    setShowUrlInput(false);
    setErrorMessage('');
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    const target = images[index];
    const filtered = images.filter((_, idx) => idx !== index);
    // If we removed the primary thumbnail, designate the first remaining as thumbnail
    if (target.is_thumbnail && filtered.length > 0) {
      filtered[0].is_thumbnail = true;
    }
    onChange(filtered);
  };

  // Set as Primary Thumbnail
  const handleSetThumbnail = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_thumbnail: idx === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Label and Count */}
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          Product Photos ({images.length})
        </label>
        <span className="text-[11px] text-stone-400">
          First or starred image is used as customer storefront cover
        </span>
      </div>

      {/* Two Prominent Action Buttons: Upload from Gallery & Take Photo */}
      <div className="grid grid-cols-2 gap-3">
        {/* OPTION 1: Upload from Gallery */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="py-3 px-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-rose-500 bg-stone-50 hover:bg-rose-50/50 text-stone-800 hover:text-rose-900 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold shadow-xs cursor-pointer active:scale-98"
        >
          <Upload className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>Upload from Gallery</span>
        </button>

        {/* OPTION 2: Take Photo */}
        <button
          type="button"
          onClick={handleOpenLiveCamera}
          disabled={isProcessing}
          className="py-3 px-4 rounded-xl border border-stone-300 hover:border-stone-400 bg-stone-900 hover:bg-stone-800 text-white transition-all flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold shadow-xs cursor-pointer active:scale-98"
        >
          <Camera className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Take Photo</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      {/* 1. Gallery File Input (Multiple Selection) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
        multiple
        onChange={handleGalleryFilesSelected}
        className="hidden"
      />

      {/* 2. Direct Mobile Native Camera Input (Capture Environment) */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleMobileCameraCapture}
        className="hidden"
      />

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {isProcessing && (
        <div className="p-2.5 bg-stone-100 rounded-xl text-stone-600 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
          <span>Processing and optimizing image...</span>
        </div>
      )}

      {/* Image Previews Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`relative group rounded-xl overflow-hidden border-2 bg-stone-100 aspect-3/4 flex flex-col justify-between transition-all ${
                img.is_thumbnail ? 'border-rose-600 ring-2 ring-rose-200 shadow-sm' : 'border-stone-200'
              }`}
            >
              <img
                src={img.image_url}
                alt={`Product photo ${idx + 1}`}
                className="w-full h-full object-cover object-center"
              />

              {/* Thumbnail Status Badge */}
              <div className="absolute top-2 left-2 z-10">
                {img.is_thumbnail ? (
                  <span className="px-2 py-0.5 bg-rose-700 text-white font-bold text-[10px] rounded-md shadow-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-300" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetThumbnail(idx)}
                    className="px-2 py-0.5 bg-black/60 hover:bg-black/80 text-white font-semibold text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Set as primary cover photo"
                  >
                    Make Cover
                  </button>
                )}
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 right-2 p-1.5 bg-stone-900/80 hover:bg-rose-700 text-white rounded-full transition-colors z-10"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 via-transparent to-transparent p-2 text-[10px] text-white font-mono truncate">
                Photo {idx + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 border border-stone-200 rounded-2xl bg-stone-50/70 text-center space-y-1">
          <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-xs font-semibold text-stone-600">No photos added yet</p>
          <p className="text-[11px] text-stone-400">
            Click "Upload from Gallery" to choose files, or "Take Photo" to capture with your camera.
          </p>
        </div>
      )}

      {/* Alternative: Direct URL Link Toggle */}
      <div className="pt-1">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>Or paste an image web link (URL)</span>
          </button>
        ) : (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={handleAddManualUrl}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
              >
                Add URL
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* IN-PAGE LIVE CAMERA MODAL                                                 */}
      {/* ========================================================================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-800 flex flex-col animate-in fade-in zoom-in-95">
            
            {/* Camera Header */}
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-sm">
                  {capturedPreview ? 'Review Captured Dress Photo' : 'Capture Dress Photo'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!capturedPreview && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                    title="Switch camera (Front / Rear)"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseCameraModal}
                  className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewport / Video or Preview */}
            <div className="relative aspect-3/4 max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
              {capturedPreview ? (
                /* Captured Frame Preview */
                <img
                  src={capturedPreview.dataUrl}
                  alt="Captured photo"
                  className="w-full h-full object-contain"
                />
              ) : cameraError ? (
                /* Camera Error Screen with Mobile Native Fallback */
                <div className="p-6 text-center space-y-4 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Camera Notice</h4>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Device Camera App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Camera Feed */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle viewfinder crosshairs */}
                  <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-sm">
                      Align Product
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
              {capturedPreview ? (
                /* Retake or Confirm */
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCapturedPhoto}
                    disabled={isProcessing}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Adding...' : 'Confirm & Use Photo'}</span>
                  </button>
                </div>
              ) : !cameraError ? (
                /* Snap Button */
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="text-stone-400 hover:text-stone-200 text-xs font-medium"
                    title="Use system camera application"
                  >
                    Device Camera App
                  </button>

                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    className="w-16 h-16 rounded-full bg-white hover:bg-stone-200 text-stone-900 flex items-center justify-center shadow-xl ring-4 ring-rose-600 active:scale-90 transition-transform cursor-pointer"
                    aria-label="Capture Photo"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-stone-900 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-stone-900" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseCameraModal}
                    className="text-stone-400 hover:text-stone-200 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="w-full text-right">
                  <button
                    type="button"
                    onClick={handleCloseCameraModal}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
