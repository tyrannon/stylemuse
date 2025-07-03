# StyleMuse Testing

This directory contains unit tests for the StyleMuse application.

## Running Tests

### Prerequisites
Install the testing dependencies:
```bash
npm install
```

### Commands
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Test Files

### useOutfitGeneration.test.ts
Comprehensive unit tests for the `useOutfitGeneration` hook that validate:

- **Hook Initialization**: Ensures all properties are properly initialized and no undefined values exist
- **State Management**: Tests all state setters and getters work correctly
- **Gear Slots Management**: Validates gear slot operations (set, clear, update)
- **Outfit Generation**: Tests the core outfit generation functionality
- **Error Handling**: Ensures graceful error handling and recovery
- **Robustness**: Tests edge cases and defensive programming

### Key Test Coverage

The tests prevent ReferenceError issues by:
1. Verifying all hook properties are defined on initialization
2. Testing that state setters work without throwing errors
3. Mocking all external dependencies (Haptics, Alert, etc.)
4. Testing edge cases with undefined/null values
5. Ensuring functions are callable and return expected types

### Mock Data
The tests use comprehensive mock data including:
- Sample wardrobe items with various categories
- Mock categorizeItem function that handles edge cases
- Proper React Native and Expo module mocking