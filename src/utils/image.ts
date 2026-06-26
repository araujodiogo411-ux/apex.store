/**
 * Compresses an image file on the client side using the Canvas API.
 * Resizes the image if its dimensions exceed the max dimensions and reduces quality to fit within Firestore limits.
 * 
 * @param file The original image file
 * @param maxDim The maximum width or height of the compressed image (default: 1000px)
 * @param quality The JPEG quality, between 0.0 and 1.0 (default: 0.7)
 * @returns A promise that resolves with the compressed base64 string
 */
export function compressImage(file: File, maxDim: number = 1000, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions if they exceed maxDim
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context from canvas"));
          return;
        }

        // Fill background with white (helps prevent black backgrounds on transparent PNGs when converting to JPEG)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with specified quality
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
