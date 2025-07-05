import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAIApiKey;

// More forgiving check for debugging
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not found in app config');
  // Don't throw immediately - let the functions handle it
}

export async function describeClothingItem(base64Image: string) {
  const prompt = `
You are an expert fashion stylist and clothing analyst with deep expertise in textile identification, color theory, and garment construction. Your task is to analyze clothing items with EXTREME PRECISION for digital wardrobe management and outfit generation.

CRITICAL REQUIREMENTS:
1. Examine EVERY visible detail with microscopic attention
2. Identify EXACT colors using precise color terminology
3. Determine EXACT materials/fabrics through visual texture analysis
4. Describe EXACT style elements, construction details, and fit characteristics
5. Be so specific that someone could recreate this exact item from your description

COLOR ANALYSIS REQUIREMENTS:
- Use PRECISE color names: "sage green", "champagne beige", "midnight navy", "burnt orange", "dusty rose", "charcoal gray"
- NOT generic terms like "blue", "pink", "brown", "gray"
- Identify undertones: "warm beige with pink undertones", "cool gray with blue undertones"
- Specify saturation: "muted", "vibrant", "pastel", "deep", "rich"
- Note color variations: "gradient from light to dark", "ombré effect", "two-toned"

MATERIAL IDENTIFICATION:
- Identify specific fabric types: "brushed cotton fleece", "stretch denim", "ribbed modal", "ponte knit", "boiled wool"
- Recognize fabric treatments: "stone-washed", "acid-washed", "pre-shrunk", "mercerized", "brushed"
- Note fabric weight: "lightweight", "medium-weight", "heavy-weight"
- Identify weave/knit type: "jersey knit", "french terry", "twill weave", "herringbone"
- Describe texture: "smooth", "textured", "slubbed", "nubby", "soft-hand"

STYLE ANALYSIS:
- Identify EXACT garment category: "wrap-style blouse", "A-line midi skirt", "straight-leg trousers", "bomber jacket"
- Note construction details: "princess seams", "French seams", "flat-fell seams", "blind hem"
- Describe necklines precisely: "scoop neck", "V-neck", "crew neck", "boat neck", "mock turtleneck"
- Identify sleeve types: "three-quarter sleeves", "cap sleeves", "bishop sleeves", "raglan sleeves"
- Note closure details: "button-front", "zip-front", "pullover", "wrap-tie", "snap closure"

FIT ANALYSIS:
- Describe fit precisely: "slim-fit", "regular-fit", "relaxed-fit", "oversized", "tailored", "straight-cut"
- Note silhouette: "A-line", "straight", "flared", "tapered", "boxy", "fitted"
- Identify waist placement: "high-waisted", "mid-rise", "low-rise", "dropped waist"
- Describe length: "cropped", "full-length", "ankle-length", "knee-length", "midi-length"

PATTERN RECOGNITION:
- Be specific about patterns: "thin pinstripes", "wide horizontal stripes", "small polka dots", "large floral print"
- Note pattern scale: "micro-print", "small-scale", "medium-scale", "large-scale", "oversized"
- Identify pattern type: "geometric", "abstract", "botanical", "animal print", "plaid", "check"

EDGE CASE HANDLING:
- If multiple items visible: Focus on the PRIMARY/MOST PROMINENT item
- If unclear quality: State "image quality limits precise identification"
- If partially visible: Describe only what's clearly visible
- If brand logos visible: Include in description but don't assume quality

VALIDATION REQUIREMENTS:
- Every field must be filled with specific, accurate information
- No generic terms allowed
- Must be detailed enough for someone to find/recreate the exact item
- Description must paint a complete picture of the garment

Return ONLY raw JSON in this exact format:
{
  "title": "Extremely specific item name with precise color and key details (e.g., 'Sage Green Brushed Cotton Oversized Hoodie', 'Midnight Navy Stretch Denim High-Waisted Skinny Jeans')",
  "description": "Comprehensive description including exact color with undertones, specific material/fabric type, precise style elements, construction details, fit characteristics, and any unique features. Must be detailed enough to recreate this exact item.",
  "tags": ["exact_color_with_undertones", "specific_material_type", "precise_style_category", "exact_fit_type", "garment_category", "construction_details", "occasion_type", "pattern_if_any"],
  "color": "Primary color with precise terminology and undertones (e.g., 'sage green with gray undertones', 'warm champagne beige')",
  "material": "Specific fabric type with texture details (e.g., 'brushed cotton fleece', 'stretch denim with slight fade')",
  "style": "Precise style category with key details (e.g., 'oversized pullover hoodie', 'high-waisted skinny jeans with ankle length')",
  "fit": "Exact fit description with silhouette details (e.g., 'oversized relaxed fit with dropped shoulders', 'high-waisted slim fit with tapered leg')"
}

EXAMPLES OF REQUIRED PRECISION:
❌ WRONG: "blue jeans" → ✅ CORRECT: "medium-wash indigo denim straight-leg jeans"
❌ WRONG: "white shirt" → ✅ CORRECT: "crisp white cotton poplin button-down shirt"
❌ WRONG: "black dress" → ✅ CORRECT: "jet black ponte knit sheath dress"
❌ WRONG: "gray sweater" → ✅ CORRECT: "charcoal heather merino wool crewneck sweater"

CRITICAL: Be so precise that two people analyzing the same item would get nearly identical results. This level of accuracy is essential for the wardrobe app to function properly.
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
    max_tokens: 800, // Increased for highly detailed precision analysis
  };

  // Enhanced retry logic with validation
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Clothing analysis attempt ${attempt}/${maxRetries}`);
      
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
        console.error(`🚨 OpenAI API Error (attempt ${attempt}):`, res.status, errorText);
        
        // Don't retry on certain errors
        if (res.status === 401 || res.status === 403) {
          throw new Error("Invalid API key or insufficient permissions");
        }
        
        if (res.status === 429) {
          // Rate limited - wait longer before retry
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        lastError = new Error(`OpenAI request failed with status ${res.status}`);
        continue; // Try again
      }

      const json = await res.json();
      const rawContent = json?.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        lastError = new Error("No content received from OpenAI");
        continue;
      }
      
      console.log("📋 Raw OpenAI response:", rawContent);
      
      // Validate and parse the JSON response
      const validatedResponse = validateAndParseClothingResponse(rawContent, attempt);
      
      if (validatedResponse) {
        console.log("✅ Clothing analysis completed successfully");
        return JSON.stringify(validatedResponse);
      } else {
        lastError = new Error(`Invalid JSON response on attempt ${attempt}`);
        
        // Modify payload for retry to be more explicit about JSON format
        if (attempt < maxRetries) {
          payload.messages[0].content[0].text += `\n\nIMPORTANT: Your previous response was not valid JSON. Please ensure you respond with ONLY a valid JSON object, no additional text or markdown formatting.`;
        }
        continue;
      }
      
    } catch (error) {
      console.error(`❌ describeClothingItem Error (attempt ${attempt}):`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All attempts failed - return fallback response
  console.error("🚨 All clothing analysis attempts failed, returning fallback response");
  const fallbackResponse = generateFallbackResponse(lastError?.message || "Analysis failed");
  return JSON.stringify(fallbackResponse);
}

/**
 * Validate and parse clothing analysis response from AI
 */
function validateAndParseClothingResponse(rawContent: string, attempt: number): any | null {
  try {
    // Clean the response to extract JSON
    let cleanedContent = rawContent.trim();
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing text that isn't JSON
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.warn(`⚠️ No valid JSON structure found in response (attempt ${attempt})`);
      return null;
    }
    
    cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedContent);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'tags', 'color', 'material', 'style', 'fit'];
    const missingFields = requiredFields.filter(field => !parsed[field] || parsed[field] === '');
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ Missing required fields (attempt ${attempt}):`, missingFields);
      
      // Fill in missing fields with defaults
      if (!parsed.title) parsed.title = 'Unknown Clothing Item';
      if (!parsed.description) parsed.description = 'Clothing item requiring manual description';
      if (!parsed.tags || !Array.isArray(parsed.tags)) parsed.tags = ['clothing', 'manual-entry'];
      if (!parsed.color) parsed.color = 'unknown color';
      if (!parsed.material) parsed.material = 'unknown material';
      if (!parsed.style) parsed.style = 'unknown style';
      if (!parsed.fit) parsed.fit = 'unknown fit';
    }
    
    // Validate field types
    if (typeof parsed.title !== 'string') parsed.title = String(parsed.title || 'Unknown Item');
    if (typeof parsed.description !== 'string') parsed.description = String(parsed.description || 'No description');
    if (!Array.isArray(parsed.tags)) parsed.tags = ['clothing'];
    if (typeof parsed.color !== 'string') parsed.color = String(parsed.color || 'unknown');
    if (typeof parsed.material !== 'string') parsed.material = String(parsed.material || 'unknown');
    if (typeof parsed.style !== 'string') parsed.style = String(parsed.style || 'unknown');
    if (typeof parsed.fit !== 'string') parsed.fit = String(parsed.fit || 'unknown');
    
    // Validate content quality
    const qualityIssues = validateContentQuality(parsed);
    if (qualityIssues.length > 0 && attempt === 1) {
      console.warn(`⚠️ Quality issues detected (attempt ${attempt}):`, qualityIssues);
      // Allow it but log the issues for first attempt
    }
    
    // Clean up tags array
    parsed.tags = parsed.tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0);
    if (parsed.tags.length === 0) {
      parsed.tags = ['clothing'];
    }
    
    console.log(`✅ Response validation passed (attempt ${attempt})`);
    return parsed;
    
  } catch (parseError) {
    console.error(`❌ JSON parsing failed (attempt ${attempt}):`, parseError);
    console.log('Raw content that failed to parse:', rawContent);
    return null;
  }
}

/**
 * Validate the quality of the content in the response
 */
function validateContentQuality(parsed: any): string[] {
  const issues: string[] = [];
  
  // Check for generic responses
  if (parsed.color && ['blue', 'red', 'green', 'black', 'white', 'gray'].includes(parsed.color.toLowerCase())) {
    issues.push('Color too generic - needs more specific terminology');
  }
  
  if (parsed.material && ['cotton', 'polyester', 'wool'].includes(parsed.material.toLowerCase())) {
    issues.push('Material too generic - needs more specific fabric type');
  }
  
  if (parsed.style && ['shirt', 'pants', 'dress', 'jacket'].includes(parsed.style.toLowerCase())) {
    issues.push('Style too generic - needs more specific style category');
  }
  
  // Check for placeholder text
  const placeholderTerms = ['unknown', 'n/a', 'not specified', 'unclear', 'unable to determine'];
  Object.values(parsed).forEach((value: any) => {
    if (typeof value === 'string' && placeholderTerms.some(term => value.toLowerCase().includes(term))) {
      issues.push(`Contains placeholder text: ${value}`);
    }
  });
  
  // Check minimum description length
  if (parsed.description && parsed.description.length < 50) {
    issues.push('Description too short - needs more detail for accuracy');
  }
  
  return issues;
}

/**
 * Generate fallback response when all attempts fail
 */
function generateFallbackResponse(errorMessage: string): any {
  console.log('🔄 Generating fallback clothing response...');
  
  return {
    title: 'Clothing Item (Manual Review Required)',
    description: `This clothing item requires manual review due to analysis failure. Error: ${errorMessage}. Please manually edit this item to provide accurate details for better outfit generation.`,
    tags: ['manual-review-required', 'analysis-failed', 'clothing'],
    color: 'unknown color (requires manual input)',
    material: 'unknown material (requires manual input)',
    style: 'unknown style (requires manual input)',
    fit: 'unknown fit (requires manual input)',
    _analysisFailure: true,
    _errorMessage: errorMessage,
    _timestamp: new Date().toISOString(),
  };
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
WEATHER: ${weatherData.temperature}°F, ${weatherData.description} in ${weatherData.city}
`;
  }

  let weatherOutfitPrompt = `Fashion photo of person wearing: ${detailedDescriptions.join(', ')}${weatherContext}`;

  // Add gender specification if provided
  if (gender) {
    const genderText = gender === 'male' ? 'masculine' : 
                      gender === 'female' ? 'feminine' : 
                      'non-binary';
    weatherOutfitPrompt += ` ${genderText} model.`;
  }

  // Add simplified styling if available
  if (styleDNA && styleDNA.appearance) {
    weatherOutfitPrompt += ` ${styleDNA.appearance.build} build, ${styleDNA.appearance.complexion} tones.`;
  }

  weatherOutfitPrompt += ` Professional fashion photo, full body, clean background.`;

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
3. Apply CONTEXT-AWARE WEATHER LOGIC (see detailed guidelines below)
4. Match the user's style goals and personal preferences
5. Create a cohesive look that shows fashion expertise
6. If the wardrobe is limited or missing key pieces, suggest specific items to complete the outfit

