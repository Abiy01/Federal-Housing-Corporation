import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isPlaceholder = (value = '') =>
  value.includes('your_') || value.includes('<') || value.includes('example');

export const cloudinaryConfigured = Boolean(
  cloudName &&
    apiKey &&
    apiSecret &&
    !isPlaceholder(cloudName) &&
    !isPlaceholder(apiKey) &&
    !isPlaceholder(apiSecret)
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('Cloudinary connected successfully!');
} else {
  console.warn('Cloudinary not configured. Image uploads are disabled.');
}

export async function uploadLocalImage(filePath, folder = 'Property') {
  if (!cloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.local.'
    );
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });

  return result.secure_url || result.url;
}
