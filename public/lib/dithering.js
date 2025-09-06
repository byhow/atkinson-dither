// src/lib/dithering.js
export function ditherAtkinson(imageData, threshold = 128) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Convert to grayscale
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const newGray = gray < threshold ? 0 : 255;
      const error = gray - newGray;

      // Set pixel to black or white
      data[idx] = data[idx + 1] = data[idx + 2] = newGray;

      // Distribute error using Atkinson pattern
      distributeError(data, width, height, x, y, error);
    }
  }

  return imageData;
}

function distributeError(data, width, height, x, y, error) {
  const distribute = [
    [1, 0, 1 / 8],
    [2, 0, 1 / 8],
    [-1, 1, 1 / 8],
    [0, 1, 1 / 8],
    [1, 1, 1 / 8],
    [0, 2, 1 / 8],
  ];

  distribute.forEach(([dx, dy, weight]) => {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const idx = (ny * width + nx) * 4;
      const adjustment = error * weight;

      data[idx] = Math.max(0, Math.min(255, data[idx] + adjustment));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + adjustment));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + adjustment));
    }
  });
}

// Progressive/async Atkinson dithering with progress callback. Returns a Promise<ImageData>.
export function ditherAtkinsonChunked(
  imageData,
  threshold = 128,
  callbacks = {}
) {
  const { onProgress } = callbacks;
  return new Promise((resolve) => {
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(imageData.data);

    const totalPixels = width * height;
    let processedPixels = 0;
    let currentY = 0;
    const chunkSize = Math.max(1, Math.floor(height / 50));

    const processChunk = () => {
      const endY = Math.min(currentY + chunkSize, height);

      for (let y = currentY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // Convert to grayscale (luma)
          const gray = Math.round(
            0.299 * output[idx] +
              0.587 * output[idx + 1] +
              0.114 * output[idx + 2]
          );

          const newValue = gray > threshold ? 255 : 0;
          const error = gray - newValue;

          // Set pixel
          output[idx] = newValue;
          output[idx + 1] = newValue;
          output[idx + 2] = newValue;
          output[idx + 3] = 255;

          const errorFraction = error / 8;
          const distribute = (dx, dy) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              const r = output[nIdx] + errorFraction;
              const g = output[nIdx + 1] + errorFraction;
              const b = output[nIdx + 2] + errorFraction;
              output[nIdx] = Math.max(0, Math.min(255, r));
              output[nIdx + 1] = Math.max(0, Math.min(255, g));
              output[nIdx + 2] = Math.max(0, Math.min(255, b));
            }
          };

          // Atkinson pattern
          distribute(1, 0);
          distribute(2, 0);
          distribute(-1, 1);
          distribute(0, 1);
          distribute(1, 1);
          distribute(0, 2);

          processedPixels++;
        }
      }

      currentY = endY;
      if (typeof onProgress === "function") {
        const progress = Math.round((processedPixels / totalPixels) * 100);
        try {
          onProgress(progress);
        } catch {}
      }

      if (currentY < height) {
        setTimeout(processChunk, 0);
      } else {
        resolve(new ImageData(output, width, height));
      }
    };

    setTimeout(processChunk, 0);
  });
}
