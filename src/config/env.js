const { config } = require('dotenv');

config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
};
