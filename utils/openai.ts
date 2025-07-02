import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAIApiKey;

// More forgiving check for debugging
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not found in app config');
  // Don't throw immediately - let the functions handle it
}

export async function describeClothingItem(base64Image: string) {
  const prompt = `
You are an expert fashion stylist analyzing clothing items. Examine this image carefully and provide a detailed analysis focusing on accuracy for outfit generation.

Pay special attention to:
- EXACT colors (be specific: "navy blue", "cream white", "burgundy", not just "blue" or "white")
- Material/texture (cotton, denim, silk, wool, leather, etc.)
- Specific style details (collar type, sleeve length, cut, fit)
- Patterns (solid, striped, plaid, floral, etc.)
- Any unique design elements

Return ONLY raw JSON in this exact format:
{
  "title": "Specific item name with color (e.g., 'Navy Blue Denim Jacket', 'Cream Silk Blouse')",
  "description": "Detailed description including exact color, material, style details, and how it fits/drapes. Be specific about visual characteristics that would help recreate this item.",
  "tags": ["exact_color", "material_type", "style_category", "fit_type", "occasion", "pattern_if_any"],
  "color": "Primary color of the item (be very specific)",
  "material": "Primary material/fabric",
  "style": "Specific style category (e.g., 'blazer', 'crop top', 'high-waisted jeans')",
  "fit": "How it fits (e.g., 'slim fit', 'oversized', 'tailored', 'relaxed')"
}

Examples of good responses:
- Color: "dusty rose pink" not "pink"
- Material: "ribbed cotton knit" not "cotton"
- Style: "oversized boyfriend blazer" not "jacket"
- Fit: "high-waisted straight leg" not "pants"
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 400, // Increased for more detailed descriptions
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI API Error:", res.status, errorText);
      throw new Error("OpenAI request failed");
    }

    const json = await res.json();
    console.log("✅ OpenAI response:", json);
    return json?.choices?.[0]?.message?.content ?? "No description received";
  } catch (error) {
    console.error("❌ describeClothingItem Error:", error);
    throw error;
  }
}


export async function generateOutfitImage(clothingItems: any[]) {
  // Create a more detailed prompt using the enhanced item data
  const detailedDescriptions = clothingItems.map(item => {
    // If item has the enhanced structure, use detailed info
    if (item.color && item.material && item.style) {
      return `${item.color} ${item.material} ${item.style} with ${item.fit} fit - ${item.description}`;
    }
    // Fallback to just description for older items
    return item.description || item;
  });

  const outfitPrompt = `
Create a professional fashion photograph of a stylish person wearing this complete outfit:

${detailedDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Requirements:
- Full body shot showing the complete outfit clearly
- Professional fashion photography style with excellent lighting
- Clean, neutral background (white, light gray, or minimal)
- Model posed naturally to showcase how the pieces work together
- High quality, photorealistic style
- Focus on accurate color representation and fabric textures
- Show how these specific pieces complement each other as a cohesive look
- If the sample images show a female model, generate a female image
- If the sample images show a male mode, generate a male image

Style: Contemporary fashion photography, similar to high-end clothing catalogs
`;

  const payload = {
    model: "dall-e-3",
    prompt: outfitPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Image API Error:", res.status, errorText);
      throw new Error("OpenAI image generation failed");
    }

    const json = await res.json();
    console.log("✅ OpenAI image response:", json);
    
    return json?.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("❌ generateOutfitImage Error:", error);
    throw error;
  }
}

// Function to analyze personal style from an image and return Style DNA
export async function analyzePersonalStyle(base64Image: string) {
  const prompt = `
You are a fashion consultant analyzing clothing style preferences and general aesthetic elements for outfit coordination purposes. Focus ONLY on fashion styling aspects.

Analyze these STYLING ELEMENTS from the photo:
- Hair styling choices that influence fashion decisions
- General body proportions for clothing fit recommendations
- Color coordination preferences based on overall aesthetic
- Fashion style category and aesthetic preferences shown
- Styling elements that complement the overall look

Return styling recommendations in this JSON format:

{
  "appearance": {
    "hair_color": "general color family (warm brown, cool blonde, dark, etc.)",
    "hair_length": "general length category (short, medium, long)",
    "hair_texture": "general texture (straight, wavy, curly)",
    "build": "general styling category (petite, average, tall, athletic, etc.)",
    "complexion": "general tone for color coordination (warm, cool, neutral)",
    "age_range": "general style demographic (20s, 30s, etc.)"
  },
  "style_preferences": {
    "aesthetic_shown": "current style aesthetic visible",
    "recommended_styles": ["complementary fashion styles"],
    "color_harmony": ["color families that work well"],
    "fit_recommendations": "clothing fits that work well",
    "styling_notes": "general fashion coordination notes"
  },
  "outfit_coordination": "Guidelines for creating coordinated looks",
  "fashion_prompt": "General styling description for creating coordinated fashion looks"
}

Focus purely on fashion styling and coordination advice.
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a fashion styling consultant who provides general clothing coordination advice. You analyze fashion aesthetics and styling elements without focusing on personal identification. Your goal is to help coordinate clothing and colors effectively."
      },
      {
        role: "user", 
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 400,
    temperature: 0.5,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Style DNA Error:", res.status, errorText);
      throw new Error("OpenAI style analysis failed");
    }

    const json = await res.json();
    console.log("✅ Safe Style DNA response:", json);
    return json?.choices?.[0]?.message?.content ?? "No analysis received";
  } catch (error) {
    console.error("❌ analyzePersonalStyle Error:", error);
    throw error;
  }
}

