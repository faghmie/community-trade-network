#!/bin/bash

# Define the port to use (default to 8000)
PORT=${1:-8000}

# Function to get the local IP address
get_local_ip() {
    # Try common methods to get the local IP
    if command -v ip &> /dev/null; then
        # Use 'ip' command (common on Linux)
        ip route get 1 | awk '{print $7; exit}'
    elif command -v ifconfig &> /dev/null; then
        # Use 'ifconfig' (common on macOS and some Linux systems)
        ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1
    else
        # Fallback: try to get IP from hostname
        hostname -I | awk '{print $1}'
    fi
}

# Get the local IP address
LOCAL_IP=$(get_local_ip)

# Check if IP was found
if [ -z "$LOCAL_IP" ]; then
    echo "Error: Could not determine local IP address."
    exit 1
fi

echo "Starting HTTP server on $LOCAL_IP:$PORT..."
echo "Access the server at: http://$LOCAL_IP:$PORT"

# Start the Python HTTP server bound to the local IP
python -m http.server "$PORT" --bind 0.0.0.0