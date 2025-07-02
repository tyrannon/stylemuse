import { EnhancedStyleDNA } from '../types/Avatar';

export const generateAvatarPrompt = (styleDNA: EnhancedStyleDNA, externalGender?: string | null): string => {
  // Extract key information
  const personalInfo = styleDNA.personal_info || {};
  const physicalAttributes = styleDNA.physical_attributes || {};
  const styleProfile = styleDNA.style_profile || {};
  const lifestyle = styleDNA.lifestyle || {};

  // Build detailed prompt components
  const ageRange = personalInfo.age_range || '25-35';
  const gender = personalInfo.gender || externalGender || 'nonbinary';
  
  // Physical attributes
  const skinTone = physicalAttributes.skin_tone || 'Medium';
  const hairColor = physicalAttributes.hair_color || 'brown';
  const hairLength = physicalAttributes.hair_length || 'Medium';
  const hairStyle = physicalAttributes.hair_style || 'Straight';
  const bodyType = physicalAttributes.body_type || 'Rectangle';
  const eyeColor = physicalAttributes.eye_color || 'brown';

  // Style preferences
  const styleArchetypes = styleProfile.style_archetypes || [];
  const favoriteColors = styleProfile.color_preferences?.favorite_colors || [];
  const fashionGoals = styleProfile.fashion_goals || [];

  // Lifestyle
  const occupation = lifestyle.occupation || '';
  const lifestyleFactors = lifestyle.lifestyle || [];

  // Build the prompt
  let prompt = `Create a high-quality, professional portrait of a ${ageRange} year old ${gender} person. `;

  // Physical description
  prompt += `They have ${skinTone.toLowerCase()} skin tone, `;
  
  // Hair description
  if (hairLength === 'Bald') {
    prompt += `a bald head, `;
  } else {
    prompt += `${hairLength.toLowerCase()} ${hairColor.toLowerCase()} hair styled in a ${hairStyle.toLowerCase()} style, `;
  }
  
  prompt += `${eyeColor} eyes, and a ${bodyType.toLowerCase()} body type. `;

  // Style and fashion
  if (styleArchetypes.length > 0) {
    const styleDesc = styleArchetypes.join(', ').toLowerCase();
    prompt += `Their fashion style is ${styleDesc}, `;
    
    // Clothing suggestions based on style
    if (styleArchetypes.includes('Classic')) {
      prompt += `wearing elegant, timeless clothing like a well-fitted blazer or button-down shirt, `;
    } else if (styleArchetypes.includes('Bohemian')) {
      prompt += `wearing flowing, artistic clothing with natural textures and earthy tones, `;
    } else if (styleArchetypes.includes('Minimalist')) {
      prompt += `wearing clean, simple clothing in neutral colors with minimal accessories, `;
    } else if (styleArchetypes.includes('Edgy')) {
      prompt += `wearing bold, contemporary clothing with interesting cuts or dark colors, `;
    } else if (styleArchetypes.includes('Romantic')) {
      prompt += `wearing soft, feminine clothing with delicate details and gentle colors, `;
    } else if (styleArchetypes.includes('Trendy')) {
      prompt += `wearing fashionable, current clothing that's on-trend and stylish, `;
    } else if (styleArchetypes.includes('Sporty')) {
      prompt += `wearing athletic-inspired clothing that's comfortable and functional, `;
    } else if (styleArchetypes.includes('Glamorous')) {
      prompt += `wearing luxurious, eye-catching clothing with elegant accessories, `;
    } else if (styleArchetypes.includes('Preppy')) {
      prompt += `wearing polished, collegiate-inspired clothing like polo shirts or cardigans, `;
    } else if (styleArchetypes.includes('Artsy')) {
      prompt += `wearing creative, unique clothing with artistic flair and interesting patterns, `;
    } else {
      prompt += `wearing stylish, well-fitted clothing, `;
    }
  }

  // Color preferences
  if (favoriteColors.length > 0) {
    const colorList = favoriteColors.slice(0, 3).join(', ').toLowerCase();
    prompt += `incorporating their favorite colors: ${colorList}. `;
  }

  // Professional context
  if (occupation) {
    prompt += `They work as a ${occupation.toLowerCase()}, so their style reflects their professional environment. `;
  }

  // Lifestyle factors
  if (lifestyleFactors.length > 0) {
    const lifestyleDesc = lifestyleFactors.join(', ').toLowerCase();
    prompt += `Their lifestyle is ${lifestyleDesc}, which influences their clothing choices. `;
  }

  // Technical specifications
  prompt += `Portrait should be shot from chest up with good lighting, professional quality, `;
  prompt += `realistic style, high resolution, sharp focus, beautiful composition. `;
  prompt += `The person should have a friendly, confident expression and be looking directly at the camera. `;
  prompt += `Background should be neutral and clean, not distracting from the subject. `;

  // Style modifiers for better results
  prompt += `Style: professional headshot, portrait photography, studio lighting, high quality, detailed, realistic.`;

  return prompt;
};

export const generateAvatarImage = async (styleDNA: EnhancedStyleDNA, externalGender?: string | null): Promise<string | null> => {
  try {
    const prompt = generateAvatarPrompt(styleDNA, externalGender);
    
    // Use DALL-E directly for avatar generation
    const imageUrl = await generateAvatarWithDALLE(prompt);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating avatar image:', error);
    return null;
  }
};

// Direct DALL-E function for avatar generation
const generateAvatarWithDALLE = async (prompt: string): Promise<string | null> => {
  const Constants = await import('expo-constants');
  const OPENAI_API_KEY = Constants.default.expoConfig?.extra?.openAIApiKey;

  if (!OPENAI_API_KEY) {
    console.error('🚨 No OpenAI API key found for avatar generation');
    return null;
  }

  const payload = {
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    console.log('🎨 Generating avatar with prompt:', prompt.substring(0, 200) + '...');
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 Avatar generation failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Avatar generated successfully');
    
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error("❌ Avatar generation error:", error);
    return null;
  }
};