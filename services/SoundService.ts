import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface SoundConfig {
  buttonTap: any;
  packOpen: any;
  achievement: any;
  success: any;
  error: any;
}

interface BackgroundMusicConfig {
  morning: any;
  afternoon: any;
  evening: any;
  night: any;
}

class SoundService {
  private sounds: Partial<SoundConfig> = {};
  private backgroundMusic: Partial<BackgroundMusicConfig> = {};
  private currentBackgroundMusic: Audio.Sound | null = null;
  private currentAmbience: Audio.Sound | null = null;
  private isSoundEnabled = true;
  private isMusicEnabled = true;
  private isAmbienceEnabled = true;
  private currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  private currentTheme: 'ocean' | 'forest' | 'rain' | 'fireplace' = 'ocean';
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    SOUND_ENABLED: 'soundservice_sound_enabled',
    MUSIC_ENABLED: 'soundservice_music_enabled',
    AMBIENCE_ENABLED: 'soundservice_ambience_enabled',
    THEME: 'soundservice_theme'
  };

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load saved settings
      await this.loadSettings();
      
      // Start background music if enabled
      if (this.isMusicEnabled) {
        await this.startBackgroundMusic();
      }
      
      // Start ambient sounds if enabled
      if (this.isAmbienceEnabled) {
        await this.startAmbience();
      }

      logger.info(LogCategories.SYSTEM, 'SoundService initialized', { 
        soundEnabled: this.isSoundEnabled, 
        musicEnabled: this.isMusicEnabled,
        ambienceEnabled: this.isAmbienceEnabled,
        theme: this.currentTheme
      });
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to initialize SoundService', error);
    }
  }

  // Load settings from storage
  private async loadSettings() {
    try {
      const soundEnabled = await AsyncStorage.getItem(this.STORAGE_KEYS.SOUND_ENABLED);
      const musicEnabled = await AsyncStorage.getItem(this.STORAGE_KEYS.MUSIC_ENABLED);
      const ambienceEnabled = await AsyncStorage.getItem(this.STORAGE_KEYS.AMBIENCE_ENABLED);
      const theme = await AsyncStorage.getItem(this.STORAGE_KEYS.THEME);
      
      if (soundEnabled !== null) {
        this.isSoundEnabled = soundEnabled === 'true';
      }
      
      if (musicEnabled !== null) {
        this.isMusicEnabled = musicEnabled === 'true';
      }
      
      if (ambienceEnabled !== null) {
        this.isAmbienceEnabled = ambienceEnabled === 'true';
      }
      
      if (theme && ['ocean', 'forest', 'rain', 'fireplace'].includes(theme)) {
        this.currentTheme = theme as 'ocean' | 'forest' | 'rain' | 'fireplace';
      }
      
      logger.info(LogCategories.SYSTEM, 'Audio settings loaded', {
        soundEnabled: this.isSoundEnabled,
        musicEnabled: this.isMusicEnabled,
        ambienceEnabled: this.isAmbienceEnabled,
        theme: this.currentTheme
      });
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to load audio settings', error);
    }
  }

  // Button tap sound for navigation
  async playButtonTap() {
    if (!this.isSoundEnabled) return;
    
    try {
      // Haptic feedback for immediate tactile response
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Play actual button press sound file
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/button-press.mp3'),
          { 
            shouldPlay: true, 
            volume: 0.4,
            rate: 1.0,
          }
        );
        
        // Auto cleanup after sound finishes
        setTimeout(() => {
          sound.unloadAsync().catch(() => {});
        }, 500);
        
      } catch (audioError) {
        // Fallback: still have haptic feedback if audio fails
        logger.warn(LogCategories.SOUND, 'Button press audio failed, using haptic only', audioError);
      }
      
      logger.info(LogCategories.USER_ACTION, 'Button tap sound played');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to play button tap sound', error);
    }
  }

  // Pack opening sound effect
  async playPackOpen() {
    if (!this.isSoundEnabled) return;
    
    try {
      // Exciting pack opening haptic sequence
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      logger.info(LogCategories.GAMIFICATION, 'Pack opening sound played');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to play pack opening sound', error);
    }
  }

  // Achievement unlock sound
  async playAchievement() {
    if (!this.isSoundEnabled) return;
    
    try {
      // Victory fanfare haptic sequence
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      logger.info(LogCategories.GAMIFICATION, 'Achievement sound played');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to play achievement sound', error);
    }
  }

  // Success action sound
  async playSuccess() {
    if (!this.isSoundEnabled) return;
    
    try {
      // Pleasant success haptic
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      logger.info(LogCategories.USER_ACTION, 'Success sound played');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to play success sound', error);
    }
  }

  // Error action sound
  async playError() {
    if (!this.isSoundEnabled) return;
    
    try {
      // Error haptic feedback
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Play actual error sound file
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/error-sound.mp3'),
          { 
            shouldPlay: true, 
            volume: 0.5,
            rate: 1.0,
          }
        );
        
        // Auto cleanup after sound finishes
        setTimeout(() => {
          sound.unloadAsync().catch(() => {});
        }, 1000);
        
      } catch (audioError) {
        logger.warn(LogCategories.SOUND, 'Error sound audio failed, using haptic only', audioError);
      }
      
      logger.info(LogCategories.USER_ACTION, 'Error sound played');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to play error sound', error);
    }
  }

  // Background music based on time of day (Animal Crossing style)
  async startBackgroundMusic() {
    if (!this.isMusicEnabled) return;

    try {
      await this.stopBackgroundMusic();
      
      const hour = new Date().getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      
      if (hour >= 6 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'afternoon';
      } else if (hour >= 18 && hour < 22) {
        timeOfDay = 'evening';
      } else {
        timeOfDay = 'night';
      }

      this.currentTimeOfDay = timeOfDay;
      
      // For now, create a simple looping ambient sound based on time of day
      // In production, these would be actual music files
      await this.createAmbientSound(timeOfDay);
      
      logger.info(LogCategories.SYSTEM, 'Background music started', { timeOfDay, hour });
      
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to start background music', error);
    }
  }

  // Load Towball Crossing music based on time of day
  private async createAmbientSound(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') {
    try {
      const hour = new Date().getHours();
      let selectedTrack: any;
      let trackName: string;
      
      // Simple time-based selection with available tracks
      if (hour >= 0 && hour < 6) {
        // Midnight - early morning
        selectedTrack = require('../assets/audio/towball/12am.mp3');
        trackName = 'Midnight (12am)';
      } else if (hour >= 6 && hour < 12) {
        // Morning
        selectedTrack = require('../assets/audio/towball/6am.mp3');
        trackName = 'Morning (6am)';
      } else if (hour >= 12 && hour < 18) {
        // Afternoon
        selectedTrack = require('../assets/audio/towball/12pm.mp3');
        trackName = 'Noon (12pm)';
      } else {
        // Evening
        selectedTrack = require('../assets/audio/towball/6pm.mp3');
        trackName = 'Evening (6pm)';
      }
      
      try {
        // Load and play the selected music
        const { sound } = await Audio.Sound.createAsync(
          selectedTrack,
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 0.2 // Quiet background music
          }
        );
        
        this.currentBackgroundMusic = sound;
        
        logger.info(LogCategories.SOUND, 'Towball Crossing music started', {
          hour,
          timeOfDay,
          trackName,
          description: `🎵 Now playing: ${trackName}`
        });
        
      } catch (audioError) {
        // Fallback to main theme if specific track fails
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/towball/main-theme.mp3'),
          { shouldPlay: true, isLooping: true, volume: 0.2 }
        );
        
        this.currentBackgroundMusic = sound;
        logger.info(LogCategories.SOUND, 'Towball Crossing main theme fallback started');
      }
      
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to load Towball Crossing music', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.currentBackgroundMusic) {
      try {
        await this.currentBackgroundMusic.stopAsync();
        await this.currentBackgroundMusic.unloadAsync();
        this.currentBackgroundMusic = null;
        logger.info(LogCategories.SYSTEM, 'Background music stopped');
      } catch (error) {
        logger.error(LogCategories.SYSTEM, 'Failed to stop background music', error);
      }
    }
  }

  // Ambient sound system (like Calm app)
  async startAmbience() {
    if (!this.isAmbienceEnabled) return;

    try {
      await this.stopAmbience();
      
      let selectedAmbience: any;
      let ambienceName: string;
      
      // For now, we only have ocean waves, but structure for future themes
      switch (this.currentTheme) {
        case 'ocean':
          selectedAmbience = require('../assets/audio/ocean-waves.mp3');
          ambienceName = '🌊 Soothing Ocean Waves';
          break;
        case 'forest':
          selectedAmbience = require('../assets/audio/forest-sounds.mp3');
          ambienceName = '🌲 Forest Sounds';
          break;
        case 'rain':
          selectedAmbience = require('../assets/audio/rain-sounds.mp3');
          ambienceName = '🌧️ Gentle Rain';
          break;
        case 'fireplace':
          selectedAmbience = require('../assets/audio/fireplace-sounds.mp3');
          ambienceName = '🔥 Cozy Fireplace';
          break;
        default:
          selectedAmbience = require('../assets/audio/ocean-waves.mp3');
          ambienceName = '🌊 Soothing Ocean Waves';
      }
      
      const { sound } = await Audio.Sound.createAsync(
        selectedAmbience,
        { 
          shouldPlay: true, 
          isLooping: true, 
          volume: 0.15 // Lower than music for peaceful background
        }
      );
      
      this.currentAmbience = sound;
      
      logger.info(LogCategories.SOUND, 'Ambient soundscape started', {
        theme: this.currentTheme,
        ambienceName,
        description: `🎵 Peaceful vibes: ${ambienceName}`
      });
      
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to start ambient soundscape', error);
    }
  }

  async stopAmbience() {
    if (this.currentAmbience) {
      try {
        await this.currentAmbience.stopAsync();
        await this.currentAmbience.unloadAsync();
        this.currentAmbience = null;
        logger.info(LogCategories.SYSTEM, 'Ambient soundscape stopped');
      } catch (error) {
        logger.error(LogCategories.SYSTEM, 'Failed to stop ambient soundscape', error);
      }
    }
  }

  // Settings controls
  async setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    
    // Save to storage
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to save sound setting', error);
    }
    
    logger.info(LogCategories.SYSTEM, 'Sound effects toggled', { enabled });
  }

  async setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    
    // Save to storage
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.MUSIC_ENABLED, enabled.toString());
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to save music setting', error);
    }
    
    if (!enabled) {
      await this.stopBackgroundMusic();
    } else {
      await this.startBackgroundMusic();
    }
    
    logger.info(LogCategories.SYSTEM, 'Background music toggled', { enabled });
  }

  async setAmbienceEnabled(enabled: boolean) {
    this.isAmbienceEnabled = enabled;
    
    // Save to storage
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.AMBIENCE_ENABLED, enabled.toString());
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to save ambience setting', error);
    }
    
    if (!enabled) {
      await this.stopAmbience();
    } else {
      await this.startAmbience();
    }
    
    logger.info(LogCategories.SYSTEM, 'Ambient soundscape toggled', { enabled, theme: this.currentTheme });
  }

  async setTheme(theme: 'ocean' | 'forest' | 'rain' | 'fireplace') {
    this.currentTheme = theme;
    
    // Save to storage
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.THEME, theme);
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to save theme setting', error);
    }
    
    // Restart ambience with new theme if enabled
    if (this.isAmbienceEnabled) {
      await this.startAmbience();
    }
    
    logger.info(LogCategories.SYSTEM, 'Peaceful theme changed', { theme });
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  getAmbienceEnabled(): boolean {
    return this.isAmbienceEnabled;
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  getCurrentTimeOfDay(): string {
    return this.currentTimeOfDay;
  }

  // Cleanup method
  async cleanup() {
    try {
      await this.stopBackgroundMusic();
      await this.stopAmbience();
      
      // Unload all sound effects
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          await sound.unloadAsync();
        }
      }
      
      logger.info(LogCategories.SYSTEM, 'SoundService cleaned up');
    } catch (error) {
      logger.error(LogCategories.SYSTEM, 'Failed to cleanup SoundService', error);
    }
  }

}

export const soundService = new SoundService();