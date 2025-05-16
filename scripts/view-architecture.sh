#!/bin/bash
set -e

# Get the absolute path to the architecture.html file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
ARCH_FILE="$REPO_ROOT/docs/architecture.html"

# Check if the file exists
if [ ! -f "$ARCH_FILE" ]; then
  echo "Error: Architecture diagram not found at $ARCH_FILE"
  exit 1
fi

# Open the architecture diagram in the default browser
echo "Opening architecture diagram in your default browser..."

# Detect OS and open accordingly
case "$(uname -s)" in
  Darwin*)  # macOS
    open "$ARCH_FILE"
    ;;
  Linux*)   # Linux
    if command -v xdg-open > /dev/null; then
      xdg-open "$ARCH_FILE"
    else
      echo "Could not detect a browser opener. Please open this file manually:"
      echo "$ARCH_FILE"
    fi
    ;;
  CYGWIN*|MINGW*|MSYS*)  # Windows
    start "$ARCH_FILE"
    ;;
  *)
    echo "Could not detect your operating system. Please open this file manually:"
    echo "$ARCH_FILE"
    ;;
esac

echo "If a browser didn't open automatically, please open this file manually:"
echo "$ARCH_FILE" 