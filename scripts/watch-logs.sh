#!/bin/bash

# StyleMuse Live Log Watcher
# Usage: ./scripts/watch-logs.sh [filter]

echo "📱 StyleMuse Live Log Watcher"
echo "=============================="

# Colors for different log levels
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to colorize logs
colorize_log() {
    while IFS= read -r line; do
        if [[ $line == *"ERROR"* || $line == *"❌"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"WARN"* || $line == *"⚠️"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"✅"* || $line == *"SUCCESS"* ]]; then
            echo -e "${GREEN}$line${NC}"
        elif [[ $line == *"🎲"* || $line == *"RandomOutfit"* ]]; then
            echo -e "${BLUE}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Check if Metro is running
if ! pgrep -f "expo start" > /dev/null; then
    echo "⚠️  Metro bundler not running. Starting Expo..."
    echo "Run 'npx expo start' in another terminal first!"
    exit 1
fi

echo "🔍 Watching logs... (Ctrl+C to stop)"
echo ""

# Filter argument handling
case "$1" in
    "errors")
        echo "📕 Filtering: ERRORS ONLY"
        npx react-native log-ios 2>/dev/null | grep -E "(ERROR|❌|WARN|⚠️)" | colorize_log
        ;;
    "outfit")
        echo "🎲 Filtering: OUTFIT GENERATION"
        npx react-native log-ios 2>/dev/null | grep -E "(RandomOutfit|outfit|generation|🎲)" | colorize_log
        ;;
    "performance")
        echo "⚡ Filtering: PERFORMANCE"
        npx react-native log-ios 2>/dev/null | grep -E "(performance|duration|timing|slow)" | colorize_log
        ;;
    "clean")
        echo "🧹 Filtering: CLEAN (No debug spam)"
        npx react-native log-ios 2>/dev/null | grep -v -E "(DEBUG|monetization|UnifiedLoading.*Hook|Tier management)" | colorize_log
        ;;
    *)
        echo "📋 Showing: ALL LOGS"
        echo "Available filters: errors, outfit, performance, clean"
        npx react-native log-ios 2>/dev/null | colorize_log
        ;;
esac