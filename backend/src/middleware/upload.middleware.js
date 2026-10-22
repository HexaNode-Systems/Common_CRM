import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Upload middleware with its own size limit whose errors come back as clear 400 messages
 * ("File is larger than 25 MB") instead of a raw 500.
 *   withUpload(25, (m) => m.single('file'))
 */
export function withUpload(maxMb, pick) {
  const handler = pick(multer({ storage, limits: { fileSize: maxMb * 1024 * 1024, files: 10 } }));
  return (req, res, next) => handler(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `File is larger than ${maxMb} MB.`
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Too many files in one upload (at most 10).'
          : err.message;
      return res.status(400).json({ message });
    }
    return next(err);
  });
}
