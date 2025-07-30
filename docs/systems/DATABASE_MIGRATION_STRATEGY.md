# StyleMuse Database Migration Strategy
<!-- Last edited: 2025-07-29 by Claude Code -->
<!-- Phase: Documentation and Phase 1 Implementation -->

## Executive Summary

This document outlines the comprehensive strategy for migrating StyleMuse from AsyncStorage to a robust database system while implementing user authentication. The approach solves immediate image persistence issues and establishes a foundation for multi-user capabilities.

## Critical Issue Analysis

### Root Cause: Image Disappearance
**Location**: `/hooks/useWardrobeData.ts:1231`
```typescript
// PROBLEMATIC CODE - stores temporary URIs
image: item.croppedUri,  // These URIs become invalid after app restarts
```

**Solution Available**: `ImagePersistenceService.ts` already implements proper FileSystem.documentDirectory storage with thumbnails and migration tools, but isn't consistently used in bulk operations.

## Phase 1: Immediate Image Fix (CURRENT PHASE)
**Timeline**: 1-2 weeks  
**Priority**: CRITICAL - Prevents user data loss

### Implementation Tasks

#### 1. Fix saveBulkWardrobeItems Function
**File**: `/hooks/useWardrobeData.ts`  
**Lines**: 1210-1287

**Current Issue**:
```typescript
const wardrobeItem: WardrobeItem = {
  // ... other fields  
  image: item.croppedUri,  // ❌ PROBLEM: Temp URI storage
  // ... rest of item
};
```

**Required Fix**:
```typescript
const wardrobeItem: WardrobeItem = {
  // ... other fields
  image: await imagePersistence.persistImage(
    item.croppedUri, 
    'wardrobe', 
    generateUniqueId()
  ).originalUri,  // ✅ SOLUTION: Persistent URI
  // ... rest of item  
};
```

#### 2. Migration Script for Existing Users
**Purpose**: Repair existing broken image references
**Implementation**: Use existing `ImagePersistenceService.migrateImages()` (lines 215-275)

**Migration Logic**:
1. Detect temp URIs in existing wardrobe data
2. Attempt to find corresponding files in temp directories
3. Move valid images to persistent storage
4. Update wardrobe data with new URIs
5. Remove invalid/broken references

#### 3. URI Validation Layer
**Purpose**: Prevent future temp URI storage
**Implementation**: Add validation before any AsyncStorage write

```typescript
const validateImageUri = (uri: string): boolean => {
  // Check if URI is in persistent directory
  return uri.includes(FileSystem.documentDirectory);
};
```

### Phase 1 Success Criteria
- ✅ Zero new image loss reports
- ✅ Automatic migration success rate >99%
- ✅ <1% user-reported issues
- ✅ Existing app functionality preserved

## Phase 2: SQLite Foundation (NEXT PHASE)
**Timeline**: 3-4 weeks  
**Priority**: HIGH - Enables offline-first architecture

### Database Choice: SQLite
**Rationale**:
- Offline-first capabilities
- Minimal migration complexity from AsyncStorage
- Strong TypeScript support
- Small bundle size impact
- Preserves existing single-user workflow

### Schema Design
```sql
-- Users table (anonymous initially)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_anonymous BOOLEAN DEFAULT TRUE,
  migration_completed BOOLEAN DEFAULT FALSE
);

-- Wardrobe items with proper image references
CREATE TABLE wardrobe_items (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  category TEXT,
  image_uri TEXT,  -- Persistent file:// URI
  thumbnail_uri TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT  -- JSON blob for flexibility
);

-- Outfits and relationships
CREATE TABLE outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  items TEXT,  -- JSON array of wardrobe_item IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Phase 3: Cloud Sync Infrastructure (FUTURE)
**Timeline**: 4-5 weeks  
**Priority**: MEDIUM - Future scalability

### Database Choice: Supabase + PostgreSQL
**Features**:
- Built-in authentication system
- Real-time sync capabilities  
- Image storage with CDN
- Offline-first with conflict resolution
- Anonymous to authenticated user upgrade path

### User Experience Design
- **Anonymous First**: No account required initially
- **Progressive Enhancement**: "Sign up to sync across devices" 
- **Zero Disruption**: Preserve all data during account creation
- **Optional Cloud**: Users can remain fully offline

## Implementation Priority

### Immediate (Week 1-2)
1. **Fix useWardrobeData.ts integration** with ImagePersistenceService
2. **Create migration script** for existing users' broken images
3. **Add URI validation** to prevent future temp URI storage
4. **Comprehensive testing** of image persistence

### Next Phase (Week 3-6)  
5. **SQLite integration** with offline-first architecture
6. **Data layer abstraction** maintaining StorageService.ts API compatibility
7. **AsyncStorage to SQLite migration** with fallback protection

### Future Phases (Week 7+)
8. **Supabase backend setup** for cloud sync capabilities
9. **User authentication system** with anonymous upgrade path
10. **Multi-device synchronization** with conflict resolution

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Data loss during migration | Comprehensive backup before any changes, rollback procedures |
| Performance degradation | Background processing, incremental migration |
| User experience disruption | Anonymous-first design, optional enhancements |
| Image storage space issues | Automatic cleanup, thumbnail optimization |

## Technical Dependencies

### Phase 1 Requirements
- ✅ Existing ImagePersistenceService (already implemented)
- ✅ Existing DataMigrationService (already implemented)  
- ✅ UUID generation utilities (already available)

### Phase 2 Requirements
- 📦 `react-native-sqlite-storage` (to be added)
- 📦 Database migration utilities (to be built)
- 📦 Data access layer abstraction (to be built)

### Phase 3 Requirements  
- 📦 `@supabase/supabase-js` (to be added)
- 📦 Authentication components (to be built)
- 📦 Sync conflict resolution (to be built)

## Files Requiring Changes

### Phase 1 (Immediate)
- ✏️ `/hooks/useWardrobeData.ts` - Fix line 1231 image storage
- ✏️ `/services/DataMigrationService.ts` - Add broken image repair
- 🆕 `/utils/ImageUriValidator.ts` - URI validation utilities

### Phase 2 (Next)
- 🆕 `/services/database/SQLiteService.ts` - Database abstraction layer
- 🆕 `/services/database/migrations/` - Database migration scripts
- ✏️ `/services/StorageService.ts` - Add SQLite backend option

### Phase 3 (Future)  
- 🆕 `/services/auth/AuthService.ts` - Authentication management
- 🆕 `/services/sync/SyncService.ts` - Cloud synchronization
- 🆕 `/components/auth/` - Authentication UI components

## Success Metrics

### Phase 1 Metrics
- Image persistence success rate: >99%
- User-reported image loss: <1%
- App performance impact: <5% slower startup
- Migration completion rate: >99%

### Phase 2 Metrics  
- Data consistency across app sessions: 100%
- Query performance vs AsyncStorage: >2x faster
- Offline functionality: Enhanced
- Storage space efficiency: >20% improvement

### Phase 3 Metrics
- User account adoption rate: >10% 
- Cross-device sync reliability: >99.9%
- Cloud backup success rate: >99.9%
- Anonymous to authenticated conversion: >15%

## Next Steps

1. **Begin Phase 1 immediately** - Fix image persistence critical issue
2. **Validate implementation** with comprehensive testing
3. **Document Phase 2 SQLite schema** in detail
4. **Set up development environment** for Supabase integration

This phased approach ensures StyleMuse maintains excellent user experience while systematically eliminating technical debt and preparing for future growth.

---
> **Status**: Phase 1 in progress - Critical image persistence fix
> **Next Review**: After Phase 1 completion
> **Owner**: StyleMuse Development Team