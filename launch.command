#!/bin/bash
# DJ Beatchic Local Server & Browser Launcher
cd "$(dirname "$0")"

PORT=8080

echo "=================================================="
echo "  ✨ DJ BEATCHIC • LOCAL BOOTH DISPLAY SERVER ✨  "
echo "=================================================="
echo "Starting local server at http://localhost:$PORT ..."
echo ""
echo "Press Ctrl+C at any time to stop the server."
echo "=================================================="

# Open in default browser after 1 second
(sleep 1 && open "http://localhost:$PORT/display/") &

# Start built-in macOS Ruby HTTP server
ruby -run -e httpd . -p $PORT

