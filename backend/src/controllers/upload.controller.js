import { cloudinary } from '../config/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Images only. SVG is refused because it can carry scripts; the type comes from the extension.
const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon' };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  if (!IMAGE_TYPES[ext]) throw new ApiError(400, 'Upload a PNG, JPG, WEBP, GIF or ICO image.');
  if (req.file.size > MAX_IMAGE_BYTES) throw new ApiError(400, 'Images can be at most 2 MB.');
  const mimetype = IMAGE_TYPES[ext];

  const folder = String(req.body.folder || 'common-crm').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'common-crm';

  // Check if Cloudinary is fully configured
  const hasCloudinary = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    try {
      const dataUri = `data:${mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });

      return res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      });
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
    }
  } else {
    console.info('Cloudinary not fully configured, using local storage fallback.');
  }

  // Local Storage Fallback
  try {
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    
    // Ensure the folder exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate clean unique filename
    const filename = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file buffer to storage
    await fs.writeFile(filePath, req.file.buffer);

    // Return absolute URL path
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${backendUrl}/storage/uploads/${filename}`;

    return res.status(201).json({
      url: fileUrl,
      publicId: `local-${filename}`,
      width: 0,
      height: 0
    });
  } catch (localError) {
    console.error('Local file write failed:', localError);
    throw new ApiError(500, `File upload failed locally: ${localError.message}`);
  }
});
