import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/StorageService';
import { URIValidator, URIValidationMiddleware } from './URIValidation';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

/**
 * Validated wrapper around StorageService that prevents temporary URIs from being stored
 */
export class ValidatedStorageService {
  
  /**
   * Save wardrobe items with URI validation
   */
  static async saveWardrobeItems(items: WardrobeItem[]): Promise<{
    success: boolean;
    saved: WardrobeItem[];
    blocked: WardrobeItem[];
    warnings: string[];
  }> {
    logger.info(LogCategories.STORAGE, 'Validating wardrobe items before save', { count: items.length });

    try {
      // Pre-validation check
      const preValidation = await URIValidationMiddleware.preStorageValidation(items);
      
      if (!preValidation.shouldProceed) {
        logger.error(LogCategories.STORAGE, 'Wardrobe items save blocked due to validation failures', null, {
          invalidCount: preValidation.invalidItems.length,
          validCount: preValidation.validItems.length
        });

        return {
          success: false,
          saved: [],
          blocked: preValidation.invalidItems,
          warnings: [`Blocked save operation: ${preValidation.invalidItems.length} items have invalid URIs`]
        };
      }

      // Perform additional validation middleware check
      const middleware = await URIValidationMiddleware.validateBeforeAsyncStorage(
        preValidation.validItems, 
        'save'
      );

      if (middleware.blocked) {
        return {
          success: false,
          saved: [],
          blocked: items,
          warnings: middleware.warnings
        };
      }

      // Proceed with storage using validated items
      await StorageService.saveWardrobeItems(middleware.data as WardrobeItem[]);
      
      logger.info(LogCategories.STORAGE, 'Wardrobe items saved successfully', { 
        count: (middleware.data as WardrobeItem[]).length,
        warnings: middleware.warnings.length
      });

      return {
        success: true,
        saved: middleware.data as WardrobeItem[],
        blocked: preValidation.invalidItems,
        warnings: middleware.warnings
      };

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in validated wardrobe items save', error);
      throw error;
    }
  }

  /**
   * Save loved outfits with URI validation
   */
  static async saveLovedOutfits(outfits: LovedOutfit[]): Promise<{
    success: boolean;
    saved: LovedOutfit[];
    blocked: LovedOutfit[];
    warnings: string[];
  }> {
    logger.info(LogCategories.STORAGE, 'Validating loved outfits before save', { count: outfits.length });

    try {
      // Validate outfit images (outfits contain image URIs)
      const itemsToValidate: any[] = [];
      outfits.forEach(outfit => {
        if (outfit.image) {
          itemsToValidate.push({ image: outfit.image });
        }
      });

      const preValidation = await URIValidationMiddleware.preStorageValidation(itemsToValidate);
      
      if (!preValidation.shouldProceed) {
        logger.error(LogCategories.STORAGE, 'Loved outfits save blocked due to validation failures', null, {
          invalidItemsInOutfits: preValidation.invalidItems.length
        });

        return {
          success: false,
          saved: [],
          blocked: outfits,
          warnings: [`Blocked save operation: outfit items contain ${preValidation.invalidItems.length} invalid URIs`]
        };
      }

      // Proceed with storage
      await StorageService.saveLovedOutfits(outfits);
      
      logger.info(LogCategories.STORAGE, 'Loved outfits saved successfully', { count: outfits.length });

      return {
        success: true,
        saved: outfits,
        blocked: [],
        warnings: []
      };

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in validated loved outfits save', error);
      throw error;
    }
  }

