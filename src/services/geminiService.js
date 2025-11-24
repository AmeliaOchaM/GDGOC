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

async function calculateCaloriesAndExercise(menuItems) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Increased to prevent truncation
        responseMimeType: "application/json"
      }
    });

    // Prepare menu items data for the prompt
    const menuList = menuItems.map(item => ({
      name: item.name,
      calories: item.calories || 0,
      ingredients: item.ingredients || [],
      quantity: item.quantity || 1
    }));

    const prompt = `
You are a professional nutritionist and fitness advisor. Analyze the following menu items that a user has selected and provide:
1. Total calories calculation
2. Nutritional breakdown
3. Exercise recommendations to burn those calories

Selected Menu Items:
${JSON.stringify(menuList, null, 2)}

Please provide a comprehensive analysis with these requirements:
- Calculate the TOTAL calories from all items (considering quantities)
- Break down macronutrients (estimated protein, carbs, fats)
- Suggest 3-5 different exercise activities with:
  * Exercise name
  * Duration needed to burn the total calories
  * Intensity level (low, moderate, high)
  * Calories burned per hour for that activity
  * Brief description/tips

Return a JSON object with this exact structure:
{
  "total_calories": number,
  "nutritional_breakdown": {
    "protein": "string (estimated grams)",
    "carbohydrates": "string (estimated grams)",
    "fats": "string (estimated grams)",
    "fiber": "string (optional, estimated grams)"
  },
  "menu_details": [
    {
      "name": "string",
      "calories": number,
      "quantity": number,
      "subtotal_calories": number
    }
  ],
  "exercise_recommendations": [
    {
      "name": "string",
      "duration_minutes": number,
      "intensity": "low|moderate|high",
      "calories_burned_per_hour": number,
      "description": "string",
      "tips": "string"
    }
  ],
  "health_notes": "string (general health advice about this meal)",
  "summary": "string (brief summary of the analysis)"
}

Be accurate with calorie calculations and realistic with exercise recommendations.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('=== Gemini Response Debug ===');
    console.log('Raw response length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Last 500 chars:', text.substring(text.length - 500));
    
    // Try to parse JSON with multiple strategies
    let json;
    
    // Strategy 1: Direct parse
    try {
      json = JSON.parse(text);
      console.log('✓ Direct JSON parse successful');
      return json;
    } catch (e) {
      console.log('✗ Direct JSON parse failed:', e.message);
    }
    
    // Strategy 2: Remove markdown code blocks
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      json = JSON.parse(cleanText);
      console.log('✓ JSON parse after removing markdown successful');
      return json;
    } catch (e) {
      console.log('✗ JSON parse after markdown removal failed:', e.message);
    }
    
    // Strategy 3: Find JSON object boundaries and extract
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extractedJson = text.substring(firstBrace, lastBrace + 1);
        json = JSON.parse(extractedJson);
        console.log('✓ JSON parse after extraction successful');
        return json;
      }
    } catch (e) {
      console.log('✗ JSON parse after extraction failed:', e.message);
    }
    
    // Strategy 4: Try to repair common JSON issues
    try {
      let repairedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find the last complete JSON object
      const firstBrace = repairedText.indexOf('{');
      if (firstBrace !== -1) {
        repairedText = repairedText.substring(firstBrace);
        
        // Try to find matching closing brace
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = 0; i < repairedText.length; i++) {
          if (repairedText[i] === '{') braceCount++;
          if (repairedText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex !== -1) {
          repairedText = repairedText.substring(0, endIndex);
          json = JSON.parse(repairedText);
          console.log('✓ JSON parse after repair successful');
          return json;
        }
      }
    } catch (e) {
      console.log('✗ JSON parse after repair failed:', e.message);
    }
    
    // All strategies failed
    console.error('All JSON parsing strategies failed');
    console.error('Full problematic text:', text);
    throw new Error(`Invalid JSON response from Gemini API. Unable to parse response after trying multiple strategies.`);
  } catch (error) {
    console.error('Error calculating calories and exercise:', error);
    if (error.message.includes('Invalid JSON')) {
      throw error;
    }
    throw new Error('Failed to calculate calories and generate exercise recommendations');
  }
}

module.exports = { generateMenuItems, recommendMenus, calculateCaloriesAndExercise };