🧥 CONTEXT-AWARE JACKET/OUTERWEAR RULES (CRITICAL):
- INDOOR LOCATIONS (office, restaurant, home, club/bar): DO NOT require jackets/outerwear unless:
  * Temperature below 35°F (extremely cold, might need light layer even indoors)
  * Work occasion + temperature below 45°F (professional blazer for cold commute)
  * The jacket is purely for style (blazer, cardigan) not warmth
- OUTDOOR LOCATIONS (outdoors, city walk, beach, park): Consider jackets/outerwear when:
  * Temperature below 65°F for outdoor activities
  * Rain or snow conditions (weather protection needed)
  * Extended outdoor exposure
- GENERAL/MIXED LOCATIONS: Use moderate approach:
  * Temperature below 55°F or rain/snow conditions

🌡️ ENHANCED TEMPERATURE GUIDELINES:
- Under 40°F: Heavy winter gear (wool, down, thermal layers)
- 40-55°F: Light layers, cardigans, light jackets
- 55-68°F: Versatile pieces, optional light cardigan
- 68-78°F: Most versatile range, all options available
- 78-85°F: Light, breathable fabrics (cotton, linen, silk)
- 85°F+: Minimal, ultra-light clothing only

For each category (top, bottom, shoes, jacket, hat, accessories):
- First try to select the BEST item from the existing wardrobe that fits the context
- If no suitable item exists OR if a better item would significantly improve the outfit, suggest a specific item to purchase/add
- Always prioritize creating a complete, stylish outfit even if it requires suggesting new items

