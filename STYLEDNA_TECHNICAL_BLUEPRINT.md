# StyleDNA Technical Blueprint
*Comprehensive Deep-Dive Analysis and Documentation*

## Executive Summary

StyleDNA is a core feature that analyzes a user's photo to extract style preferences, physical attributes, and fashion tendencies. This analysis powers personalized outfit generation, avatar creation, and style recommendations throughout the app.

## Table of Contents

1. [StyleDNA Flow Analysis](#styledna-flow-analysis)
2. [File-by-File Analysis](#file-by-file-analysis)
3. [Data Flow Mapping](#data-flow-mapping)
4. [Storage & Persistence](#storage--persistence)
5. [UI Components](#ui-components)
6. [Technical Architecture](#technical-architecture)
7. [Recreation Guide](#recreation-guide)

---

## StyleDNA Flow Analysis

### 1. User Trigger Points

**Primary Entry Point: Profile Page**
- Location: `/screens/ProfilePage.tsx` (lines 102-126)
- User clicks "🧬 Analyze Style DNA" button
- Requires profile image to be uploaded first
- Button is disabled when `analyzingProfile` state is true

**Secondary Entry Point: Avatar Customization**
- Location: `/screens/AvatarCustomizationPage.tsx`
- Manual input of style preferences
- Updates StyleDNA without photo analysis

### 2. Step-by-Step Process Flow

#### Step 1: Photo Upload
1. **Trigger**: User clicks `pickProfileImage()` in ProfilePage
2. **Permission Check**: Requests media library permissions
3. **Image Selection**: Opens ImagePicker with square crop (1:1 aspect ratio)
4. **Storage**: Saves image URI to AsyncStorage under `STORAGE_KEYS.PROFILE_IMAGE`
5. **Auto-Analysis**: Automatically calls `analyzeProfileImage(imageUri)` after upload

#### Step 2: Image Analysis
1. **File Conversion**: Image converted to base64 using `FileSystem.readAsStringAsync()`
2. **AI Processing**: Calls `analyzePersonalStyle(base64)` from `/utils/openai.ts`
3. **Response Cleaning**: Aggressively cleans JSON response to handle formatting issues
4. **Parsing**: Attempts to parse cleaned JSON response
5. **Fallback**: Creates basic StyleDNA object if parsing fails

#### Step 3: Data Storage
1. **State Update**: Updates `styleDNA` state via `setStyleDNA()`
2. **Persistence**: Saves to AsyncStorage using `StorageService.saveStyleDNA()`
3. **User Feedback**: Shows success/failure alert

#### Step 4: Display Results
1. **UI Refresh**: Profile page re-renders with StyleDNA data
2. **Visual Indicators**: Border color changes to green when StyleDNA exists
3. **Data Cards**: Displays analysis results in structured cards

---

## File-by-File Analysis

### Core Files

#### 1. `/screens/ProfilePage.tsx`
**Purpose**: Main UI for StyleDNA display and interaction
**Key Functions**:
- Displays StyleDNA analysis results in cards
- Shows profile image with analysis status
- Handles navigation to avatar customization
- Integrates with backup/restore functionality

**StyleDNA Rendering** (lines 208-262):
```typescript
{/* Style DNA Results Section */}
{styleDNA && (
  <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
    {/* Appearance Card */}
    {styleDNA.appearance && (
      <View style={styles.styleDNACard}>
        <Text style={styles.styleDNACardTitle}>👤 Appearance</Text>
        <Text style={styles.styleDNAText}>
          <Text style={styles.styleDNALabel}>Hair:</Text> {styleDNA.appearance.hair_color || 'Not specified'}
        </Text>
        // ... additional fields
      </View>
    )}
    // ... style preferences and outfit generation notes
  </View>
)}
```

#### 2. `/screens/WardrobeUploadScreen.tsx`
**Purpose**: Main application state management and StyleDNA processing
**Key Functions**:
- `analyzeProfileImage(imageUri: string)` (lines 777-841)
- `pickProfileImage()` (lines 844-867)
- `updateStyleDNA(updatedStyleDNA: EnhancedStyleDNA)` (lines 284-289)

**Critical Analysis Function**:
```typescript
const analyzeProfileImage = async (imageUri: string) => {
  setAnalyzingProfile(true);
  
  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call AI analysis
    const result = await analyzePersonalStyle(base64);
    
    // Clean and parse response
    let cleanResult = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^[^{]*{/, '{')
      .replace(/}[^}]*$/, '}')
      .trim();

    let parsed = JSON.parse(cleanResult);
    setStyleDNA(parsed);
    saveStyleDNA(parsed);
    
  } catch (err) {
    // Fallback handling
  } finally {
    setAnalyzingProfile(false);
  }
};
```

#### 3. `/utils/openai.ts`
**Purpose**: AI analysis engine for StyleDNA extraction
**Key Function**: `analyzePersonalStyle(base64Image: string)` (lines 381-464)

**AI Prompt Structure**:
- Focuses on fashion styling and coordination advice
- Analyzes hair styling, body proportions, color coordination
- Returns structured JSON with appearance and style preferences
- Includes safety measures for personal identification avoidance

**Response Format**:
```json
{
  "appearance": {
    "hair_color": "general color family",
    "hair_length": "general length category", 
    "hair_texture": "general texture",
    "build": "general styling category",
    "complexion": "general tone for color coordination",
    "age_range": "general style demographic"
  },
  "style_preferences": {
    "aesthetic_shown": "current style aesthetic",
    "recommended_styles": ["complementary fashion styles"],
    "color_harmony": ["color families that work well"],
    "fit_recommendations": "clothing fits that work well"
  },
  "outfit_coordination": "Guidelines for coordinated looks",
  "fashion_prompt": "Styling description for fashion looks"
}
```

#### 4. `/types/Avatar.ts`
**Purpose**: TypeScript definitions for StyleDNA data structure
**Key Interface**: `EnhancedStyleDNA` (lines 78-133)

**Data Structure Hierarchy**:
```typescript
interface EnhancedStyleDNA {
  // Personal Information
  personal_info?: {
    name?: string;
    age_range?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';
    gender?: 'male' | 'female' | 'nonbinary' | 'prefer-not-to-say';
    pronouns?: 'she/her' | 'he/him' | 'they/them' | 'other';
  };

  // Physical Attributes
  physical_attributes?: {
    body_measurements?: BodyMeasurements;
    clothing_sizes?: ClothingSizes;
    hair_color?: string;
    hair_length?: 'Very Short' | 'Short' | 'Medium' | 'Long' | 'Very Long' | 'Bald';
    // ... additional physical attributes
  };

  // Style & Preferences
  style_profile?: PersonalStyle;

  // Lifestyle & Context
  lifestyle?: LifestyleFactors;

  // AI Analysis Results (from image analysis)
  ai_analysis?: {
    appearance?: {
      hair_color?: string;
      build?: string;
      complexion?: string;
      approximate_age_range?: string;
    };
    style_preferences?: {
      current_style_visible?: string;
      preferred_styles?: string[];
      color_palette?: string[];
      fit_preferences?: string;
    };
    outfit_generation_notes?: string;
    analyzed_at?: Date;
  };

  // Generated Avatar
  avatar_image_url?: string | null;

  // Metadata
  created_at?: Date;
  updated_at?: Date;
  version?: number;
}
```

#### 5. `/services/StorageService.ts`
**Purpose**: Data persistence layer for StyleDNA
**Key Functions**:
- `saveStyleDNA(dna: EnhancedStyleDNA)` (lines 63-70)
- `loadStyleDNA()` (lines 72-80)

#### 6. `/screens/AvatarCustomizationPage.tsx`
**Purpose**: Manual StyleDNA editing and avatar generation
**Key Features**:
- Multi-section form for detailed StyleDNA input
- Real-time avatar generation based on customization
- Comprehensive validation and state management
- Integration with AI avatar generation

---

## Data Flow Mapping

### Photo Capture → Analysis → Storage → Display

```mermaid
graph TD
    A[User clicks "Analyze Style DNA"] --> B[Permission Check]
    B --> C[ImagePicker Opens]
    C --> D[User selects photo]
    D --> E[Image saved to AsyncStorage]
    E --> F[Convert to base64]
    F --> G[Send to OpenAI API]
    G --> H[AI processes image]
    H --> I[Returns JSON response]
    I --> J[Clean and parse JSON]
    J --> K{Parse successful?}
    K -->|Yes| L[Update StyleDNA state]
    K -->|No| M[Create fallback StyleDNA]
    L --> N[Save to AsyncStorage]
    M --> N
    N --> O[Update UI with results]
    O --> P[Show success message]
```

### State Management Flow

1. **Initial Load**: `useWardrobeData` hook loads StyleDNA from AsyncStorage
2. **Analysis**: Photo analysis updates state and storage simultaneously
3. **Manual Updates**: Avatar customization updates both state and storage
4. **Persistence**: All changes are immediately persisted to AsyncStorage
5. **Backup**: StyleDNA included in app backup/restore functionality

### API Integration Points

1. **OpenAI GPT-4o**: Image analysis for StyleDNA extraction
2. **DALL-E 3**: Avatar image generation based on StyleDNA
3. **Expo FileSystem**: Image file operations and base64 conversion
4. **AsyncStorage**: Local data persistence

---

## Storage & Persistence

### AsyncStorage Keys

**Primary Key**: `'stylemuse_style_dna'` (from `/constants/storage.ts`)

**Related Keys**:
- `'stylemuse_profile_image'`: Profile photo URI
- `'stylemuse_selected_gender'`: User's gender selection
- `'stylemuse_wardrobe_items'`: Wardrobe data (used with StyleDNA for outfit generation)

### Backup & Restore

**Backup Structure** (from `/services/PersistenceService.ts`):
```typescript
interface StyleMuseBackup {
  version: string;
  timestamp: string;
  data: {
    wardrobeItems: WardrobeItem[];
    lovedOutfits: LovedOutfit[];
    styleDNA: EnhancedStyleDNA | null;  // StyleDNA included in backup
    profileImage: string | null;
    selectedGender: 'male' | 'female' | 'nonbinary' | null;
    wishlistItems: WishlistItem[];
    suggestedItems: SuggestedItem[];
  };
}
```

**Storage Locations**:
- **iOS**: Documents directory (iCloud synced if enabled)
- **Android**: App documents directory
- **Cross-platform**: AsyncStorage for runtime access

### Data Integrity

1. **Validation**: JSON parsing with fallback handling
2. **Versioning**: StyleDNA includes version number for future migrations
3. **Timestamps**: Created/updated timestamps for change tracking
4. **Error Handling**: Graceful degradation when analysis fails

---

## UI Components

### Primary Display Components

#### 1. ProfilePage StyleDNA Cards
**Location**: `/screens/ProfilePage.tsx` (lines 208-262)
**Features**:
- Collapsible card layout
- Color-coded indicators
- Structured data presentation
- Visual status indicators

#### 2. Avatar Customization Form
**Location**: `/screens/AvatarCustomizationPage.tsx`
**Features**:
- Multi-section tabbed interface
- Real-time validation
- Progress indicators
- Interactive form controls

#### 3. AvatarVisualization
**Location**: `/screens/components/AvatarVisualization.tsx`
**Features**:
- Dynamic avatar rendering
- StyleDNA-based generation
- Loading states
- Fallback handling

### User Interaction Patterns

1. **Photo Upload**: Single tap → permission → picker → automatic analysis
2. **Manual Editing**: Navigate to customization → section-based editing → save
3. **Avatar Generation**: Automatic when saving customization
4. **Backup/Restore**: Dedicated UI in ProfilePage for data management

### Visual Feedback

1. **Loading States**: Spinner during analysis, progress messages during avatar generation
2. **Success Indicators**: Green borders, checkmarks, success alerts
3. **Error Handling**: Fallback content, error alerts, graceful degradation
4. **Status Display**: Color-coded borders, completion badges, stats counters

---

## Technical Architecture

### Dependencies

**Core Libraries**:
- `expo-file-system`: File operations and base64 conversion
- `expo-image-picker`: Photo selection interface
- `@react-native-async-storage/async-storage`: Data persistence
- `expo-haptics`: Tactile feedback

**AI Services**:
- OpenAI GPT-4o: StyleDNA analysis
- OpenAI DALL-E 3: Avatar generation

### Error Handling Strategy

1. **Network Failures**: Retry logic with exponential backoff
2. **Parsing Errors**: Aggressive JSON cleaning with fallback objects
3. **Permission Denials**: User-friendly error messages
4. **Storage Failures**: Graceful degradation, error logging

### Performance Considerations

1. **Image Processing**: Base64 conversion happens asynchronously
2. **API Calls**: Rate limiting and retry logic implemented
3. **State Management**: Efficient updates with React state
4. **Storage**: Immediate persistence prevents data loss

---

## Recreation Guide

### Prerequisites

1. **OpenAI API Access**: GPT-4o and DALL-E 3 access required
2. **React Native Environment**: Expo development environment
3. **Mobile Permissions**: Camera roll and file system access

### Implementation Steps

#### Step 1: Data Structure Setup
```typescript
// 1. Define the StyleDNA interface (types/Avatar.ts)
interface EnhancedStyleDNA {
  personal_info?: PersonalInfo;
  physical_attributes?: PhysicalAttributes;
  style_profile?: PersonalStyle;
  lifestyle?: LifestyleFactors;
  ai_analysis?: AIAnalysisResults;
  avatar_image_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
  version?: number;
}
```

#### Step 2: Storage Service
```typescript
// 2. Implement storage service (services/StorageService.ts)
export class StorageService {
  static async saveStyleDNA(dna: EnhancedStyleDNA): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.STYLE_DNA, JSON.stringify(dna));
  }
  
  static async loadStyleDNA(): Promise<EnhancedStyleDNA | null> {
    const dnaJson = await AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA);
    return dnaJson ? JSON.parse(dnaJson) : null;
  }
}
```

#### Step 3: AI Analysis Service
```typescript
// 3. Implement AI analysis (utils/openai.ts)
export async function analyzePersonalStyle(base64Image: string) {
  const prompt = `Analyze this image for fashion styling elements...`;
  
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system", 
        content: "You are a fashion styling consultant..."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
          }
        ]
      }
    ],
    max_tokens: 400,
    temperature: 0.5
  };

  // API call and response handling
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  return json?.choices?.[0]?.message?.content;
}
```

#### Step 4: Photo Analysis Flow
```typescript
// 4. Implement photo analysis flow
const analyzeProfileImage = async (imageUri: string) => {
  setAnalyzingProfile(true);
  
  try {
    // Convert to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Analyze with AI
    const result = await analyzePersonalStyle(base64);
    
    // Clean and parse response
    let cleanResult = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^[^{]*{/, '{')
      .replace(/}[^}]*$/, '}')
      .trim();

    const parsed = JSON.parse(cleanResult);
    
    // Update state and storage
    setStyleDNA(parsed);
    await StorageService.saveStyleDNA(parsed);
    
    alert("Style DNA analyzed! 🧬✨");
  } catch (error) {
    // Handle errors with fallback StyleDNA
    console.error("Analysis failed:", error);
  } finally {
    setAnalyzingProfile(false);
  }
};
```

#### Step 5: UI Integration
```typescript
// 5. Implement UI components
const ProfilePage = ({ styleDNA, analyzeProfileImage }) => {
  return (
    <View>
      {/* Photo upload button */}
      <TouchableOpacity onPress={pickProfileImage}>
        <Image source={{ uri: profileImage }} />
      </TouchableOpacity>
      
      {/* Analysis trigger */}
      {profileImage && (
        <TouchableOpacity onPress={() => analyzeProfileImage(profileImage)}>
          <Text>🧬 Analyze Style DNA</Text>
        </TouchableOpacity>
      )}
      
      {/* Results display */}
      {styleDNA && (
        <View>
          <Text>👤 Appearance</Text>
          <Text>Hair: {styleDNA.appearance?.hair_color}</Text>
          <Text>Build: {styleDNA.appearance?.build}</Text>
          {/* Additional fields */}
        </View>
      )}
    </View>
  );
};
```

### Key Implementation Notes

1. **Error Handling**: Implement comprehensive error handling for API failures
2. **Response Cleaning**: AI responses need aggressive JSON cleaning
3. **Fallback Handling**: Always provide fallback StyleDNA objects
4. **State Synchronization**: Keep React state and AsyncStorage in sync
5. **User Feedback**: Provide clear loading states and success/error messages

### Testing Strategy

1. **Unit Tests**: Test individual functions (analysis, storage, parsing)
2. **Integration Tests**: Test complete photo-to-results flow
3. **Error Simulation**: Test with malformed API responses
4. **Offline Testing**: Verify graceful degradation without internet
5. **Performance Testing**: Monitor API response times and memory usage

---

## Conclusion

StyleDNA is a sophisticated feature that combines computer vision AI, structured data management, and intuitive UI design. The implementation follows React Native best practices with comprehensive error handling, data persistence, and user experience considerations.

**Key Success Factors**:
1. Robust error handling at every step
2. Aggressive JSON response cleaning for AI reliability
3. Immediate data persistence to prevent loss
4. Intuitive UI with clear feedback
5. Comprehensive backup/restore capabilities

**Maintenance Considerations**:
1. Monitor OpenAI API changes and rate limits
2. Update AI prompts based on user feedback
3. Maintain data structure backward compatibility
4. Regular testing of analysis accuracy
5. Performance monitoring for image processing

This blueprint provides everything needed to understand, maintain, or recreate the StyleDNA functionality in the StyleMuse application.