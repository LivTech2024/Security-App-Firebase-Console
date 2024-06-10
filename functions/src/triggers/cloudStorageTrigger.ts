import * as functions from 'firebase-functions';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { createCanvas, loadImage } from 'canvas';

const storage = new Storage();

export const compressUploadedImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const bucket = storage.bucket(object.bucket);
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath || !contentType) return;

    if (!contentType?.startsWith('image/')) {
      console.log('This is not an image.');
      return null;
    }

    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const compressedFilePath = path.join(os.tmpdir(), `compressed_${fileName}`);

    try {
      // Ensure the temporary directory exists
      if (!fs.existsSync(os.tmpdir())) {
        fs.mkdirSync(os.tmpdir());
      }

      // Download the image to a local temporary file
      await bucket.file(filePath).download({ destination: tempFilePath });
      console.log(`Downloaded ${filePath} to ${tempFilePath}`);

      // Get the existing metadata, including the download token
      const [metadata] = await bucket.file(filePath).getMetadata();
      const existingToken = metadata?.metadata?.firebaseStorageDownloadTokens;

      // Load the image onto a canvas
      const image = await loadImage(tempFilePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      // Save the canvas as a temporary file
      const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
      fs.writeFileSync(compressedFilePath, buffer);

      console.log(`Compressed image saved to ${compressedFilePath}`);

      await bucket.upload(compressedFilePath, {
        destination: filePath,
        metadata: {
          contentType: contentType, // Preserve the original content type
          metadata: {
            firebaseStorageDownloadTokens: existingToken, // Use the existing download token
          },
        },
        predefinedAcl: 'publicRead', // Set the file to be publicly readable
      });
    } catch (error) {
      console.error('Error processing file:', error);
    }

    // Delete the temporary files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(compressedFilePath);

    console.log('Image compressed and overwritten.');
    return null;
  });
