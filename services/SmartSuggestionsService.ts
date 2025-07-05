import { WardrobeItem } from '../hooks/useWardrobeData';
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAIApiKey;

// Data structures for smart suggestions
export interface SuggestedItem {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  material: string;
  style: string;
  fit: string;
  amazonUrl: string;
  price: number;
  imageUrl: string;
  reasoning: string; // AI explanation for why this item
  isPlaceholder: boolean;
  searchTerms: string[];
}

export interface SmartSuggestion {
  id: string;
  outfitName: string;
  occasion: string;
  items: (WardrobeItem | SuggestedItem)[];
  explanation: string;
  confidence: number;
  missingItems: SuggestedItem[];
  createdAt: Date;
  styleTips: string[];
}

export interface UserStyleProfile {
  age?: number;
  gender?: 'male' | 'female' | 'nonbinary';
  stylePreference?: 'casual' | 'formal' | 'trendy' | 'classic' | 'bohemian' | 'minimalist';
  occasion?: 'work' | 'casual' | 'date' | 'party' | 'sports' | 'travel';
  budget?: 'low' | 'medium' | 'high';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  bodyType?: string;
  colorPreferences?: string[];
}

/**
 * Generate smart outfit suggestions for users with empty or limited wardrobes
 */
export async function generateSmartOutfitSuggestions(
  existingItems: WardrobeItem[],
  userProfile: UserStyleProfile,
  styleDNA?: any
): Promise<SmartSuggestion[]> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found for smart suggestions');
    return [];
  }

  console.log('🧠 Generating smart outfit suggestions for user profile:', userProfile);

  const prompt = `You are an expert fashion stylist helping someone build a stylish wardrobe from scratch. Your goal is to suggest complete, cohesive outfits that work well together and provide maximum versatility.

USER PROFILE:
- Age: ${userProfile.age || 'not specified'}
- Gender: ${userProfile.gender || 'not specified'}
- Style preference: ${userProfile.stylePreference || 'versatile/classic'}
- Occasion needs: ${userProfile.occasion || 'general versatility'}
- Budget range: ${userProfile.budget || 'medium'} budget
- Season: ${userProfile.season || 'current season'}
- Body type: ${userProfile.bodyType || 'not specified'}
- Color preferences: ${userProfile.colorPreferences?.join(', ') || 'versatile colors'}

EXISTING WARDROBE ITEMS:
${existingItems.length > 0 ? 
  existingItems.map((item, index) => `
  ${index + 1}. ${item.title || 'Untitled'} (${item.category})
     - Color: ${item.color || 'not specified'}
     - Material: ${item.material || 'not specified'}
     - Style: ${item.style || 'not specified'}
     - Description: ${item.description}
  `).join('')
  : 'Currently empty - need to build from scratch'
}

${styleDNA ? `USER'S STYLE DNA:
- Personal aesthetic: ${styleDNA.style_preferences?.aesthetic_shown || 'not specified'}
- Build: ${styleDNA.appearance?.build || 'not specified'}
- Complexion: ${styleDNA.appearance?.complexion || 'not specified'}
- Age range: ${styleDNA.appearance?.age_range || 'not specified'}
` : ''}

TASK: Generate 3 complete outfit suggestions that:
1. CREATE BALANCED OUTFITS mixing existing wardrobe items with 1-3 new suggested items per outfit
2. Use 2-3 existing wardrobe items as the foundation for each outfit
3. Suggest 1-3 new complementary pieces to enhance and complete each look
4. Create complete outfits with at least 4-5 items (top, bottom, shoes, outerwear/accessories)
5. Focus on versatile, high-quality new pieces that work in multiple combinations
6. Stay within the specified budget range
7. Match the user's style preferences and lifestyle needs
8. Ensure each outfit has proper layering and accessories for a complete look

For each outfit, recommend specific items with:
- Exact titles and descriptions for Amazon search
- Why each piece was chosen (reasoning)
- How it coordinates with other pieces  
- Price estimates in their budget range
- IMPORTANT: Mark "isFromWardrobe": true for existing items, "isFromWardrobe": false for new suggestions
- EACH OUTFIT MUST INCLUDE AT LEAST 1-2 NEW ITEMS TO PURCHASE (isFromWardrobe: false)

Return ONLY raw JSON in this exact format:
{
  "suggestions": [
    {
      "outfitName": "Versatile Casual Foundation",
      "occasion": "everyday wear, casual outings",
      "explanation": "This outfit focuses on building a versatile foundation that can be dressed up or down",
      "confidence": 92,
      "styleTips": [
        "Layer the cardigan for cooler weather",
        "Roll up jeans for a more casual look"
      ],
      "items": [
        {
          "category": "top",
          "title": "Black V-Neck T-Shirt",
          "description": "Sleek black cotton v-neck t-shirt for a modern look",
          "color": "black",
          "material": "cotton",
          "style": "v-neck t-shirt",
          "fit": "modern",
          "reasoning": "Using an existing wardrobe piece as the foundation - versatile and pairs well with multiple bottoms",
          "searchTerms": [],
          "estimatedPrice": 0,
          "isFromWardrobe": true
        },
        {
          "category": "bottom", 
          "title": "Black Jeans",
          "description": "Classic black jeans",
          "color": "black",
          "material": "denim",
          "style": "straight leg",
          "fit": "regular",
          "reasoning": "Perfect existing wardrobe staple that pairs with the top",
          "searchTerms": [],
          "estimatedPrice": 0,
          "isFromWardrobe": true
        },
        {
          "category": "shoes",
          "title": "Crisp White Leather Sneakers", 
          "description": "Clean white leather sneakers with classic design",
          "color": "white",
          "material": "leather",
          "style": "sneakers",
          "fit": "standard",
          "reasoning": "Existing comfortable sneakers that complete the casual look",
          "searchTerms": [],
          "estimatedPrice": 0,
          "isFromWardrobe": true
        },
        {
          "category": "outerwear",
          "title": "Light Wash Denim Jacket",
          "description": "Classic light wash denim jacket for layering",
          "color": "light blue",
          "material": "denim", 
          "style": "classic denim jacket",
          "fit": "relaxed",
          "reasoning": "Adds texture and completes the outfit - suggest only if not in wardrobe",
          "searchTerms": ["light wash denim jacket women", "classic jean jacket", "casual denim outerwear"],
          "estimatedPrice": 50,
          "isFromWardrobe": false
        }
      ]
    }
  ]
}

Focus on building a smart, versatile wardrobe that maximizes outfit combinations!`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a professional wardrobe consultant and fashion stylist specializing in helping people build versatile, stylish wardrobes from scratch. You understand color theory, style coordination, and how to maximize outfit possibilities with minimal pieces."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 4000, // Increased for complete outfit suggestions
    temperature: 0.4, // Balanced creativity with practical suggestions
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
      console.error("🚨 OpenAI Smart Suggestions Error:", res.status, errorText);
      throw new Error("OpenAI smart suggestions failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    try {
      // Clean and repair the response
      let cleanResult = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*{/, '{')
        .trim();

      // Handle truncated responses - if it doesn't end with }, try to fix it
      if (!cleanResult.endsWith('}')) {
        // Find the last complete suggestion
        const lastCompleteMatch = cleanResult.lastIndexOf('    }');
        if (lastCompleteMatch > -1) {
          cleanResult = cleanResult.substring(0, lastCompleteMatch + 5) + '\n  ]\n}';
        } else {
          // If we can't salvage it, throw an error
          throw new Error('Response appears truncated and cannot be repaired');
        }
      }

      console.log('📝 Cleaned AI response:', cleanResult.substring(0, 500) + '...');
      const suggestionsData = JSON.parse(cleanResult);
      
      // Transform the response into SmartSuggestion format
      const smartSuggestions: SmartSuggestion[] = suggestionsData.suggestions.map((suggestion: any) => {
        const missingItems = suggestion.items.filter((item: any) => !item.isFromWardrobe);
        console.log(`🛍️ Outfit "${suggestion.outfitName}": ${missingItems.length} new items to purchase`);
        missingItems.forEach((item: any) => console.log(`  - ${item.title} ($${item.estimatedPrice})`));
        
        return {
          id: `smart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          outfitName: suggestion.outfitName,
          occasion: suggestion.occasion,
          explanation: suggestion.explanation,
          confidence: suggestion.confidence,
          styleTips: suggestion.styleTips || [],
          createdAt: new Date(),
          items: suggestion.items.map((item: any) => ({
            ...item,
            id: `suggested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isPlaceholder: !item.isFromWardrobe,
            amazonUrl: '', // Will be filled in by Amazon integration
            price: item.estimatedPrice || 0,
            imageUrl: '', // Will be filled in by image generation
            tags: item.searchTerms || []
          })),
          missingItems
        };
      });

      console.log("✅ Generated smart outfit suggestions:", smartSuggestions.length, "outfits");
      return smartSuggestions;

    } catch (parseError) {
      console.error("❌ Failed to parse smart suggestions JSON:", parseError);
      console.error("Raw response:", responseText);
      return [];
    }

  } catch (error) {
    console.error("❌ generateSmartOutfitSuggestions Error:", error);
    return [];
  }
}