  /**
   * Save profile image with URI validation
   */
  static async saveProfileImage(imageUri: string | null): Promise<{
    success: boolean;
    savedUri: string | null;
    warnings: string[];
  }> {
    if (!imageUri) {
      await StorageService.saveProfileImage(null);
      return { success: true, savedUri: null, warnings: [] };
    }

    logger.info(LogCategories.STORAGE, 'Validating profile image before save', { imageUri });

    try {
      const validation = await URIValidator.validateURI(imageUri, {
        requireFileExists: true,
        generateRepairSuggestions: true,
        logValidation: true
      });

      const warnings: string[] = [];

      if (!validation.isValid) {
        const error = `Cannot save profile image: ${validation.details}`;
        logger.error(LogCategories.STORAGE, error, null, { imageUri, validation });
        
        // Try repair suggestions if available
        if (validation.repairSuggestions) {
          for (const suggestion of validation.repairSuggestions) {
            if (suggestion.priority === 'high') {
              try {
                const repairedUri = await suggestion.action();
                if (repairedUri) {
                  logger.info(LogCategories.STORAGE, 'Profile image repaired', { 
                    originalUri: imageUri,
                    repairedUri,
                    repairType: suggestion.type
                  });
                  
                  await StorageService.saveProfileImage(repairedUri);
                  return {
                    success: true,
                    savedUri: repairedUri,
                    warnings: [`Image URI repaired: ${suggestion.description}`]
                  };
                }
              } catch (repairError) {
                logger.warn(LogCategories.STORAGE, 'Profile image repair failed', { error: repairError, suggestion });
              }
            }
          }
        }

        return {
          success: false,
          savedUri: null,
          warnings: [error]
        };
      }

      if (validation.isTemporary) {
        warnings.push('Warning: Profile image is in temporary storage and may be lost');
      }

      await StorageService.saveProfileImage(imageUri);
      
      logger.info(LogCategories.STORAGE, 'Profile image saved successfully', { 
        imageUri,
        validationType: validation.validationType
      });

      return {
        success: true,
        savedUri: imageUri,
        warnings
      };

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in validated profile image save', error);
      throw error;
    }
  }

  /**
   * Batch validate and save multiple storage operations
   */
  static async batchValidatedSave(operations: {
    wardrobeItems?: WardrobeItem[];
    lovedOutfits?: LovedOutfit[];
    profileImage?: string | null;
  }): Promise<{
    success: boolean;
    results: {
      wardrobeItems?: ReturnType<typeof ValidatedStorageService.saveWardrobeItems> extends Promise<infer T> ? T : never;
      lovedOutfits?: ReturnType<typeof ValidatedStorageService.saveLovedOutfits> extends Promise<infer T> ? T : never;
      profileImage?: ReturnType<typeof ValidatedStorageService.saveProfileImage> extends Promise<infer T> ? T : never;
    };
    overallWarnings: string[];
  }> {
    logger.info(LogCategories.STORAGE, 'Starting batch validated save operation', {
      hasWardrobeItems: !!operations.wardrobeItems,
      hasLovedOutfits: !!operations.lovedOutfits,
      hasProfileImage: operations.profileImage !== undefined
    });

    const results: any = {};
    const overallWarnings: string[] = [];
    let overallSuccess = true;

    try {
      // Save wardrobe items
      if (operations.wardrobeItems) {
        results.wardrobeItems = await this.saveWardrobeItems(operations.wardrobeItems);
        if (!results.wardrobeItems.success) {
          overallSuccess = false;
        }
        overallWarnings.push(...results.wardrobeItems.warnings);
      }

      // Save loved outfits
      if (operations.lovedOutfits) {
        results.lovedOutfits = await this.saveLovedOutfits(operations.lovedOutfits);
        if (!results.lovedOutfits.success) {
          overallSuccess = false;
        }
        overallWarnings.push(...results.lovedOutfits.warnings);
      }

      // Save profile image
      if (operations.profileImage !== undefined) {
        results.profileImage = await this.saveProfileImage(operations.profileImage);
        if (!results.profileImage.success) {
          overallSuccess = false;
        }
        overallWarnings.push(...results.profileImage.warnings);
      }

      logger.info(LogCategories.STORAGE, 'Batch validated save completed', {
        overallSuccess,
        warningsCount: overallWarnings.length
      });

      return {
        success: overallSuccess,
        results,
        overallWarnings
      };

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in batch validated save', error);
      throw error;
    }
  }

