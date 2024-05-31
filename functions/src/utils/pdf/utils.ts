/* eslint-disable no-async-promise-executor */
import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';

export const compressAndConvertImages = async (
  html: string
): Promise<string> => {
  const imageURLs = extractImageURLs(html);

  for (const imageURL of imageURLs) {
    const compressedImageBase64 = await compressAndConvertImage(imageURL);
    html = html.replace(imageURL, compressedImageBase64);
  }

  return html;
};

const extractImageURLs = (html: string): string[] => {
  const regex = /<img.*?src=["'](.*?)["']/gm;
  const matches = [...html.matchAll(regex)];
  return matches.map((match) => match[1]);
};

export const resizeImage = async ({
  base64Image,
  height,
  width,
}: {
  base64Image: string;
  height: number | null;
  width: number | null;
}): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Strip the base64 prefix
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      // Decode the base64 string to a buffer
      const imgBuffer = Buffer.from(base64Data, 'base64');

      // Load the image from the buffer
      const img = await loadImage(imgBuffer);

      // Create a canvas with the specified width and height
      const canvas = createCanvas(width ?? img.width, height ?? img.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a buffer
      const buffer = canvas.toBuffer('image/png');

      // Resolve with the image buffer
      resolve(buffer);
    } catch (err) {
      reject(err);
    }
  });
};

const compressAndConvertImage = async (imageURL: string): Promise<string> => {
  try {
    const response = await axios.get(imageURL, {
      responseType: 'arraybuffer',
    });

    const compressedImageBuffer = response.data;

    const base64Image = compressedImageBuffer.toString('base64');

    const compressedImg = await resizeImage({
      base64Image,
      height: 720,
      width: 720,
    });

    return `data:image/jpeg;base64,${compressedImg.toString('base64')}`;
  } catch (error) {
    console.error('Error compressing and converting image:', error);
    return imageURL; // Return original URL if an error occurs
  }
};