// Function to generate a personalized outfit image based on clothing items and Style DNA
export async function generatePersonalizedOutfitImage(clothingItems: any[], styleDNA: any = null, gender: string | null = null) {
  // Create detailed clothing descriptions
  const detailedDescriptions = clothingItems.map(item => {
    if (item.color && item.material && item.style) {
      return `${item.color} ${item.material} ${item.style} with ${item.fit} fit - ${item.description}`;
    }
    return item.description || item;
  });

  let personalizedPrompt = `
Create a professional fashion photograph of a stylish person wearing this complete outfit:

${detailedDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}
`;

  // Add gender specification if provided
  if (gender) {
    const genderText = gender === 'male' ? 'masculine' : 
                      gender === 'female' ? 'feminine' : 
                      'non-binary';
    personalizedPrompt += `
GENDER IDENTITY: The model should have a ${genderText} appearance and styling appropriate for ${genderText} fashion.
`;
  }

  // Add the same detailed personalization as above
  if (styleDNA && styleDNA.appearance) {
    personalizedPrompt += `
DETAILED PHYSICAL CHARACTERISTICS (for accurate visualization):
- Hair: ${styleDNA.appearance.hair_color} hair, ${styleDNA.appearance.hair_length}, ${styleDNA.appearance.hair_texture}
- Hair Style: ${styleDNA.appearance.hair_style}
- Build: ${styleDNA.appearance.build} build, ${styleDNA.appearance.height_impression} height
- Skin: ${styleDNA.appearance.complexion} complexion with natural undertones
- Face: ${styleDNA.appearance.facial_structure} facial structure
- Eyes: ${styleDNA.appearance.eye_color} eyes
- Age: ${styleDNA.appearance.approximate_age_range} appearance
- Overall Vibe: ${styleDNA.appearance.overall_vibe} aesthetic

STYLING SPECIFICATIONS:
- Model should have the exact hair characteristics described above
- Body proportions should match the ${styleDNA.appearance.build} build description
- Skin tone should accurately reflect ${styleDNA.appearance.complexion}
- Facial features should align with ${styleDNA.appearance.facial_structure}
- Overall styling should reflect ${styleDNA.appearance.overall_vibe} aesthetic
- Age appearance should match ${styleDNA.appearance.approximate_age_range}

IMPORTANT: Create a person who matches these specific physical characteristics exactly.
`;
  }

  personalizedPrompt += `
PHOTOGRAPHY REQUIREMENTS:
- Full body shot showing the complete outfit clearly
- Professional fashion photography with excellent lighting
- Clean, neutral background (white or light gray)
- Model posed naturally to showcase outfit coordination
- High quality, photorealistic style
- Accurate color representation and fabric textures
- Show confidence and personal style

Style: High-end fashion photography showcasing perfect outfit coordination for this specific person.
`;

  const payload = {
    model: "dall-e-3",
    prompt: personalizedPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Enhanced Personalized Image Error:", res.status, errorText);
      throw new Error("OpenAI enhanced personalized image generation failed");
    }

    const json = await res.json();
    console.log("✅ Enhanced personalized outfit response:", json);
    
    return json?.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("❌ generatePersonalizedOutfitImage Error:", error);
    throw error;
  }
}

