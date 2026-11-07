/**
 * Kompres gambar otomatis di browser sebelum diupload ke Supabase Storage.
 * Tidak ada batas ukuran file asli: foto 20 MB dari kamera HP pun akan
 * diperkecil (resize + WebP) jadi biasanya 100–500 KB. EXIF/lokasi GPS ikut terbuang.
 */

export type CompressResult = {
  file: Blob;
  ext: string;
  type: string;
  originalBytes: number;
  finalBytes: number;
  /** true bila file benar-benar diubah (bukan dipakai apa adanya) */
  compressed: boolean;
};

type Options = {
  /** sisi terpanjang maksimum (px). Default 1600. */
  maxDim?: number;
  /** target ukuran hasil (byte). Default 500 KB. */
  targetBytes?: number;
};

const SKIP_IF_SMALL = 150 * 1024; // file kecil yang sudah efisien tidak perlu diutak-atik

function loadBitmap(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
      .then(b => ({ src: b, w: b.width, h: b.height, close: () => b.close() }))
      .catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file: File) {
  return new Promise<{ src: CanvasImageSource; w: number; h: number; close: () => void }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibaca. Coba file lain.')); };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(res => canvas.toBlob(res, type, quality));
}

export async function compressImage(file: File, opts: Options = {}): Promise<CompressResult> {
  const maxDim = opts.maxDim ?? 1600;
  const target = opts.targetBytes ?? 500 * 1024;
  const original: CompressResult = {
    file, ext: '', type: file.type, originalBytes: file.size, finalBytes: file.size, compressed: false,
  };

  // GIF kecil: pertahankan (animasi tidak hilang). GIF besar diubah jadi gambar diam.
  if (file.type === 'image/gif' && file.size <= 2 * 1024 * 1024) return original;

  const bmp = await loadBitmap(file);
  try {
    // File sudah kecil & dimensi wajar → pakai apa adanya
    if (file.size <= SKIP_IF_SMALL && Math.max(bmp.w, bmp.h) <= maxDim && file.type !== 'image/gif') return original;

    let scale = Math.min(1, maxDim / Math.max(bmp.w, bmp.h));
    let quality = 0.82;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const w = Math.max(1, Math.round(bmp.w * scale));
      const h = Math.max(1, Math.round(bmp.h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Browser tidak mendukung kompres gambar.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp.src, 0, 0, w, h);

      let blob = await toBlob(canvas, 'image/webp', quality);
      if (!blob || blob.type !== 'image/webp') {
        // Browser lama tanpa encoder WebP → JPEG di atas latar putih
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        blob = await toBlob(canvas, 'image/jpeg', quality);
      }
      if (!blob) throw new Error('Gagal mengompres gambar.');
      best = blob;
      if (blob.size <= target) break;
      if (quality > 0.6) quality -= 0.1; else scale *= 0.85; // turunkan kualitas dulu, lalu dimensi
    }

    if (!best) throw new Error('Gagal mengompres gambar.');
    // Kalau hasil malah lebih besar dari aslinya (dan aslinya format valid), pakai asli
    if (best.size >= file.size && file.type !== 'image/gif') return original;

    const ext = best.type === 'image/webp' ? 'webp' : 'jpg';
    return { file: best, ext, type: best.type, originalBytes: file.size, finalBytes: best.size, compressed: true };
  } finally {
    bmp.close();
  }
}

export function formatBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