/**
 * Generate specific item recommendations to complete an outfit
 */
export async function generateItemRecommendations(
  category: string,
  existingOutfitItems: WardrobeItem[],
  userProfile: UserStyleProfile
): Promise<SuggestedItem[]> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found for item recommendations');
    return [];
  }

  const prompt = `You are a fashion expert helping someone find the perfect ${category} to complete their outfit.

EXISTING OUTFIT ITEMS:
${existingOutfitItems.map(item => `
- ${item.title} (${item.category}): ${item.color} ${item.material} ${item.style}
  Description: ${item.description}
`).join('')}

USER PROFILE:
- Style preference: ${userProfile.stylePreference || 'versatile'}
- Budget: ${userProfile.budget || 'medium'}
- Occasion: ${userProfile.occasion || 'casual'}
- Gender: ${userProfile.gender || 'not specified'}

TASK: Recommend 3 specific ${category} items that would complete this outfit perfectly.

For each recommendation, provide:
- Specific product title for Amazon search
- Detailed description
- Color that coordinates with existing items
- Material and style details
- Why it works with the existing pieces
- Search terms for finding it online

Return ONLY raw JSON:
{
  "recommendations": [
    {
      "title": "Black Leather Ankle Boots",
      "description": "Classic black leather ankle boots with low heel",
      "category": "${category}",
      "color": "black",
      "material": "leather",
      "style": "ankle boots",
      "fit": "true to size",
      "reasoning": "Black leather boots will ground the outfit and add sophistication while coordinating with the existing pieces",
      "searchTerms": ["black leather ankle boots women", "low heel ankle boots", "classic black boots"],
      "estimatedPrice": 75
    }
  ]
}`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a fashion consultant specializing in outfit completion and item coordination."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 800,
    temperature: 0.3,
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
      console.error("🚨 OpenAI Item Recommendations Error:", res.status, errorText);
      throw new Error("OpenAI item recommendations failed");
    }

    const json = await res.json();
    const responseText = json?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    try {
      let cleanResult = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*{/, '{')
        .replace(/}[^}]*$/, '}')
        .trim();

      const recommendationsData = JSON.parse(cleanResult);
      
      const suggestedItems: SuggestedItem[] = recommendationsData.recommendations.map((rec: any) => ({
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        color: rec.color,
        material: rec.material,
        style: rec.style,
        fit: rec.fit,
        reasoning: rec.reasoning,
        searchTerms: rec.searchTerms || [],
        price: rec.estimatedPrice || 0,
        amazonUrl: '', // Will be filled by Amazon integration
        imageUrl: '', // Will be filled by image generation
        isPlaceholder: true
      }));

      console.log(`✅ Generated ${suggestedItems.length} item recommendations for ${category}`);
      return suggestedItems;

    } catch (parseError) {
      console.error("❌ Failed to parse item recommendations JSON:", parseError);
      console.error("Raw response:", responseText);
      return [];
    }

  } catch (error) {
    console.error("❌ generateItemRecommendations Error:", error);
    return [];
  }
}

