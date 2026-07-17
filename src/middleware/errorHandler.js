import { HttpError } from 'http-errors';

export const errorHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: error.message || 'Internal Server Error',
  });
};
