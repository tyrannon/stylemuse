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