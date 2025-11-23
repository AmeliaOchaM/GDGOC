// Standardized response helpers

const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    error: true,
    message
  });
};

module.exports = {
  successResponse,
  errorResponse
};
