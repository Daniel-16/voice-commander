#!/bin/bash

# Remove existing icon files except the base icon
rm -f icon-*.png

# Array of required sizes
sizes=(72 96 128 144 152 192 384 512)

# Base icon
base_icon="icon.png"

# Generate icons for each size with exact dimensions
for size in "${sizes[@]}"; do
  convert "$base_icon" -resize ${size}x${size}^ \
    -gravity center \
    -extent ${size}x${size} \
    -strip \
    -quality 95 \
    "icon-${size}x${size}.png"
  
  # Verify the dimensions
  dimensions=$(identify -format "%wx%h" "icon-${size}x${size}.png")
  if [ "$dimensions" != "${size}x${size}" ]; then
    echo "Error: icon-${size}x${size}.png has incorrect dimensions: $dimensions"
    exit 1
  fi
done

echo "All icons generated successfully with correct dimensions!" 