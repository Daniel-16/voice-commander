#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# Array of required sizes
sizes=(72 96 128 144 152 192 384 512)

# Base icon (assuming you have a base icon.png file)
base_icon="icon.png"

# Generate icons for each size
for size in "${sizes[@]}"; do
  convert "$base_icon" -resize "${size}x${size}" "icon-${size}x${size}.png"
done 