  /**
   * Validate existing stored data and return repair recommendations
   */
  static async auditStoredData(): Promise<{
    wardrobeItems: {
      total: number;
      valid: number;
      invalid: number;
      temporary: number;
      details: Array<{ item: any; validation: any }>;
    };
    lovedOutfits: {
      total: number;
      valid: number;
      invalid: number;
      temporary: number;
      details: Array<{ outfit: any; validation: any }>;
    };
    profileImage: {
      exists: boolean;
      valid: boolean;
      validation?: any;
    };
  }> {
    logger.info(LogCategories.STORAGE, 'Starting storage data audit');

    const results = {
      wardrobeItems: { total: 0, valid: 0, invalid: 0, temporary: 0, details: [] as any[] },
      lovedOutfits: { total: 0, valid: 0, invalid: 0, temporary: 0, details: [] as any[] },
      profileImage: { exists: false, valid: false, validation: undefined as any }
    };

    try {
      // Audit wardrobe items
      const wardrobeItems = await StorageService.loadWardrobeItems();
      results.wardrobeItems.total = wardrobeItems.length;

      for (const item of wardrobeItems) {
        if (item.image) {
          const validation = await URIValidator.validateURI(item.image, { 
            requireFileExists: true,
            logValidation: false 
          });
          
          if (validation.isValid) results.wardrobeItems.valid++;
          else results.wardrobeItems.invalid++;
          
          if (validation.isTemporary) results.wardrobeItems.temporary++;

          results.wardrobeItems.details.push({ item, validation });
        } else {
          results.wardrobeItems.valid++; // Items without images are considered valid
        }
      }

      // Audit loved outfits
      const lovedOutfits = await StorageService.loadLovedOutfits();
      results.lovedOutfits.total = lovedOutfits.length;

      for (const outfit of lovedOutfits) {
        let outfitValid = true;
        let outfitTemporary = false;

        if (outfit.image) {
          const validation = await URIValidator.validateURI(outfit.image, { 
            requireFileExists: true,
            logValidation: false 
          });
          
          if (!validation.isValid) outfitValid = false;
          if (validation.isTemporary) outfitTemporary = true;
        }

        if (outfitValid) results.lovedOutfits.valid++;
        else results.lovedOutfits.invalid++;
        
        if (outfitTemporary) results.lovedOutfits.temporary++;

        results.lovedOutfits.details.push({ outfit, validation: { valid: outfitValid, temporary: outfitTemporary } });
      }

      // Audit profile image
      const profileImage = await StorageService.loadProfileImage();
      if (profileImage) {
        results.profileImage.exists = true;
        const validation = await URIValidator.validateURI(profileImage, { 
          requireFileExists: true,
          logValidation: false 
        });
        results.profileImage.valid = validation.isValid;
        results.profileImage.validation = validation;
      }

      logger.info(LogCategories.STORAGE, 'Storage audit completed', results);
      return results;

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error during storage audit', error);
      throw error;
    }
  }

  /**
   * Pass-through methods for non-image storage operations
   */
  static async loadWardrobeItems(): Promise<WardrobeItem[]> {
    return StorageService.loadWardrobeItems();
  }

  static async loadLovedOutfits(): Promise<LovedOutfit[]> {
    return StorageService.loadLovedOutfits();
  }

  static async loadProfileImage(): Promise<string | null> {
    return StorageService.loadProfileImage();
  }

  static async saveStyleDNA(dna: any): Promise<void> {
    return StorageService.saveStyleDNA(dna);
  }

  static async loadStyleDNA(): Promise<any> {
    return StorageService.loadStyleDNA();
  }

  static async saveSelectedGender(gender: string | null): Promise<void> {
    return StorageService.saveSelectedGender(gender);
  }

  static async loadSelectedGender(): Promise<string | null> {
    return StorageService.loadSelectedGender();
  }

  static async saveWishlistItems(items: any[]): Promise<void> {
    return StorageService.saveWishlistItems(items);
  }

  static async loadWishlistItems(): Promise<any[]> {
    return StorageService.loadWishlistItems();
  }

  static async saveSuggestedItems(items: any[]): Promise<void> {
    return StorageService.saveSuggestedItems(items);
  }

  static async loadSuggestedItems(): Promise<any[]> {
    return StorageService.loadSuggestedItems();
  }

  static async setItem(key: string, value: any): Promise<void> {
    return StorageService.setItem(key, value);
  }

  static async getItem<T>(key: string): Promise<T | null> {
    return StorageService.getItem<T>(key);
  }

  static async removeItem(key: string): Promise<void> {
    return StorageService.removeItem(key);
  }
}

export default ValidatedStorageService;