import createHttpError from 'http-errors';

import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createHttpError(400, 'No file');
    }

    const uploadResult = await saveFileToCloudinary(
      req.file.buffer,
      req.user._id,
    );

    await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.secure_url,
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    return res.status(200).json({
      url: uploadResult.secure_url,
    });
  } catch (error) {
    next(error);
  }
};
