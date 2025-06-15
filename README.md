# StyleMuse 👗✨

StyleMuse is an AI-powered virtual closet app that helps you organize your wardrobe and generate stunning outfit combinations using GPT-4o Vision and DALL-E 3.

## Features 🚀

- **AI Clothing Analysis**: Automatically describes clothing items with detailed color, material, and style information
- **Bulk Upload**: Add multiple clothing items at once with progress tracking
- **Smart Outfit Generation**: AI creates photorealistic outfit combinations from your wardrobe
- **Interactive Gallery**: Swipeable wardrobe with selection modes and editing capabilities
- **Animated Loading States**: Beautiful progress indicators and spinning animations

## Tech Stack 💻

- **Frontend**: React Native with Expo
- **AI Integration**: OpenAI GPT-4o Vision & DALL-E 3
- **Image Processing**: Expo ImagePicker & FileSystem
- **Development**: TypeScript, Expo Go for testing

## Quick Start 🏃‍♂️

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS/Android device with Expo Go app
- OpenAI API account

### 1. Clone & Install
```bash
git clone https://github.com/tyrannon/stylemuse.git
cd stylemuse
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Get your OpenAI API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste it into your `.env` file

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Run on Your Device
- Install [Expo Go](https://expo.dev/client) on your phone
- Scan the QR code from your terminal
- Start adding clothes and generating outfits! 🎉

## Project Structure 📁

```
stylemuse/
├── App.js                          # Main app entry point
├── screens/
│   └── WardrobeUploadScreen.tsx    # Main wardrobe interface
├── utils/
│   └── openai.ts                   # AI integration (GPT-4o & DALL-E)
├── assets/                         # Images and icons
├── .env                           # Environment variables (not tracked)
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Key Components 🧩

### WardrobeUploadScreen.tsx
The main interface featuring:
- Single & bulk image upload
- AI-powered clothing analysis
- Outfit selection mode with visual indicators
- AI outfit generation with animated loading
- Horizontal scrolling wardrobe gallery

### utils/openai.ts
AI integration module with two main functions:

**`describeClothingItem(base64Image)`**
- Analyzes clothing photos using GPT-4o Vision
- Returns detailed JSON with title, description, tags, color, material, style, fit
- Enhanced prompts for accurate color and style detection

**`generateOutfitImage(clothingItems)`**
- Creates photorealistic outfit combinations using DALL-E 3
- Takes array of clothing item objects
- Returns URL of generated outfit photo

## Environment Setup Details 🔧

### Required Environment Variables
```bash
# .env file
EXPO_PUBLIC_OPENAI_API_KEY=sk-...your-key-here
```

**Important Notes:**
- The `EXPO_PUBLIC_` prefix is required for Expo Go
- Never commit your `.env` file to git
- Regenerate your API key if it's ever exposed

### API Costs 💰
- **GPT-4o Vision**: ~$0.01 per clothing item analysis
- **DALL-E 3**: ~$0.04 per outfit generation
- Budget accordingly for testing and usage

## Development Workflow 🔄

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature`
2. Test on Expo Go during development
3. Commit changes: `git commit -m "feat: your feature description"`
4. Push and create PR: `git push origin feature/your-feature`

### Testing
- Use "Quick Demo" button to add sample items for testing
- Bulk upload feature supports up to 10 images at once
- All API calls include error handling and user feedback

### Common Commands
```bash
# Start development server
npx expo start

# Clear cache if issues
npx expo start --clear

# Check for updates
npx expo install --fix
```

## Troubleshooting 🛠️

### "API Key not found"
- Ensure `.env` file exists in root directory
- Check that variable name is `EXPO_PUBLIC_OPENAI_API_KEY`
- Restart Expo server after adding environment variables

### "Failed to analyze image"
- Check internet connection
- Verify OpenAI API key is valid and has credits
- Image may be too large (Expo compresses automatically)

### "Upload functionality coming soon"
- This button is a placeholder for future cloud storage integration
- Currently all data is stored locally on device

### Git Issues
- If you see API key warnings, it means the key was committed to git
- Follow the environment variable setup to properly secure your key
- Use `git reset --soft HEAD~1` to undo recent commits if needed

## Roadmap 🗺️

- [ ] Cloud storage for wardrobe sync across devices
- [ ] Outfit sharing with friends
- [ ] Weather-based outfit suggestions
- [ ] Clothing brand recognition
- [ ] Style trend analysis
- [ ] Calendar integration for occasion-based outfits

---

**Built with ❤️ and AI**

*StyleMuse helps you discover your perfect style through the power of artificial intelligence.*