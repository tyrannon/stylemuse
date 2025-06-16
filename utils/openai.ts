// Get API key from environment variable
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Add a safety check
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY not found in environment variables');
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
You are a professional fashion stylist providing style recommendations. Analyze the general fashion characteristics visible in this photo to suggest complementary clothing styles. Do not identify or describe the specific person.

Focus ONLY on these fashion styling aspects:
- General style aesthetic visible in the photo
- Color palette that would work well with the overall look
- Clothing fit recommendations based on the style shown
- Fashion categories that complement this aesthetic

Return ONLY this JSON format with general styling recommendations:

{
  "appearance": {
    "hair_color": "general hair tone category (light/medium/dark)",
    "hair_style": "general style category (short/medium/long, straight/wavy/curly)",
    "build": "general body type category for styling (petite/average/tall/athletic)",
    "complexion": "general tone category (fair/medium/olive/deep)",
    "facial_features": "general styling notes",
    "approximate_age_range": "general style age category"
  },
  "style_preferences": {
    "current_style_visible": "style aesthetic shown",
    "preferred_styles": ["complementary style categories"],
    "color_palette": ["recommended color categories"],
    "fit_preferences": "recommended clothing fits"
  },
  "outfit_generation_notes": "General styling guidance",
  "personalization_prompt": "A person with this general style aesthetic wearing fashionable clothing"
}

Focus on fashion styling advice, not personal identification.
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a fashion stylist providing general clothing and style recommendations. You do not identify specific individuals but focus on fashion aesthetics and styling advice."
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
    max_tokens: 500,
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
    console.log("✅ Style DNA API response:", json);
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

  // Create personalized prompt based on Style DNA
  let personalizedPrompt = `
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

Style: Contemporary fashion photography, similar to high-end clothing catalogs
`;

  // If Style DNA is available, personalize the prompt (focus on styling, not identification)
  if (styleDNA) {
    personalizedPrompt = `
Create a professional fashion photograph of a person wearing this complete outfit:

${detailedDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

STYLING PREFERENCES: Create an image with these general characteristics:
- Hair: ${styleDNA.appearance?.hair_color} tones, ${styleDNA.appearance?.hair_style} style
- Build: ${styleDNA.appearance?.build} build for proper fit demonstration
- Aesthetic: ${styleDNA.style_preferences?.preferred_styles?.join(', ')} styling
- Color harmony: Complement ${styleDNA.appearance?.complexion} tones

Style considerations:
- Fits should flatter a ${styleDNA.appearance?.build} build
- Color palette should harmonize with ${styleDNA.appearance?.complexion} tones
- Overall styling should reflect ${styleDNA.style_preferences?.preferred_styles?.join(', ')} aesthetics

Requirements:
- Full body shot showing the complete outfit clearly
- Professional fashion photography style with excellent lighting
- Clean, neutral background (white, light gray, or minimal)
- Model posed naturally to showcase how the pieces work together
- High quality, photorealistic style
- Focus on accurate color representation and fabric textures
- Demonstrate how these pieces create a cohesive, stylish look

Style: Contemporary fashion photography showcasing how these specific items work together for this aesthetic
`;
  }

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
      console.error("🚨 OpenAI Personalized Image Error:", res.status, errorText);
      throw new Error("OpenAI personalized image generation failed");
    }

    const json = await res.json();
    console.log("✅ Personalized outfit image response:", json);
    
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
- Humidity: ${weatherData.humidity}%
- Wind: ${weatherData.wind_speed} mph
- Location: ${weatherData.city}

STYLING FOR WEATHER:
- Ensure the outfit is appropriate for ${weatherData.temperature}°F weather
- Consider ${weatherData.description} conditions
- Show practical styling for this weather (layering, fabric choices, etc.)
- Make sure the person looks comfortable and appropriately dressed
`;
  }

  // Create personalized + weather-appropriate prompt
  let weatherOutfitPrompt = `
Create a professional fashion photograph of a stylish person wearing this weather-appropriate outfit:

${detailedDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

${weatherContext}
`;

  // Add Style DNA personalization if available
  if (styleDNA) {
    weatherOutfitPrompt += `
PERSONAL STYLING (Style DNA):
- Hair: ${styleDNA.appearance?.hair_color} tones, ${styleDNA.appearance?.hair_style} style
- Build: ${styleDNA.appearance?.build} build for proper fit demonstration
- Aesthetic: ${styleDNA.style_preferences?.preferred_styles?.join(', ')} styling
- Color harmony: Complement ${styleDNA.appearance?.complexion} tones
`;
  }

  weatherOutfitPrompt += `
REQUIREMENTS:
- Full body shot showing the complete outfit clearly
- Professional fashion photography style with excellent lighting
- Clean, neutral background (white, light gray, or minimal)
- Model posed naturally to showcase how the pieces work together
- High quality, photorealistic style
- Focus on accurate color representation and fabric textures
- Show confidence and comfort appropriate for the weather conditions
- Demonstrate how this outfit is perfectly suited for the current weather
- Model should look prepared and comfortable for ${weatherData?.temperature || 'current'}°F weather

WEATHER STYLING FOCUS:
${weatherData ? `
- Perfect comfort level for ${weatherData.temperature}°F
- Appropriate for ${weatherData.description} conditions
- Practical yet stylish for this specific weather
- Show how the outfit protects/suits this climate
` : '- Versatile styling suitable for various conditions'}

Style: Contemporary fashion photography showcasing weather-appropriate styling that's both practical and fashionable
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
    console.log("✅ Weather outfit image response:", json);
    
    return json?.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("❌ generateWeatherBasedOutfit Error:", error);
    throw error;
  }
}