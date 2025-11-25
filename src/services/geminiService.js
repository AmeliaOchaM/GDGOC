const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateMenuItems(prompt) {
  try {
    console.log('=== Generate Menu Items Debug ===');
    console.log('Prompt received:', prompt);
    console.log('API Key exists:', !!GEMINI_API_KEY);
    console.log('API Key length:', GEMINI_API_KEY?.length);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    console.log('Model initialized, calling generateContent...');
    const result = await model.generateContent(prompt);
    console.log('generateContent completed');
    
    const response = await result.response;
    console.log('Response received');
    
    const text = response.text();
    console.log('Response text length:', text.length);
    console.log('Response text preview:', text.substring(0, 200));
    
    // Try to parse JSON with multiple strategies
    let json;
    
    // Strategy 1: Direct parse
    try {
      json = JSON.parse(text);
      console.log('✓ Direct JSON parse successful');
      return json;
    } catch (e) {
      console.log('Direct parse failed:', e.message);
    }
    
    // Strategy 2: Remove markdown code blocks
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      json = JSON.parse(cleanText);
      console.log('✓ JSON parse after markdown removal successful');
      return json;
    } catch (e) {
      console.log('Markdown removal failed:', e.message);
    }
    
    // Strategy 3: Extract JSON from text (find array boundaries)
    try {
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const extractedJson = text.substring(firstBracket, lastBracket + 1);
        json = JSON.parse(extractedJson);
        console.log('✓ JSON parse after array extraction successful');
        return json;
      }
    } catch (e) {
      console.log('Array extraction failed:', e.message);
    }
    
    // Strategy 4: Fix common JSON issues (escape quotes, newlines)
    try {
      let repairedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON array
      const firstBracket = repairedText.indexOf('[');
      if (firstBracket !== -1) {
        repairedText = repairedText.substring(firstBracket);
        
        // Try to find matching closing bracket
        let bracketCount = 0;
        let endIndex = -1;
        
        for (let i = 0; i < repairedText.length; i++) {
          if (repairedText[i] === '[') bracketCount++;
          if (repairedText[i] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
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
      console.log('Repair strategy failed:', e.message);
    }
    
    // All strategies failed
    console.error('=== All JSON parsing strategies failed ===');
    console.error('Full response text:');
    console.error(text);
    console.error('=== End of response ===');
    throw new Error(`Invalid JSON response from Gemini. Unable to parse response.`);
  } catch (error) {
    console.error('=== Error Details ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    throw new Error('Failed to generate menu items from Gemini: ' + error.message);
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
        maxOutputTokens: 8192, // Further increased to prevent truncation
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
You are a professional nutritionist and fitness advisor. Analyze the following menu items and provide calorie calculation and exercise recommendations.

Selected Menu Items:
${JSON.stringify(menuList, null, 2)}

IMPORTANT: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks.

Return a JSON object with this EXACT structure (no additional text before or after):
{
  "total_calories": <number>,
  "nutritional_breakdown": {
    "protein": "<grams>g",
    "carbohydrates": "<grams>g",
    "fats": "<grams>g",
    "fiber": "<grams>g"
  },
  "menu_details": [
    {
      "name": "<menu name>",
      "calories": <number>,
      "quantity": <number>,
      "subtotal_calories": <number>
    }
  ],
  "exercise_recommendations": [
    {
      "name": "<exercise name>",
      "duration_minutes": <number>,
      "intensity": "low|moderate|high",
      "calories_burned_per_hour": <number>,
      "description": "<brief description>",
      "tips": "<helpful tips>"
    }
  ],
  "health_notes": "<general health advice>",
  "summary": "<brief summary>"
}

Provide 3-5 exercise recommendations. Calculate TOTAL calories from all menu items considering quantities. Be accurate and realistic.

RESPOND WITH ONLY THE JSON OBJECT, NO MARKDOWN, NO EXPLANATIONS.
`;

    console.log('=== Calculate Calories Debug ===');
    console.log('Sending request to Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('Raw response length:', text.length);
    console.log('First 300 chars:', text.substring(0, 300));
    console.log('Last 300 chars:', text.substring(Math.max(0, text.length - 300)));
    
    // Advanced JSON extraction and repair
    let json;
    
    // Strategy 1: Direct parse
    try {
      json = JSON.parse(text);
      console.log('✓ Direct JSON parse successful');
      return json;
    } catch (e) {
      console.log('✗ Direct parse failed:', e.message);
    }
    
    // Strategy 2: Remove markdown and whitespace
    try {
      let cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s+|\s+$/g, '')
        .trim();
      
      json = JSON.parse(cleanText);
      console.log('✓ Parse after markdown removal successful');
      return json;
    } catch (e) {
      console.log('✗ Parse after markdown removal failed:', e.message);
    }
    
    // Strategy 3: Extract JSON object using brace matching
    try {
      const firstBrace = text.indexOf('{');
      
      if (firstBrace !== -1) {
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let endIndex = -1;
        
        for (let i = firstBrace; i < text.length; i++) {
          const char = text[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
        }
        
        if (endIndex !== -1) {
          const extractedJson = text.substring(firstBrace, endIndex);
          json = JSON.parse(extractedJson);
          console.log('✓ Parse after smart extraction successful');
          return json;
        }
      }
    } catch (e) {
      console.log('✗ Smart extraction failed:', e.message);
    }
    
    // Strategy 4: Try to repair truncated JSON
    try {
      let repairedText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const firstBrace = repairedText.indexOf('{');
      const lastBrace = repairedText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        repairedText = repairedText.substring(firstBrace, lastBrace + 1);
        
        // Try to fix common truncation issues
        // If it ends with incomplete string, close it
        if (repairedText.match(/:\s*"[^"]*$/)) {
          repairedText += '"}';
        }
        
        // If it ends with incomplete array, close it
        if (repairedText.match(/:\s*\[([^\]]*)$/)) {
          repairedText += ']}';
        }
        
        // Ensure proper closing
        const openBraces = (repairedText.match(/{/g) || []).length;
        const closeBraces = (repairedText.match(/}/g) || []).length;
        
        if (openBraces > closeBraces) {
          repairedText += '}'.repeat(openBraces - closeBraces);
        }
        
        json = JSON.parse(repairedText);
        console.log('✓ Parse after repair successful');
        return json;
      }
    } catch (e) {
      console.log('✗ Repair attempt failed:', e.message);
    }
    
    // All strategies failed - provide detailed error
    console.error('=== All JSON Parsing Strategies Failed ===');
    console.error('Full response text:');
    console.error(text);
    console.error('=== End Response ===');
    
    throw new Error(`Invalid JSON response from Gemini API. Response length: ${text.length}. The API may have returned truncated or malformed JSON. Please check the logs above for the full response.`);
  } catch (error) {
    console.error('=== Error in calculateCaloriesAndExercise ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('Invalid JSON')) {
      throw error;
    }
    throw new Error('Failed to calculate calories and generate exercise recommendations: ' + error.message);
  }
}

module.exports = { generateMenuItems, recommendMenus, calculateCaloriesAndExercise };
