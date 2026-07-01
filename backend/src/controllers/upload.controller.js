import { cloudinary } from '../config/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import fs from 'fs/promises';
import path from 'path';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');

  const folder = req.body.folder || 'common-crm';

  // Check if Cloudinary is fully configured
  const hasCloudinary = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    try {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
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
    const sanitizedOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `img-${Date.now()}-${sanitizedOriginalName}`;
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
