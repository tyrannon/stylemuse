// Get API key from environment variable
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// More forgiving check for debugging
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
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
export async function generatePersonalizedOutfitImage(clothingItems: any[], styleDNA: any = null) {
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
export async function generateWeatherBasedOutfit(clothingItems: any[], styleDNA: any = null, weatherData: any = null) {
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