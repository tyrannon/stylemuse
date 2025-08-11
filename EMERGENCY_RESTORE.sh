#!/bin/bash

# EMERGENCY RESTORE SCRIPT FOR STYLEMUSE
# Run this if the app breaks and you need to get back to working state

echo "🚨 EMERGENCY RESTORE INITIATED 🚨"
echo "This will restore StyleMuse to the last known working state"
echo ""
read -p "Are you sure you want to restore? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📦 Step 1: Reverting all changes..."
    git checkout -- .
    
    echo "🔄 Step 2: Checking out save point..."
    git checkout 96a70c2
    
    echo "🧹 Step 3: Cleaning node_modules..."
    rm -rf node_modules
    rm package-lock.json
    
    echo "🔧 Step 4: Clearing npm cache..."
    npm cache clean --force
    
    echo "📥 Step 5: Reinstalling packages..."
    npm install
    
    echo "🚀 Step 6: Starting with clean cache..."
    npx expo start --clear
    
    echo ""
    echo "✅ RESTORATION COMPLETE!"
    echo "The app should now be working. Check http://localhost:8081"
else
    echo "❌ Restoration cancelled"
fi