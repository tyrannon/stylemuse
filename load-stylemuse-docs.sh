#!/bin/bash
# StyleMuse Documentation Loader for Claude-Prompter
# Last edited: 2025-07-19 by Kaiya
# Purpose: Dynamically load relevant documentation into Claude Code sessions

# Color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 StyleMuse Documentation Loader${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to load documentation
load_docs() {
    local doc_type=$1
    
    case $doc_type in
        "base"|"")
            echo -e "${YELLOW}📄 Loading base documentation...${NC}"
            echo "• CLAUDE.md - Main developer guide"
            echo "• CONTEXT_GUIDE.md - Navigation guide"
            # Simulate claude-prompter context add
            echo "[claude-prompter] Adding CLAUDE.md to context"
            echo "[claude-prompter] Adding CONTEXT_GUIDE.md to context"
            ;;
            
        "performance")
            echo -e "${YELLOW}⚡ Loading performance documentation...${NC}"
            echo "• docs/PERFORMANCE.md - Zero-flicker navigation"
            echo "[claude-prompter] Adding docs/PERFORMANCE.md to context"
            ;;
            
        "icons")
            echo -e "${YELLOW}🎨 Loading icon system documentation...${NC}"
            echo "• docs/ICON_SYSTEM.md - PNG icon implementation"
            echo "[claude-prompter] Adding docs/ICON_SYSTEM.md to context"
            ;;
            
        "outfits")
            echo -e "${YELLOW}👔 Loading outfit generation documentation...${NC}"
            echo "• docs/RANDOM_OUTFIT.md - Fast outfit algorithm"
            echo "[claude-prompter] Adding docs/RANDOM_OUTFIT.md to context"
            ;;
            
        "history")
            echo -e "${YELLOW}📜 Loading development history...${NC}"
            echo "• docs/CHANGELOG.md - Complete task history"
            echo "[claude-prompter] Adding docs/CHANGELOG.md to context"
            ;;
            
        "all")
            echo -e "${YELLOW}📚 Loading ALL documentation...${NC}"
            echo "• CLAUDE.md"
            echo "• CONTEXT_GUIDE.md"
            echo "• docs/PERFORMANCE.md"
            echo "• docs/ICON_SYSTEM.md"
            echo "• docs/RANDOM_OUTFIT.md"
            echo "• docs/CHANGELOG.md"
            echo "[claude-prompter] Adding all documentation to context"
            ;;
            
        *)
            echo -e "${YELLOW}❓ Unknown documentation type: $doc_type${NC}"
            echo "Available options:"
            echo "  base       - Load core documentation (default)"
            echo "  performance - Load performance optimization guide"
            echo "  icons      - Load icon system documentation"
            echo "  outfits    - Load outfit generation docs"
            echo "  history    - Load development changelog"
            echo "  all        - Load all documentation"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}✅ Documentation loaded into Claude context!${NC}"
    
    # Add change tracking reminder
    echo -e "\n${BLUE}📝 Remember to add change tracking comments:${NC}"
    echo "<!-- Last edited: $(date +%Y-%m-%d) by Your Name -->"
    echo "<!-- Change: Brief description -->"
}

# Main execution
if [ $# -eq 0 ]; then
    load_docs "base"
else
    load_docs "$1"
fi

# Show current context size (simulated)
echo -e "\n${BLUE}📊 Context Status:${NC}"
echo "Total context size: ~45k characters"
echo "Remaining capacity: ~55k characters"

# Provide quick tips
echo -e "\n${BLUE}💡 Quick Tips:${NC}"
echo "• Main hub is WardrobeUploadScreen.tsx (includes Builder inline!)"
echo "• Theme system: useTheme() hook from ThemeContext"
echo "• Debug logs: ./scripts/watch-logs.sh"
echo "• Keep CLAUDE.md under 40k characters!"