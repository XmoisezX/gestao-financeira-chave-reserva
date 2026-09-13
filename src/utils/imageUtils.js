/**
 * Utility to compress and resize images in the browser using HTML5 Canvas.
 * Generates an ultra-lightweight Base64 data URL (typically 15-30 KB)
 * ideal for avatars and quick Supabase synchronization.
 *
 * @param {File|Blob} file - The image file selected by user
 * @param {number} maxWidth - Maximum width (default 256px)
 * @param {number} maxHeight - Maximum height (default 256px)
 * @param {number} quality - JPEG compression quality 0-1 (default 0.85)
 * @returns {Promise<string>} Compressed Base64 data URL
 */
export const compressAndResizeImage = (file, maxWidth = 256, maxHeight = 256, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Nenhum arquivo fornecido.'));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        // Calculate aspect ratio and square crop or fit
        let { width, height } = img;
        
        // Square center crop to keep avatars clean and centered
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        const targetSize = Math.min(maxWidth, maxHeight, minDim);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          return resolve(e.target.result);
        }

        // Draw cropped & scaled image
        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        // Export as compressed JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};
