const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const GeneratedMenuModel = require('../models/generatedMenuModel');
const CalorieCalculationModel = require('../models/calorieCalculationModel');

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
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    });

    console.log('Model initialized, calling generateContent...');
    const result = await model.generateContent(prompt);
    console.log('generateContent completed');
    
    const response = await result.response;
    console.log('Response received');
    
    const text = response.text();
    console.log('=== RAW GEMINI RESPONSE ===');
    console.log('Response text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Full response text:', text);
    console.log('=== END RAW RESPONSE ===');
    
    // With responseMimeType: "application/json", the response should be valid JSON
    let json;
    
    // Strategy 1: Direct parse (should work with JSON mode)
    try {
      json = JSON.parse(text);
      console.log('✓ Direct JSON parse successful');
      console.log('Parsed JSON type:', Array.isArray(json) ? 'array' : typeof json);
      console.log('Items count:', Array.isArray(json) ? json.length : 'N/A');
      return json;
    } catch (e) {
      console.log('Direct parse failed:', e.message);
    }
    
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

async function generateMenuItemsAndSave(prompt) {
  try {
    // Generate menu items using Gemini
    const menuItems = await generateMenuItems(prompt);
    
    // Save to database
    const savedGeneration = await GeneratedMenuModel.create({
      prompt: prompt,
      menu_items: menuItems,
      generation_metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        items_count: Array.isArray(menuItems) ? menuItems.length : 0
      }
    });
    
    return {
      menu_items: menuItems,
      saved_id: savedGeneration.id,
      saved: true
    };
  } catch (error) {
    console.error('Error generating and saving menu items:', error);
    throw error;
  }
}