// Function to generate a weather-based outfit image
export async function generateWeatherBasedOutfit(clothingItems: any[], styleDNA: any = null, weatherData: any = null, gender: string | null = null) {
  // Create detailed clothing descriptions
  const detailedDescriptions = clothingItems.map(item => {
    if (item.color && item.material && item.style) {
      return `${item.color} ${item.material} ${item.style} with ${item.fit} fit - ${item.description}`;
    }
    return item.description || item;
  });

  // Create weather context
  let weatherContext = "";
  if (weatherData) {
    weatherContext = `
WEATHER CONTEXT:
- Temperature: ${weatherData.temperature}°F (feels like ${weatherData.feels_like}°F)
- Conditions: ${weatherData.description}
- Location: ${weatherData.city}

WEATHER STYLING:
- Outfit appropriate for ${weatherData.temperature}°F
- Suitable for ${weatherData.description} conditions
- Practical and stylish for this weather
`;
  }

  let weatherOutfitPrompt = `
Create a professional fashion photograph of a stylish person wearing this outfit:

${detailedDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

${weatherContext}
`;

  // Add gender specification if provided
  if (gender) {
    const genderText = gender === 'male' ? 'masculine' : 
                      gender === 'female' ? 'feminine' : 
                      'non-binary';
    weatherOutfitPrompt += `
GENDER IDENTITY: The model should have a ${genderText} appearance and styling appropriate for ${genderText} fashion.
`;
  }

  // Add general styling preferences if available (much less specific)
  if (styleDNA && styleDNA.appearance) {
    weatherOutfitPrompt += `
STYLING PREFERENCES:
- Hair: ${styleDNA.appearance.hair_color} ${styleDNA.appearance.hair_length} hair with ${styleDNA.appearance.hair_texture} texture
- Build: ${styleDNA.appearance.build} build for proper fit demonstration  
- Aesthetic: ${styleDNA.style_preferences?.aesthetic_shown} style
- Color coordination: Works well with ${styleDNA.appearance.complexion} tones
- Age styling: ${styleDNA.appearance.age_range} appropriate fashion

STYLING GUIDELINES:
- Show how these pieces work for a ${styleDNA.appearance.build} build
- Color choices should complement ${styleDNA.appearance.complexion} undertones
- Overall styling should reflect a ${styleDNA.style_preferences?.aesthetic_shown} aesthetic
- Demonstrate proper fit for this body type
`;
  }

  weatherOutfitPrompt += `
REQUIREMENTS:
- Professional fashion photography with excellent lighting
- Full body shot showing complete outfit coordination
- Clean, neutral background
- Model posed naturally to show outfit details
- High quality, photorealistic style
- Focus on outfit coordination and styling
- Show confidence and style appropriate for the weather

Style: Contemporary fashion photography showcasing excellent outfit coordination.
`;

  const payload = {
    model: "dall-e-3",
    prompt: weatherOutfitPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Weather Outfit Error:", res.status, errorText);
      throw new Error("OpenAI weather outfit generation failed");
    }

    const json = await res.json();
    console.log("✅ Safe weather outfit response:", json);
    
    return json?.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("❌ generateWeatherBasedOutfit Error:", error);
    throw error;
  }
}

// Generate Image for Text-Only Clothing Items

/**
 * Generate a product-style image for a text-only clothing item
 */