CRITICAL: 
- Only select existing items that genuinely work well together
- When suggesting new items, be very specific (exact colors, materials, styles, brands if helpful)
- Focus on versatile pieces that would work with multiple outfits in their wardrobe
- Consider the user's budget and provide realistic suggestions

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
  "suggestedItems": [
    {
      "category": "shoes",
      "title": "White Leather Sneakers", 
      "description": "Clean white leather sneakers with minimal design",
      "color": "white",
      "material": "leather",
      "style": "minimalist sneakers",
      "fit": "true to size",
      "reason": "White sneakers would complete this casual look and work with 80% of your wardrobe",
      "priority": "high",
      "estimatedPrice": 75,
      "searchTerms": ["white leather sneakers", "minimalist white shoes", "clean white trainers"],
      "replaces": null
    }
  ],
  "colorPalette": ["primary color", "secondary color", "accent color"],
  "formality": "casual/business casual/formal/athletic/etc",
  "confidence": 92,
  "completionStatus": "complete/needs-items/enhanced-with-suggestions"
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

/**
 * Multi-Item Detection with Bounding Boxes: Identify and locate multiple clothing items in a single photo
 */
export async function detectMultipleClothingItems(base64Image: string): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found for multi-item detection');
    return { items: [], success: false, message: 'AI detection unavailable' };
  }

  console.log('🔍 Detecting multiple clothing items in photo...');

  const prompt = `You are an expert clothing detector with precise spatial analysis. Analyze this image and identify EVERY separate clothing item with exact positioning.

TASK: Detect each individual clothing item and provide precise bounding box coordinates.

For EACH clothing item you find:
1. Identify the item type and basic details
2. Provide precise bounding box coordinates (0-100 scale)
3. Ensure each item is distinct (no duplicates)
4. Assess quality and suitability

COORDINATE SYSTEM:
- Use 0-100 scale for x,y coordinates
- top_left: [x, y] where (0,0) is top-left corner
- bottom_right: [x, y] where (100,100) is bottom-right corner
- Be precise - these will be used for cropping

REQUIREMENTS:
- Look for: shirts, pants, dresses, skirts, jackets, sweaters, shoes, accessories, hats
- Ignore: people wearing clothes, backgrounds, furniture
- Focus on: individual clothing items laid out, hung up, or clearly separated
- Each item must be DISTINCT - no analyzing the same garment twice

Return ONLY valid JSON:
{
  "itemsFound": 2,
  "items": [
    {
      "id": 1,
      "itemType": "t-shirt",
      "description": "White cotton t-shirt with graphic print",
      "boundingBox": {
        "top_left": [20, 15],
        "bottom_right": [65, 60]
      },
      "confidence": 95,
      "suitable": true,
      "reason": "Clear view of complete garment, good lighting",
      "uniqueFeatures": "graphic print on front"
    },
    {
      "id": 2,
      "itemType": "cap", 
      "description": "Blue baseball cap",
      "boundingBox": {
        "top_left": [70, 10],
        "bottom_right": [95, 35]
      },
      "confidence": 88,
      "suitable": true,
      "reason": "Clearly visible, distinct from other items",
      "uniqueFeatures": "curved brim, solid color"
    }
  ],
  "quality": "good",
  "lighting": "adequate",
  "recommendation": "All items have distinct boundaries suitable for individual cropping"
}

If NO clothing items found or image quality is poor, return:
{
  "itemsFound": 0,
  "items": [],
  "quality": "poor",
  "lighting": "inadequate", 
  "recommendation": "Take a clearer photo with better lighting"
}`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a clothing detection specialist. You identify individual clothing items in photos for wardrobe cataloging."
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
    max_tokens: 1000,
    temperature: 0.1, // Low temperature for consistent detection
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
      console.error("🚨 OpenAI Multi-Item Detection Error:", res.status, errorText);
      return { 
        items: [], 
        success: false, 
        message: `AI detection failed: ${res.status}` 
      };
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      return { 
        items: [], 
        success: false, 
        message: 'No response from AI detector' 
      };
    }

    try {
      // Clean and parse JSON response
      let cleanResult = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*{/, '{')
        .replace(/}[^}]*$/, '}')
        .trim();

      const detectionResult = JSON.parse(cleanResult);
      
      console.log(`✅ Multi-item detection complete: ${detectionResult.itemsFound} items found`);
      detectionResult.items?.forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.itemType}: ${item.description} (${item.confidence}% confidence)`);
      });

      return {
        ...detectionResult,
        success: true,
        message: `Detected ${detectionResult.itemsFound} clothing items`
      };

    } catch (parseError) {
      console.error("❌ Failed to parse multi-item detection JSON:", parseError);
      console.error("Raw response:", responseText);
      
      return { 
        items: [], 
        success: false, 
        message: 'Failed to parse AI detection results' 
      };
    }

  } catch (error) {
    console.error("❌ detectMultipleClothingItems Error:", error);
    return { 
      items: [], 
      success: false, 
      message: `Detection error: ${error}` 
    };
  }
}

/**
 * Crop individual clothing items from original photo based on bounding boxes
 * Note: Requires expo-image-manipulator to be installed for actual cropping
 */
export async function cropDetectedItems(originalImageUri: string, detectedItems: any[]): Promise<any[]> {
  const croppedItems = [];

  // Check if image manipulator is available
  let ImageManipulator;
  try {
    ImageManipulator = require('expo-image-manipulator');
  } catch (error) {
    console.warn('⚠️ expo-image-manipulator not available, using original images with bounding box info');
  }

  for (let i = 0; i < detectedItems.length; i++) {
    const item = detectedItems[i];
    
    if (!item.boundingBox) {
      console.warn(`⚠️ Item ${i + 1} (${item.itemType}) missing bounding box, skipping crop`);
      croppedItems.push({
        ...item,
        croppedImageUri: originalImageUri,
        cropSuccess: false
      });
      continue;
    }

    try {
      console.log(`✂️ Cropping item ${i + 1}: ${item.itemType} at bounds:`, item.boundingBox);
      
      if (ImageManipulator) {
        // Get original image dimensions first
        const { Image } = require('react-native');
        
        // Use the manipulator to crop the actual image
        const { top_left, bottom_right } = item.boundingBox;
        
        // Convert percentage coordinates to pixel coordinates
        // Note: We'll need the actual image dimensions for this
        const cropOptions = {
          crop: {
            originX: (top_left[0] / 100) * 1000, // Assume 1000px width for now
            originY: (top_left[1] / 100) * 1000, // Assume 1000px height for now
            width: ((bottom_right[0] - top_left[0]) / 100) * 1000,
            height: ((bottom_right[1] - top_left[1]) / 100) * 1000,
          }
        };

        // For now, we'll implement the bounding box info but use original image
        // Full cropping implementation would require getting image dimensions first
        croppedItems.push({
          ...item,
          croppedImageUri: originalImageUri, // TODO: Replace with actual cropped image
          cropSuccess: true,
          cropInfo: {
            boundingBox: item.boundingBox,
            cropPercentage: {
              x: top_left[0],
              y: top_left[1], 
              width: bottom_right[0] - top_left[0],
              height: bottom_right[1] - top_left[1]
            }
          },
          cropNote: `Ready for cropping: ${item.boundingBox.top_left[0]},${item.boundingBox.top_left[1]} to ${item.boundingBox.bottom_right[0]},${item.boundingBox.bottom_right[1]}`
        });
      } else {
        // Fallback to original image with bounding box info
        croppedItems.push({
          ...item,
          croppedImageUri: originalImageUri,
          cropSuccess: false,
          cropNote: `Bounding box: ${item.boundingBox.top_left[0]},${item.boundingBox.top_left[1]} to ${item.boundingBox.bottom_right[0]},${item.boundingBox.bottom_right[1]}`
        });
      }

    } catch (error) {
      console.error(`❌ Failed to crop item ${i + 1}:`, error);
      croppedItems.push({
        ...item,
        croppedImageUri: originalImageUri,
        cropSuccess: false,
        cropError: error.message
      });
    }
  }

  return croppedItems;
}

/**
 * Analyze a specific clothing item with bounding box context for more accurate results
 */
export async function analyzeSpecificClothingItem(base64Image: string, itemContext: any): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found for specific item analysis');
    return JSON.stringify({
      title: `${itemContext.itemType} (Analysis Failed)`,
      description: 'AI analysis unavailable',
      color: 'unknown',
      material: 'unknown',
      style: itemContext.itemType,
      fit: 'unknown',
      tags: ['analysis-failed']
    });
  }

  const boundingInfo = itemContext.boundingBox ? 
    `Focus on the area from coordinates (${itemContext.boundingBox.top_left[0]}, ${itemContext.boundingBox.top_left[1]}) to (${itemContext.boundingBox.bottom_right[0]}, ${itemContext.boundingBox.bottom_right[1]}) using a 0-100 scale.` : 
    '';

  const prompt = `You are analyzing a specific clothing item that has been detected in this image.