async function recommendMenus(preferences, availableMenus) {
  try {
    console.log('=== Recommend Menus Debug ===');
    console.log('Preferences:', preferences);
    console.log('Available menus count:', availableMenus.length);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
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

    // Group menus by category - more flexible matching
    const mainCourses = availableMenus.filter(m => {
      const cat = m.category?.toLowerCase() || '';
      return cat.includes('makanan berat') || cat.includes('main') || cat.includes('food');
    });
    const beverages = availableMenus.filter(m => {
      const cat = m.category?.toLowerCase() || '';
      return cat.includes('minuman') || cat.includes('beverage') || cat.includes('drink');
    });
    const desserts = availableMenus.filter(m => {
      const cat = m.category?.toLowerCase() || '';
      return cat.includes('dessert') || cat.includes('makanan ringan') || cat.includes('snack');
    });

    console.log(`Found: ${mainCourses.length} main, ${beverages.length} beverages, ${desserts.length} desserts`);

    // Simplify menu data to reduce token usage
    const simplifyMenu = (menu) => ({
      id: menu.id,
      name: menu.name,
      category: menu.category,
      price: menu.price,
      calories: menu.calories,
      ingredients: Array.isArray(menu.ingredients) ? menu.ingredients : []
    });

    // Build menu lists (limit to prevent token overflow)
    const mainList = mainCourses.slice(0, 20).map(simplifyMenu);
    const beverageList = beverages.slice(0, 15).map(simplifyMenu);
    const dessertList = desserts.slice(0, 15).map(simplifyMenu);

    const prompt = `
You are a professional food recommendation system. Based on user preferences and available menu items, recommend a complete meal.

User Preferences:
${budget ? `- Budget: Rp ${budget}` : '- Budget: No limit'}
${dietary_restrictions && dietary_restrictions.length > 0 ? `- Dietary Restrictions: ${dietary_restrictions.join(', ')}` : ''}
${dislikes && dislikes.length > 0 ? `- Dislikes: ${dislikes.join(', ')}` : ''}
${userPreferences && userPreferences.length > 0 ? `- Likes: ${userPreferences.join(', ')}` : ''}
${meal_type ? `- Meal Type: ${meal_type}` : ''}
${cuisine ? `- Cuisine: ${cuisine}` : ''}
${occasion ? `- Occasion: ${occasion}` : ''}
${additional_notes ? `- Notes: ${additional_notes}` : ''}

Available Menus:
Main Courses: ${JSON.stringify(mainList)}
Beverages: ${JSON.stringify(beverageList)}
Desserts: ${JSON.stringify(dessertList)}

Requirements:
1. Select ONLY from the available menus above
2. Use exact details (id, name, price, calories, ingredients) from database
3. Avoid items with ingredients the user dislikes
4. Respect dietary restrictions
5. Stay within budget if specified
6. Provide balanced meal

Return JSON with this structure:
{
  "recommendations": {
    "main_course": {
      "id": number,
      "name": "exact name from database",
      "category": "exact category",
      "description": "from database",
      "price": number,
      "calories": number,
      "ingredients": ["array"],
      "reason": "why recommended"
    },
    "beverage": {
      "id": number,
      "name": "exact name",
      "category": "exact category",
      "description": "from database",
      "price": number,
      "calories": number,
      "ingredients": ["array"],
      "reason": "why recommended"
    },
    "dessert": {
      "id": number,
      "name": "exact name",
      "category": "exact category",
      "description": "from database",
      "price": number,
      "calories": number,
      "ingredients": ["array"],
      "reason": "why recommended"
    }
  },
  "total_price": number,
  "total_calories": number,
  "summary": "brief summary"
}
`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response received, length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    // With JSON mode, should be direct JSON
    let json;
    try {
      json = JSON.parse(text);
      console.log('✓ Recommendations parsed successfully');
      return json;
    } catch (e) {
      console.log('Direct parse failed, trying cleanup:', e.message);
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      json = JSON.parse(cleanText);
      console.log('✓ Recommendations parsed after cleanup');
      return json;
    }
  } catch (error) {
    console.error('=== Error generating menu recommendations ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
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
        maxOutputTokens: 8192,
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
You are a professional nutritionist and fitness advisor. Analyze the following menu items and provide calorie calculation and exercise recommendations.

Selected Menu Items:
${JSON.stringify(menuList, null, 2)}

Return a JSON object with this EXACT structure:
{
  "total_calories": number,
  "nutritional_breakdown": {
    "protein": "string with unit (e.g., '50g')",
    "carbohydrates": "string with unit",
    "fats": "string with unit",
    "fiber": "string with unit"
  },
  "menu_details": [
    {
      "name": "menu name",
      "calories": number,
      "quantity": number,
      "subtotal_calories": number
    }
  ],
  "exercise_recommendations": [
    {
      "exercise": "exercise name (e.g., 'Brisk Walking', 'Jogging', 'Swimming')",
      "duration": number (in minutes),
      "calories_burned": number (total calories burned in that duration),
      "intensity": "low|moderate|high",
      "description": "brief description of the exercise"
    }
  ],
  "health_notes": "general health advice",
  "summary": "brief summary"
}

Requirements:
- Calculate TOTAL calories from all menu items considering quantities
- Provide 3-5 realistic exercise recommendations
- Each exercise should burn significant calories (50-500 kcal range)
- Duration should be realistic (10-60 minutes)
- calories_burned is TOTAL calories burned for the specified duration, not per hour

Example exercise_recommendations item:
{
  "exercise": "Brisk Walking",
  "duration": 30,
  "calories_burned": 150,
  "intensity": "moderate",
  "description": "Walk at a pace where you can talk but are slightly breathless"
}

Return ONLY valid JSON, no markdown, no code blocks, no explanations.
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

async function calculateCaloriesAndExerciseAndSave(menuItems) {
  try {
    // Calculate calories and exercise using Gemini
    const calculationResult = await calculateCaloriesAndExercise(menuItems);
    
    // Save to database
    const savedCalculation = await CalorieCalculationModel.create({
      menu_items: menuItems,
      total_calories: calculationResult.total_calories,
      nutritional_breakdown: calculationResult.nutritional_breakdown,
      menu_details: calculationResult.menu_details,
      exercise_recommendations: calculationResult.exercise_recommendations,
      health_notes: calculationResult.health_notes,
      summary: calculationResult.summary
    });
    
    return {
      ...calculationResult,
      saved_id: savedCalculation.id,
      saved: true
    };
  } catch (error) {
    console.error('Error calculating and saving calories:', error);
    throw error;
  }
}

module.exports = { 
  generateMenuItems, 
  generateMenuItemsAndSave,
  recommendMenus, 
  calculateCaloriesAndExercise,
  calculateCaloriesAndExerciseAndSave
};
