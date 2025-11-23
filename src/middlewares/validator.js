// Middleware to validate menu data
const validateMenuData = (req, res, next) => {
  const { name, category, calories, price, ingredients, description } = req.body;

  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  // Validate category
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }

  // Validate calories
  if (calories === undefined || calories === null) {
    errors.push('Calories is required');
  } else if (!Number.isInteger(calories) || calories < 0) {
    errors.push('Calories must be a non-negative integer');
  }

  // Validate price
  if (price === undefined || price === null) {
    errors.push('Price is required');
  } else if (typeof price !== 'number' || price < 0) {
    errors.push('Price must be a non-negative number');
  }

  // Validate ingredients
  if (!ingredients) {
    errors.push('Ingredients is required');
  } else if (!Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('Ingredients must be a non-empty array');
  }

  // Description is optional, but if provided must be string
  if (description !== undefined && typeof description !== 'string') {
    errors.push('Description must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid menu data',
      details: errors
    });
  }

  next();
};

// Middleware to validate ID parameter
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid ID parameter'
    });
  }

  req.params.id = id;
  next();
};

module.exports = {
  validateMenuData,
  validateId
};