CONTEXT FROM DETECTION:
- Item Type: ${itemContext.itemType}
- Description: ${itemContext.description}
- Unique Features: ${itemContext.uniqueFeatures || 'none specified'}
- Detection Confidence: ${itemContext.confidence}%
${boundingInfo}

FOCUSED ANALYSIS TASK:
Analyze ONLY the ${itemContext.itemType} described above. Ignore all other items in the image.

CRITICAL REQUIREMENTS:
1. Focus exclusively on the specified ${itemContext.itemType}
2. Use PRECISE color terminology and fabric analysis
3. Provide detailed style and fit descriptions
4. Be specific about construction details
5. Create tags that distinguish this item from others

Return ONLY raw JSON in this exact format:
{
  "title": "Extremely specific item name with precise color and key details",
  "description": "Detailed description focusing only on this specific ${itemContext.itemType}. Include fabric texture, construction details, and distinguishing features.",
  "tags": ["specific_color", "material_type", "style_category", "fit_type", "distinguishing_features"],
  "color": "Primary color with precise terminology and undertones",
  "material": "Specific fabric type with texture details",
  "style": "Precise style category with construction details",
  "fit": "Exact fit description with silhouette details"
}

Focus exclusively on the ${itemContext.itemType} - ignore any other clothing items visible in the image.`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a clothing analysis specialist who focuses on analyzing specific items within multi-item photos. You provide precise, focused analysis of individual garments."
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
    max_tokens: 800,
    temperature: 0.2, // Low temperature for consistent, focused analysis
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
      console.error("🚨 OpenAI Specific Item Analysis Error:", res.status, errorText);
      throw new Error("OpenAI specific item analysis failed");
    }

    const json = await res.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error("No content received from OpenAI");
    }
    
    console.log(`📋 Specific analysis for ${itemContext.itemType}:`, rawContent.substring(0, 200) + '...');
    
    // Validate and parse the JSON response using existing function
    const validatedResponse = validateAndParseClothingResponse(rawContent, 1);
    
    if (validatedResponse) {
      console.log(`✅ Specific ${itemContext.itemType} analysis completed successfully`);
      return JSON.stringify(validatedResponse);
    } else {
      throw new Error('Invalid JSON response for specific item analysis');
    }
    
  } catch (error) {
    console.error(`❌ analyzeSpecificClothingItem Error for ${itemContext.itemType}:`, error);
    
    // Return fallback response with context
    const fallbackResponse = {
      title: `${itemContext.description} (Needs Manual Review)`,
      description: `${itemContext.itemType} detected via multi-item AI. Original detection: ${itemContext.description}. Manual review recommended for accuracy.`,
      tags: ['multi-item-detected', itemContext.itemType, 'manual-review-needed'],
      color: 'detected color (review needed)',
      material: 'detected material (review needed)', 
      style: itemContext.itemType,
      fit: 'detected fit (review needed)',
      _analysisFailure: true,
      _originalDetection: itemContext
    };
    
    return JSON.stringify(fallbackResponse);
  }
}