export async function generateClothingItemImage(item: any): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found for clothing item image generation");
    return null;
  }

  console.log('🎨 Generating image for clothing item:', item.title || item.description);

  // Build detailed prompt for the clothing item
  const itemPrompt = `Create a high-quality, professional product photograph of ${item.description || item.title}.

Details:
- Item: ${item.title || item.description}
- Category: ${item.category || 'clothing'}
${item.color ? `- Color: ${item.color}` : ''}
${item.material ? `- Material: ${item.material}` : ''}
${item.style ? `- Style: ${item.style}` : ''}
${item.fit ? `- Fit/Size: ${item.fit}` : ''}
${item.tags?.filter(tag => !tag.includes('brand:') && tag !== 'text-entry').join(', ') ? `- Additional details: ${item.tags.filter(tag => !tag.includes('brand:') && tag !== 'text-entry').join(', ')}` : ''}

Photography requirements:
- Clean white or light gray background
- Professional product photography lighting
- Item displayed on mannequin or laid flat (whichever shows the item best)
- High resolution, sharp focus, detailed texture
- Commercial product photography style
- Show the item clearly from front view
- Natural colors that accurately represent the ${item.color || 'described'} color
- No people, just the clothing item itself
- Studio lighting that highlights material texture and details

Style: Professional e-commerce product photography, clean, commercial, high-quality.`;

  const payload = {
    model: "dall-e-3",
    prompt: itemPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Clothing Item Image Error:", res.status, errorText);
      throw new Error("OpenAI clothing item image generation failed");
    }

    const json = await res.json();
    console.log("✅ Clothing item image generated successfully");
    
    return json?.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("❌ generateClothingItemImage Error:", error);
    throw error;
  }
}

// Style Advice AI Functions

/**
 * Generate optimized search query for finding similar items online
 */
export async function generateItemSearchQuery(wardrobeItem: any): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found for search query generation");
    // Return fallback search query
    return {
      primaryTerms: [wardrobeItem.title || 'clothing item'],
      alternativeTerms: wardrobeItem.tags || [],
      category: wardrobeItem.category || 'Fashion',
      keyAttributes: [wardrobeItem.color, wardrobeItem.material, wardrobeItem.style].filter(Boolean),
      attributesToAvoid: [],
    };
  }

  const prompt = `You are a fashion search expert. Analyze this clothing item and generate optimal search terms for finding similar items online.

Item Details:
- Title: ${wardrobeItem.title || 'Unknown'}
- Description: ${wardrobeItem.description || 'No description'}
- Color: ${wardrobeItem.color || 'Unknown'}
- Material: ${wardrobeItem.material || 'Unknown'}
- Style: ${wardrobeItem.style || 'Unknown'}
- Category: ${wardrobeItem.category || 'Fashion'}
- Tags: ${wardrobeItem.tags?.join(', ') || 'None'}

IMPORTANT: Respond with ONLY valid JSON, no explanations or additional text.

Required JSON format:
{
  "primaryTerms": ["term1", "term2", "term3"],
  "alternativeTerms": ["alt1", "alt2"],
  "category": "Fashion",
  "keyAttributes": ["attr1", "attr2"],
  "attributesToAvoid": ["avoid1", "avoid2"]
}

All arrays must contain strings. Focus on searchable terms for online shopping.`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 300,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Search Query Error:", res.status, errorText);
      throw new Error("OpenAI search query generation failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Clean and parse JSON response
    try {
      // Clean the response text
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Remove any leading/trailing text that isn't JSON
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      const searchQuery = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!searchQuery.primaryTerms || !Array.isArray(searchQuery.primaryTerms)) {
        throw new Error('Invalid primaryTerms structure');
      }
      
      console.log("✅ Generated search query:", searchQuery);
      return searchQuery;
      
    } catch (parseError) {
      console.error("❌ Failed to parse search query JSON:", parseError);
      console.log("Raw response:", responseText);
      
      // Return fallback with better defaults
      return {
        primaryTerms: [wardrobeItem.title || 'clothing item'].filter(Boolean),
        alternativeTerms: wardrobeItem.tags || [],
        category: wardrobeItem.category || 'Fashion',
        keyAttributes: [wardrobeItem.color, wardrobeItem.material, wardrobeItem.style].filter(Boolean),
        attributesToAvoid: [],
      };
    }

  } catch (error) {
    console.error("❌ generateItemSearchQuery Error:", error);
    // Return fallback search query
    return {
      primaryTerms: [wardrobeItem.title || 'clothing item'],
      alternativeTerms: wardrobeItem.tags || [],
      category: wardrobeItem.category || 'Fashion',
      keyAttributes: [wardrobeItem.color, wardrobeItem.material, wardrobeItem.style].filter(Boolean),
      attributesToAvoid: [],
    };
  }
}

/**
 * Analyze outfit completion needs
 */
