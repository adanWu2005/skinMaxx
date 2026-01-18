export const validateImageLighting = async (
  imageUri: string
): Promise<{ isValid: boolean; brightness: number }> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({ isValid: true, brightness: 50 });
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const isValid = avgBrightness >= 40;

      resolve({ isValid, brightness: avgBrightness });
    };

    image.onerror = () => {
      resolve({ isValid: true, brightness: 50 });
    };

    image.src = imageUri;
  });
};
