export const errorHandler = (error, req, res, _next) => {
  const status = error.status ?? error.statusCode ?? 500;
  const message = error.message ?? 'Internal Server Error';

  res.status(status).json({
    message,
  });
};
