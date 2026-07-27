import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);

    return;
  }

  callback(new Error('Only images allowed'), false);
};

export const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter,
});