export async function analyzeOutfitCompletion(outfitItems: any[], occasion?: string, season?: string): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found for outfit completion analysis");
    return {
      missingSlots: [],
      suggestions: [],
      completionConfidence: 0,
      reasoning: "AI analysis unavailable"
    };
  }

  const itemDescriptions = outfitItems.map(item => 
    `${item.title} (${item.category}) - ${item.color} ${item.material} ${item.style}`
  ).join(', ');

  const prompt = `
Analyze this outfit and identify what's missing to make it complete:

Current items: ${itemDescriptions}
Occasion: ${occasion || 'general/casual'}
Season: ${season || 'current'}

Identify:
1. missingSlots: Array of missing essential pieces (e.g., ["shoes", "jacket"])
2. suggestions: Array of specific item suggestions for each missing slot
3. completionConfidence: Score 0-100 for how complete the current outfit is
4. reasoning: Brief explanation of what's missing and why

Respond in JSON format:
{
  "missingSlots": ["shoes", "jacket"],
  "suggestions": [
    {
      "slot": "shoes",
      "recommendation": "white sneakers or loafers",
      "reasoning": "casual footwear to match the relaxed style"
    }
  ],
  "completionConfidence": 75,
  "reasoning": "Outfit is mostly complete but needs appropriate footwear"
}
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.4,
    max_tokens: 400,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Outfit Completion Error:", res.status, errorText);
      throw new Error("OpenAI outfit completion analysis failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    try {
      const analysis = JSON.parse(responseText);
      console.log("✅ Outfit completion analysis:", analysis);
      return analysis;
    } catch (parseError) {
      console.error("❌ Failed to parse outfit completion JSON:", parseError);
      return {
        missingSlots: [],
        suggestions: [],
        completionConfidence: 50,
        reasoning: "Analysis available but parsing failed"
      };
    }

  } catch (error) {
    console.error("❌ analyzeOutfitCompletion Error:", error);
    return {
      missingSlots: [],
      suggestions: [],
      completionConfidence: 0,
      reasoning: "Analysis failed"
    };
  }
}

/**
 * Evaluate style compatibility between items
 */
export async function evaluateStyleCompatibility(wardrobeItem: any, onlineItem: any): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found for style compatibility evaluation");
    return {
      overall: 50,
      colorHarmony: 50,
      styleConsistency: 50,
      occasionAppropriate: 50,
      seasonalCompatibility: 50,
      reasoning: "AI evaluation unavailable"
    };
  }

  const prompt = `
Evaluate the style compatibility between these two items:

Existing wardrobe item: 
- Title: ${wardrobeItem.title}
- Description: ${wardrobeItem.description}
- Color: ${wardrobeItem.color}
- Material: ${wardrobeItem.material}
- Style: ${wardrobeItem.style}
- Category: ${wardrobeItem.category}

Potential new item:
- Title: ${onlineItem.title}
- Description: ${onlineItem.description}
- Category: ${onlineItem.category}

Score compatibility (0-100) based on:
1. colorHarmony: How well the colors work together
2. styleConsistency: How well the styles match
3. occasionAppropriate: Suitable for same occasions
4. seasonalCompatibility: Work for same seasons
5. overall: Overall compatibility score

Respond in JSON format:
{
  "overall": 85,
  "colorHarmony": 90,
  "styleConsistency": 80,
  "occasionAppropriate": 85,
  "seasonalCompatibility": 85,
  "reasoning": "Both items share a casual aesthetic with complementary colors"
}
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 300,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Style Compatibility Error:", res.status, errorText);
      throw new Error("OpenAI style compatibility evaluation failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    try {
      const compatibility = JSON.parse(responseText);
      console.log("✅ Style compatibility scores:", compatibility);
      return compatibility;
    } catch (parseError) {
      console.error("❌ Failed to parse compatibility JSON:", parseError);
      return {
        overall: 50,
        colorHarmony: 50,
        styleConsistency: 50,
        occasionAppropriate: 50,
        seasonalCompatibility: 50,
        reasoning: "Evaluation available but parsing failed"
      };
    }

  } catch (error) {
    console.error("❌ evaluateStyleCompatibility Error:", error);
    return {
      overall: 50,
      colorHarmony: 50,
      styleConsistency: 50,
      occasionAppropriate: 50,
      seasonalCompatibility: 50,
      reasoning: "Evaluation failed"
    };
  }
}

