const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateMenuItems(prompt) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON, handle if wrapped in markdown code blocks
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      json = JSON.parse(cleanText);
    }
    
    return json;
  } catch (error) {
    console.error('Error generating menu items:', error);
    throw new Error('Failed to generate menu items from Gemini');
  }
}

async function recommendMenus(preferences, availableMenus) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3048,
        responseMimeType: "application/json"
      }
    });

    // Build prompt based on user preferences
    const { 
      budget,
      dietary_restrictions,
      dislikes,
      preferences: userPreferences,
      meal_type,
      cuisine,
      occasion,
      additional_notes
    } = preferences;

    // Group menus by category - with flexible category names
    const mainCourses = availableMenus.filter(m => 
      m.category === 'main-course' || m.category === 'foods' || m.category === 'food'
    );
    const beverages = availableMenus.filter(m => 
      m.category === 'beverage' || m.category === 'beverages' || 
      m.category === 'drink' || m.category === 'drinks'
    );
    const desserts = availableMenus.filter(m => 
      m.category === 'dessert' || m.category === 'desserts' || m.category === 'snacks'
    );

    // Simplify menu data to reduce token usage
    const simplifyMenu = (menu) => ({
      id: menu.id,
      name: menu.name,
      category: menu.category,
      price: menu.price,
      calories: menu.calories,
      ingredients: menu.ingredients
    });

    const prompt = `
You are a professional food recommendation system. Based on the user's preferences and the available menu items in our database, recommend a complete meal that includes food, drinks, and desserts.

IMPORTANT: You MUST choose from the available menu items listed below. Do NOT create new items.

User Preferences:
${budget ? `- Budget: Rp ${budget}` : ''}
${dietary_restrictions && dietary_restrictions.length > 0 ? `- Dietary Restrictions: ${dietary_restrictions.join(', ')}` : ''}
${dislikes && dislikes.length > 0 ? `- Dislikes: ${dislikes.join(', ')}` : ''}
${userPreferences && userPreferences.length > 0 ? `- Preferences/Likes: ${userPreferences.join(', ')}` : ''}
${meal_type ? `- Meal Type: ${meal_type}` : ''}
${cuisine ? `- Preferred Cuisine: ${cuisine}` : ''}
${occasion ? `- Occasion: ${occasion}` : ''}
${additional_notes ? `- Additional Notes: ${additional_notes}` : ''}

Available Main Courses/Foods:
${JSON.stringify(mainCourses.map(simplifyMenu), null, 2)}

Available Beverages/Drinks:
${JSON.stringify(beverages.map(simplifyMenu), null, 2)}

Available Desserts/Snacks:
${JSON.stringify(desserts.map(simplifyMenu), null, 2)}

Please provide recommendations that strictly follow these conditions:
1. **MUST** select items ONLY from the available menu lists above
2. Use the exact item details (id, name, price, calories, ingredients) from the database
3. AVOID any items that contain ingredients the user dislikes
4. RESPECT all dietary restrictions
5. Stay within the budget if specified
6. Provide a balanced meal with appropriate portions

Return a JSON object with this exact structure:
{
  "recommendations": {
    "main_course": {
      "id": number (from database),
      "name": "string (exact name from database)",
      "category": "string (exact category from database)",
      "description": "string (from database)",
      "price": number (from database),
      "calories": number (from database),
      "ingredients": ["array from database"],
      "reason": "Why this is recommended based on user preferences"
    },
    "beverage": {
      "id": number (from database),
      "name": "string (exact name from database)",
      "category": "string (exact category from database)",
      "description": "string (from database)",
      "price": number (from database),
      "calories": number (from database),
      "ingredients": ["array from database"],
      "reason": "Why this is recommended based on user preferences"
    },
    "dessert": {
      "id": number (from database),
      "name": "string (exact name from database)",
      "category": "string (exact category from database)",
      "description": "string (from database)",
      "price": number (from database),
      "calories": number (from database),
      "ingredients": ["array from database"],
      "reason": "Why this is recommended based on user preferences"
    }
  },
  "total_price": number,
  "total_calories": number,
  "summary": "A brief summary explaining why these items work well together and meet the user's requirements"
}

Make sure all recommendations are from the available menu and perfectly match the user's criteria.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON, handle if wrapped in markdown code blocks
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      json = JSON.parse(cleanText);
    }
    
    return json;
  } catch (error) {
    console.error('Error generating menu recommendations:', error);
    throw new Error('Failed to generate menu recommendations from Gemini');
  }
}

module.exports = { generateMenuItems, recommendMenus };
