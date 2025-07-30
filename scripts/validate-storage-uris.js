#!/usr/bin/env node

/**
 * Storage URI Validation Script
 * 
 * This script validates image URIs in AsyncStorage to identify potential issues
 * with temporary URIs that may cause image persistence problems.
 * 
 * Usage:
 *   node scripts/validate-storage-uris.js
 *   node scripts/validate-storage-uris.js --fix
 *   node scripts/validate-storage-uris.js --report-only
 */

const fs = require('fs');
const path = require('path');

// Storage key constants (should match your app)
const STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',
  LOVED_OUTFITS: 'stylemuse_loved_outfits',
  PROFILE_IMAGE: 'stylemuse_profile_image',
};

// Validation patterns
const PERSISTENT_PATTERNS = [
  /\/Documents\//,
  /\/files\//,
  /\/stylemuse\//,
];

const TEMPORARY_PATTERNS = [
  /\/cache\//,
  /\/tmp\//,
  /\/ImagePicker\//,
  /\/camera\//,
  /\/ExponentExperienceData\//,
  /\/ImageManipulator\//,
];

const NETWORK_PATTERNS = [
  /^https?:\/\//,
  /^ftp:\/\//,
];

/**
 * Validate a single URI
 */
function validateURI(uri) {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    return {
      isValid: false,
      isPersistent: false,
      isTemporary: false,
      type: 'invalid-malformed',
      issues: ['URI is empty or malformed'],
    };
  }

  const isNetwork = NETWORK_PATTERNS.some(pattern => pattern.test(uri));
  const isPersistent = PERSISTENT_PATTERNS.some(pattern => pattern.test(uri));
  const isTemporary = TEMPORARY_PATTERNS.some(pattern => pattern.test(uri));

  const issues = [];
  let type = 'unknown';

  if (isNetwork) {
    type = 'network-url';
    issues.push('Network URL - may not be accessible offline');
  } else if (isPersistent) {
    type = 'persistent';
  } else if (isTemporary) {
    type = 'temporary';
    issues.push('Temporary storage - may be lost on app restart');
  } else {
    type = 'unknown';
    issues.push('Unknown storage type - validation needed');
  }

  // Additional validation
  if (uri.includes('/cache/')) {
    issues.push('Cache directory - temporary storage');
  }
  if (uri.includes('/tmp/')) {
    issues.push('Temporary directory - will be cleaned up');
  }
  if (uri.includes('ImagePicker')) {
    issues.push('ImagePicker temporary location');
  }

  return {
    isValid: isPersistent && !isTemporary,
    isPersistent,
    isTemporary,
    type,
    issues,
  };
}

/**
 * Validate wardrobe items
 */
function validateWardrobeItems(items) {
  const results = {
    total: items.length,
    valid: 0,
    invalid: 0,
    temporary: 0,
    issues: [],
  };

  items.forEach((item, index) => {
    if (item.image) {
      const validation = validateURI(item.image);
      
      if (validation.isValid) {
        results.valid++;
      } else {
        results.invalid++;
      }

      if (validation.isTemporary) {
        results.temporary++;
      }

      if (validation.issues.length > 0) {
        results.issues.push({
          itemIndex: index,
          itemTitle: item.title || 'Untitled',
          uri: item.image,
          type: validation.type,
          issues: validation.issues,
        });
      }
    } else {
      results.valid++; // Items without images are considered valid
    }
  });

  return results;
}

/**
 * Validate loved outfits
 */
function validateLovedOutfits(outfits) {
  const results = {
    total: outfits.length,
    valid: 0,
    invalid: 0,
    temporary: 0,
    issues: [],
  };

  outfits.forEach((outfit, outfitIndex) => {
    let outfitValid = true;
    let outfitTemporary = false;

    if (outfit.image) {
      const validation = validateURI(outfit.image);
      
      if (!validation.isValid) outfitValid = false;
      if (validation.isTemporary) outfitTemporary = true;

      if (validation.issues.length > 0) {
        results.issues.push({
          outfitIndex,
          outfitId: outfit.id || 'Unknown',
          uri: outfit.image,
          type: validation.type,
          issues: validation.issues,
        });
      }
    }

    // Check items within outfit
    if (outfit.items && Array.isArray(outfit.items)) {
      outfit.items.forEach((item, itemIndex) => {
        if (item.image) {
          const validation = validateURI(item.image);
          
          if (!validation.isValid) outfitValid = false;
          if (validation.isTemporary) outfitTemporary = true;

          if (validation.issues.length > 0) {
            results.issues.push({
              outfitIndex,
              outfitId: outfit.id || 'Unknown',
              itemIndex,
              uri: item.image,
              type: validation.type,
              issues: validation.issues,
            });
          }
        }
      });
    }

    if (outfitValid) results.valid++;
    else results.invalid++;
    
    if (outfitTemporary) results.temporary++;
  });

  return results;
}

/**
 * Generate validation report
 */