export async function generateIntelligentOutfitSelection(wardrobeItems: any[], context: any, styleDNA: any = null): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ No OpenAI API key found for intelligent outfit selection');
    return null;
  }

  const prompt = `You are an expert fashion stylist with years of experience in creating perfectly coordinated outfits. Your task is to analyze the user's wardrobe and create an intelligent, stylish outfit based on the given context.

USER'S WARDROBE:
${wardrobeItems.map((item, index) => `
${index + 1}. ${item.title || 'Untitled'}
   - Color: ${item.color || 'not specified'}
   - Material: ${item.material || 'not specified'}
   - Style: ${item.style || 'not specified'}
   - Fit: ${item.fit || 'not specified'}
   - Category: ${item.category || 'unknown'}
   - Description: ${item.description || 'no description'}
   - Tags: ${item.tags ? item.tags.join(', ') : 'none'}
`).join('')}

OUTFIT CONTEXT:
- Occasion: ${context.occasion}
- Location: ${context.location}
- Weather: ${context.weather}${context.temperature ? ` (${context.temperature}°F)` : ''}
- Time of day: ${context.time}
- Style goal: ${context.style}

${styleDNA ? `USER'S STYLE DNA:
- Personal style: ${styleDNA.style_preferences?.current_style_visible || 'not specified'}
- Preferred styles: ${styleDNA.style_preferences?.preferred_styles?.join(', ') || 'not specified'}
- Color palette: ${styleDNA.style_preferences?.color_palette?.join(', ') || 'not specified'}
- Fit preferences: ${styleDNA.style_preferences?.fit_preferences || 'not specified'}
- Build: ${styleDNA.appearance?.build || 'not specified'}
` : ''}

STYLING REQUIREMENTS:
1. Select items that work together harmoniously in terms of color, style, and formality level
2. Ensure the outfit is appropriate for the specified occasion and location
3. Consider weather conditions and practicality
4. Match the user's style goals and personal preferences
5. Create a cohesive look that shows fashion expertise
6. If certain categories are missing better items, note what would improve the outfit

For each category (top, bottom, shoes, jacket, hat, accessories), either:
- Select the BEST item from the wardrobe that fits the context
- Leave empty if no suitable item exists or if not needed for this outfit

CRITICAL: Only select items that genuinely work well together. Don't force selections if items don't coordinate properly.

Return ONLY raw JSON in this exact format:
{
  "outfit": {
    "top": "exact title of selected top item or null",
    "bottom": "exact title of selected bottom item or null", 
    "shoes": "exact title of selected shoes or null",
    "jacket": "exact title of selected jacket/outerwear or null",
    "hat": "exact title of selected hat or null",
    "accessories": "exact title of selected accessory or null"
  },
  "reasoning": "Detailed explanation of why these items work together, addressing color coordination, style harmony, appropriateness for the context, and overall aesthetic appeal",
  "styleScore": 85,
  "missingItems": [
    {
      "category": "category name",
      "description": "specific item that would improve this outfit",
      "reason": "why this item would enhance the look"
    }
  ],
  "colorPalette": ["primary color", "secondary color", "accent color"],
  "formality": "casual/business casual/formal/athletic/etc",
  "confidence": 92
}`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a professional fashion stylist with expertise in color theory, style coordination, and outfit curation. You create sophisticated, well-coordinated outfits that are both stylish and appropriate for the context."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.3, // Lower temperature for more consistent, professional styling decisions
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("🚨 OpenAI Intelligent Outfit Selection Error:", res.status, errorText);
      throw new Error("OpenAI intelligent outfit selection failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    try {
      // Clean the response
      let cleanResult = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*{/, '{')
        .replace(/}[^}]*$/, '}')
        .trim();

      const outfitSelection = JSON.parse(cleanResult);
      console.log("✅ Intelligent outfit selection:", outfitSelection);
      return outfitSelection;
    } catch (parseError) {
      console.error("❌ Failed to parse outfit selection JSON:", parseError);
      console.error("Raw response:", responseText);
      return null;
    }

  } catch (error) {
    console.error("❌ generateIntelligentOutfitSelection Error:", error);
    return null;
  }
}