/**
 * Analyze wardrobe gaps and suggest essential items
 */
export async function analyzeWardrobeGaps(
  existingItems: WardrobeItem[],
  userProfile: UserStyleProfile
): Promise<{
  essentialMissing: string[];
  recommendations: SuggestedItem[];
  priorities: { category: string; priority: number; reasoning: string }[];
}> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found for wardrobe gap analysis');
    return {
      essentialMissing: [],
      recommendations: [],
      priorities: []
    };
  }

  const prompt = `Analyze this wardrobe and identify essential gaps for building a complete, versatile wardrobe.

CURRENT WARDROBE:
${existingItems.length > 0 ? 
  existingItems.map((item, index) => `
  ${index + 1}. ${item.title} (${item.category}) - ${item.color} ${item.style}
  `).join('')
  : 'Empty wardrobe - starting from scratch'
}

USER PROFILE:
- Lifestyle: ${userProfile.occasion || 'general/casual'}
- Style: ${userProfile.stylePreference || 'versatile'}
- Budget: ${userProfile.budget || 'medium'}
- Gender: ${userProfile.gender || 'not specified'}

TASK: Identify the most essential missing pieces for a functional, stylish wardrobe.

Return ONLY raw JSON:
{
  "essentialMissing": ["category names of missing essentials"],
  "priorities": [
    {
      "category": "top",
      "priority": 10,
      "reasoning": "White button-down shirt is the most versatile foundational piece"
    }
  ],
  "recommendations": [
    {
      "title": "Essential item name",
      "category": "category",
      "reasoning": "Why this is essential",
      "estimatedPrice": 45
    }
  ]
}`;

  // Implementation similar to other functions...
  // For brevity, returning mock data for now
  console.log('🔍 Analyzing wardrobe gaps...');
  
  return {
    essentialMissing: ['top', 'bottom', 'shoes'],
    recommendations: [],
    priorities: [
      { category: 'top', priority: 10, reasoning: 'Most versatile foundational piece' },
      { category: 'bottom', priority: 9, reasoning: 'Essential for complete outfits' },
      { category: 'shoes', priority: 8, reasoning: 'Completes the look' }
    ]
  };
}