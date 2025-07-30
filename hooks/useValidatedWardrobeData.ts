import { useCallback, useState } from 'react';
import { useWardrobeData, WardrobeItem, LovedOutfit } from './useWardrobeData';
import { ValidatedStorageService } from '../utils/ValidatedStorageService';
import { URIValidator, URIValidationUtils } from '../utils/URIValidation';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { Alert } from 'react-native';

/**
 * Enhanced wardrobe data hook with URI validation
 * Wraps useWardrobeData with comprehensive URI validation to prevent temporary URIs from being stored
 */
export const useValidatedWardrobeData = () => {
  const wardrobeData = useWardrobeData();
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  /**
   * Validated version of saveBulkWardrobeItems that checks URIs before storage
   */
  const saveBulkWardrobeItemsValidated = useCallback(async (croppedItems: any[]) => {
    logger.info(LogCategories.STORAGE, 'Starting validated bulk wardrobe save', { 
      itemCount: croppedItems.length 
    });

    try {
      // Pre-validate all image URIs
      const urisToValidate = croppedItems
        .map(item => item.croppedUri)
        .filter(uri => uri);

      if (urisToValidate.length === 0) {
        logger.warn(LogCategories.STORAGE, 'No URIs to validate in bulk save');
        return wardrobeData.saveBulkWardrobeItems(croppedItems);
      }

      // Batch validation for performance
      const validationResults = await URIValidator.validateBatch(urisToValidate, {
        requireFileExists: true,
        generateRepairSuggestions: true,
        logValidation: true
      });

      // Analyze validation results
      const validUris: string[] = [];
      const invalidUris: string[] = [];
      const temporaryUris: string[] = [];
      const warnings: string[] = [];

      validationResults.forEach((result, uri) => {
        if (result.isValid) {
          validUris.push(uri);
        } else {
          invalidUris.push(uri);
        }

        if (result.isTemporary) {
          temporaryUris.push(uri);
          warnings.push(`Temporary URI detected: ${URIValidator.getStorageTypeDescription(uri)}`);
        }

        if (!result.isValid) {
          warnings.push(`Invalid URI: ${uri} - ${result.details}`);
        }
      });

      // Update warnings state
      setValidationWarnings(warnings);

      // Block save if critical issues found
      if (invalidUris.length > 0) {
        const errorMessage = `Cannot save ${invalidUris.length} items with invalid URIs. These images may be in temporary storage or missing.`;
        
        logger.error(LogCategories.STORAGE, 'Blocked bulk save due to invalid URIs', {
          invalidUris,
          temporaryUris,
          validUris: validUris.length
        });

        // Show user-friendly error with repair suggestions
        Alert.alert(
          'Image Storage Issue',
          `${errorMessage}\n\nSome images are in temporary storage and will be lost. Please re-capture or re-select these images.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Valid Items Only', 
              onPress: async () => {
                // Filter out items with invalid URIs
                const validItems = croppedItems.filter(item => 
                  validUris.includes(item.croppedUri)
                );
                
                if (validItems.length > 0) {
                  await wardrobeData.saveBulkWardrobeItems(validItems);
                  logger.info(LogCategories.STORAGE, 'Saved valid items only', {
                    savedCount: validItems.length,
                    skippedCount: croppedItems.length - validItems.length
                  });
                }
              }
            }
          ]
        );
        return;
      }

      // Show warnings but proceed if only temporary URI warnings
      if (temporaryUris.length > 0) {
        logger.warn(LogCategories.STORAGE, 'Proceeding with temporary URI warnings', {
          temporaryCount: temporaryUris.length,
          warnings
        });
        
        Alert.alert(
          'Storage Warning',
          `${temporaryUris.length} images are in temporary storage and may be lost on app restart. Consider moving them to permanent storage.`,
          [
            { text: 'Continue Anyway', onPress: () => wardrobeData.saveBulkWardrobeItems(croppedItems) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // All validations passed - proceed with save
      logger.info(LogCategories.STORAGE, 'All URI validations passed', {
        validUris: validUris.length
      });
      
      return wardrobeData.saveBulkWardrobeItems(croppedItems);

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in validated bulk save', error);
      throw error;
    }
  }, [wardrobeData]);

  /**
   * Validated version of profile image save
   */
  const saveProfileImageValidated = useCallback(async (imageUri: string | null) => {
    if (!imageUri) {
      wardrobeData.setProfileImage(null);
      return;
    }

    logger.info(LogCategories.STORAGE, 'Validating profile image save', { imageUri });

    try {
      const result = await ValidatedStorageService.saveProfileImage(imageUri);
      
      if (result.success) {
        wardrobeData.setProfileImage(result.savedUri);
        if (result.warnings.length > 0) {
          setValidationWarnings(prev => [...prev, ...result.warnings]);
        }
      } else {
        logger.error(LogCategories.STORAGE, 'Profile image save blocked by validation', {
          warnings: result.warnings
        });
        
        Alert.alert(
          'Profile Image Error',
          result.warnings.join('\n'),
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in validated profile image save', error);
      throw error;
    }
  }, [wardrobeData]);

  /**
   * Batch validated save for multiple data types
   */
  const saveBatchValidated = useCallback(async (operations: {
    wardrobeItems?: WardrobeItem[];
    lovedOutfits?: LovedOutfit[];
    profileImage?: string | null;
  }) => {
    logger.info(LogCategories.STORAGE, 'Starting batch validated save', {
      hasWardrobeItems: !!operations.wardrobeItems,
      hasLovedOutfits: !!operations.lovedOutfits,
      hasProfileImage: operations.profileImage !== undefined
    });

    try {
      const result = await ValidatedStorageService.batchValidatedSave(operations);
      
      // Update local state with successful saves
      if (result.results.wardrobeItems?.success && operations.wardrobeItems) {
        wardrobeData.setSavedItems(result.results.wardrobeItems.saved);
      }
      
      if (result.results.lovedOutfits?.success && operations.lovedOutfits) {
        wardrobeData.setLovedOutfits(result.results.lovedOutfits.saved);
      }
      
      if (result.results.profileImage?.success) {
        wardrobeData.setProfileImage(result.results.profileImage.savedUri);
      }

      // Update warnings
      if (result.overallWarnings.length > 0) {
        setValidationWarnings(prev => [...prev, ...result.overallWarnings]);
      }

      if (!result.success) {
        Alert.alert(
          'Storage Validation Issues',
          `Some items could not be saved due to storage validation issues:\n\n${result.overallWarnings.join('\n')}`,
          [{ text: 'OK', style: 'default' }]
        );
      }

      return result;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error in batch validated save', error);
      throw error;
    }
  }, [wardrobeData]);

  /**
   * Audit existing stored data for validation issues
   */
  const auditStorageValidation = useCallback(async () => {
    logger.info(LogCategories.STORAGE, 'Starting storage validation audit');
    
    try {
      const audit = await ValidatedStorageService.auditStoredData();
      
      const summaryWarnings: string[] = [];
      
      // Wardrobe items summary
      if (audit.wardrobeItems.invalid > 0 || audit.wardrobeItems.temporary > 0) {
        summaryWarnings.push(
          `Wardrobe: ${audit.wardrobeItems.invalid} invalid, ${audit.wardrobeItems.temporary} temporary URIs`
        );
      }
      
      // Loved outfits summary
      if (audit.lovedOutfits.invalid > 0 || audit.lovedOutfits.temporary > 0) {
        summaryWarnings.push(
          `Outfits: ${audit.lovedOutfits.invalid} invalid, ${audit.lovedOutfits.temporary} temporary URIs`
        );
      }
      
      // Profile image summary
      if (audit.profileImage.exists && !audit.profileImage.valid) {
        summaryWarnings.push('Profile image has validation issues');
      }

      if (summaryWarnings.length > 0) {
        setValidationWarnings(prev => [...prev, ...summaryWarnings]);
        
        logger.warn(LogCategories.STORAGE, 'Storage audit found validation issues', audit);
        
        Alert.alert(
          'Storage Health Check',
          `Found storage validation issues:\n\n${summaryWarnings.join('\n')}\n\nConsider re-capturing affected images.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        logger.info(LogCategories.STORAGE, 'Storage audit passed - no validation issues');
      }
      
      return audit;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Error during storage audit', error);
      throw error;
    }
  }, []);

  /**
   * Clear validation warnings
   */
  const clearValidationWarnings = useCallback(() => {
    setValidationWarnings([]);
  }, []);

  /**
   * Quick storage safety check
   */
  const checkStorageSafety = useCallback(async (items: { image?: string }[]) => {
    const safety = URIValidationUtils.checkBatchStorageSafety(items);
    
    if (safety.unsafe > 0) {
      logger.warn(LogCategories.STORAGE, 'Storage safety check found issues', safety);
      setValidationWarnings(prev => [...prev, ...safety.details]);
    }
    
    return safety;
  }, []);

  return {
    // Original wardrobe data methods and state
    ...wardrobeData,
    
    // Validated save methods (override originals)
    saveBulkWardrobeItems: saveBulkWardrobeItemsValidated,
    saveProfileImage: saveProfileImageValidated,
    
    // New validation methods
    saveBatchValidated,
    auditStorageValidation,
    checkStorageSafety,
    clearValidationWarnings,
    
    // Validation state
    validationWarnings,
    hasValidationWarnings: validationWarnings.length > 0,
    
    // Validation utilities
    validateURI: URIValidator.validateURI,
    isSafeForStorage: URIValidationUtils.isSafeForStorage,
    getStorageTypeDescription: URIValidator.getStorageTypeDescription,
  };
};

export default useValidatedWardrobeData;