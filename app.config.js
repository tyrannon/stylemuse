import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    openWeatherApiKey: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY,
    openAIApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    eas: {
      projectId: '058e32e8-871a-4b91-9660-862044af6d5c'
    }
  },
});