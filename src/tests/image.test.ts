import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../utils/imageUtils';

describe('Image File Validation Engine', () => {
  it('accepts valid JPEG, PNG, and WebP images', () => {
    const jpegFile = new File(['fake content'], 'dress-front.jpg', { type: 'image/jpeg' });
    const pngFile = new File(['fake content'], 'dress-back.png', { type: 'image/png' });
    const webpFile = new File(['fake content'], 'dress-detail.webp', { type: 'image/webp' });

    expect(validateImageFile(jpegFile).valid).toBe(true);
    expect(validateImageFile(pngFile).valid).toBe(true);
    expect(validateImageFile(webpFile).valid).toBe(true);
  });

  it('rejects unsupported file formats', () => {
    const pdfFile = new File(['fake content'], 'document.pdf', { type: 'application/pdf' });
    const exeFile = new File(['fake content'], 'setup.exe', { type: 'application/x-msdownload' });

    const resPdf = validateImageFile(pdfFile);
    expect(resPdf.valid).toBe(false);
    expect(resPdf.error).toContain('Invalid image type');

    const resExe = validateImageFile(exeFile);
    expect(resExe.valid).toBe(false);
  });

  it('rejects files exceeding maximum size limit', () => {
    // 15MB file test with 10MB limit
    const largeFile = new File([new ArrayBuffer(15 * 1024 * 1024)], 'huge-photo.jpg', { type: 'image/jpeg' });
    const res = validateImageFile(largeFile, 10 * 1024 * 1024);

    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds the maximum allowed size');
  });
});
