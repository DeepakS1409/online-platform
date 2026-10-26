import { supabase, isSupabaseConfigured } from '../services/supabase';

/**
 * Validates image file type and size
 */
export function validateImageFile(file: File, maxSizeBytes = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
    return { valid: false, error: `Invalid image type "${file.type || file.name}". Supported: JPG, PNG, WebP, GIF.` };
  }
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image "${file.name}" exceeds the maximum allowed size of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.` };
  }
  return { valid: true };
}

/**
 * Client-side image compression using HTML Canvas
 * Resizes large photos to optimal dimensions (max 1200px) and compresses to WebP/JPEG
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, blob: file });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), blob: file });
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({ dataUrl, blob });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Canvas element or Video stream frame to a Blob/DataURL
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  maxWidth = 1200
): { dataUrl: string; blobPromise: Promise<Blob> } {
  const canvas = document.createElement('canvas');
  let width = video.videoWidth || 640;
  let height = video.videoHeight || 480;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, width, height);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const blobPromise = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to capture photo from camera.'));
      },
      'image/jpeg',
      0.88
    );
  });

  return { dataUrl, blobPromise };
}

/**
 * Uploads an image either to Supabase Storage bucket 'product-images'
 * or generates an optimized compressed data URL if Supabase is not configured.
 */
export async function uploadProductImage(
  fileOrBlob: File | Blob,
  fileName?: string
): Promise<{ image_url: string; storage_path: string }> {
  const uniqueName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const storagePath = `products/${uniqueName}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(storagePath, fileOrBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload failed, falling back to local compression:', error.message);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return {
            image_url: publicUrlData.publicUrl,
            storage_path: storagePath,
          };
        }
      }
    } catch (err) {
      console.warn('Storage exception, using local image storage:', err);
    }
  }

  // Fallback to high-quality compressed Data URL
  if (fileOrBlob instanceof File) {
    const { dataUrl } = await compressImage(fileOrBlob);
    return {
      image_url: dataUrl,
      storage_path: storagePath,
    };
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ image_url: reader.result as string, storage_path: storagePath });
      reader.onerror = () => reject(new Error('Failed to read photo blob.'));
      reader.readAsDataURL(fileOrBlob);
    });
  }
}