function generateReport(validationResults) {
  const { wardrobeItems, lovedOutfits, profileImage } = validationResults;
  
  console.log('\n📊 STORAGE URI VALIDATION REPORT');
  console.log('═'.repeat(50));
  
  // Wardrobe Items Summary
  console.log('\n👕 WARDROBE ITEMS');
  console.log(`Total items: ${wardrobeItems.total}`);
  console.log(`✅ Valid: ${wardrobeItems.valid}`);
  console.log(`❌ Invalid: ${wardrobeItems.invalid}`);
  console.log(`⚠️  Temporary: ${wardrobeItems.temporary}`);
  
  if (wardrobeItems.issues.length > 0) {
    console.log('\n📋 Wardrobe Issues:');
    wardrobeItems.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.itemTitle} (${issue.type})`);
      issue.issues.forEach(issueText => {
        console.log(`     - ${issueText}`);
      });
    });
  }

  // Loved Outfits Summary
  console.log('\n💖 LOVED OUTFITS');
  console.log(`Total outfits: ${lovedOutfits.total}`);
  console.log(`✅ Valid: ${lovedOutfits.valid}`);
  console.log(`❌ Invalid: ${lovedOutfits.invalid}`);
  console.log(`⚠️  Temporary: ${lovedOutfits.temporary}`);
  
  if (lovedOutfits.issues.length > 0) {
    console.log('\n📋 Outfit Issues:');
    lovedOutfits.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. Outfit ${issue.outfitId} (${issue.type})`);
      issue.issues.forEach(issueText => {
        console.log(`     - ${issueText}`);
      });
    });
  }

  // Profile Image Summary
  if (profileImage.exists) {
    console.log('\n🖼️  PROFILE IMAGE');
    console.log(`✅ Valid: ${profileImage.valid ? 'Yes' : 'No'}`);
    if (profileImage.issues.length > 0) {
      console.log('📋 Profile Issues:');
      profileImage.issues.forEach(issueText => {
        console.log(`  - ${issueText}`);
      });
    }
  }

  // Overall Summary
  const totalIssues = wardrobeItems.issues.length + lovedOutfits.issues.length + profileImage.issues.length;
  const totalTemporary = wardrobeItems.temporary + lovedOutfits.temporary + (profileImage.isTemporary ? 1 : 0);
  
  console.log('\n🎯 SUMMARY');
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Items in temporary storage: ${totalTemporary}`);
  
  if (totalIssues === 0) {
    console.log('🎉 All URIs are valid and properly stored!');
  } else {
    console.log('⚠️  Issues found - consider migrating affected images to persistent storage.');
  }
  
  console.log('\n💡 RECOMMENDATIONS');
  if (totalTemporary > 0) {
    console.log('• Re-capture or re-select images in temporary storage');
    console.log('• Use ImagePersistenceService to migrate images to permanent storage');
  }
  if (wardrobeItems.invalid > 0 || lovedOutfits.invalid > 0) {
    console.log('• Remove or replace items with invalid URIs');
    console.log('• Implement URI validation before storage operations');
  }
}

/**
 * Mock validation - in real app this would read from AsyncStorage
 */
function mockValidation() {
  console.log('🔍 MOCK VALIDATION (replace with actual AsyncStorage data)');
  
  const mockWardrobeItems = [
    {
      title: 'Valid Image',
      image: 'file:///data/user/0/com.example.app/files/stylemuse/images/wardrobe/image1.jpg'
    },
    {
      title: 'Temporary Image',
      image: 'file:///data/user/0/com.example.app/cache/ImagePicker/temp_image.jpg'
    },
    {
      title: 'Network Image',
      image: 'https://example.com/image.jpg'
    },
    {
      title: 'No Image Item'
    }
  ];

  const mockLovedOutfits = [
    {
      id: 'outfit1',
      image: 'file:///data/user/0/com.example.app/files/stylemuse/images/outfits/outfit1.jpg',
      items: [
        { image: 'file:///data/user/0/com.example.app/cache/camera/temp.jpg' },
        { image: 'file:///data/user/0/com.example.app/files/stylemuse/images/valid.jpg' }
      ]
    }
  ];

  const mockProfileImage = 'file:///data/user/0/com.example.app/files/stylemuse/images/profile/profile.jpg';

  return {
    wardrobeItems: validateWardrobeItems(mockWardrobeItems),
    lovedOutfits: validateLovedOutfits(mockLovedOutfits),
    profileImage: {
      exists: !!mockProfileImage,
      valid: mockProfileImage ? validateURI(mockProfileImage).isValid : false,
      isTemporary: mockProfileImage ? validateURI(mockProfileImage).isTemporary : false,
      issues: mockProfileImage ? validateURI(mockProfileImage).issues : [],
    }
  };
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const reportOnly = args.includes('--report-only');
  const fix = args.includes('--fix');

  console.log('🔍 Storage URI Validation Tool');
  console.log('Purpose: Identify temporary URIs that may cause image persistence issues\n');

  // In a real implementation, you would:
  // 1. Read from AsyncStorage using the storage keys
  // 2. Parse the JSON data
  // 3. Validate each URI
  // 4. Optionally fix issues by migrating to persistent storage

  const validationResults = mockValidation();
  generateReport(validationResults);

  if (fix) {
    console.log('\n🔧 FIX MODE');
    console.log('In a real implementation, this would:');
    console.log('• Migrate temporary URIs to persistent storage');
    console.log('• Update AsyncStorage with new URIs');
    console.log('• Create backup of original data');
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Validation complete. Use --fix to attempt repairs.');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateURI,
  validateWardrobeItems,
  validateLovedOutfits,
  generateReport,
};