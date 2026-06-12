# PWA Icons

This directory should contain PNG icons for the Progressive Web App manifest.

## Required Icons
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons
Use online tools like:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

## Command Line Generation
```bash
# Using ImageMagick
convert logo.svg -resize 72x72 public/icons/icon-72x72.png
convert logo.svg -resize 96x96 public/icons/icon-96x96.png
convert logo.svg -resize 128x128 public/icons/icon-128x128.png
convert logo.svg -resize 144x144 public/icons/icon-144x144.png
convert logo.svg -resize 152x152 public/icons/icon-152x152.png
convert logo.svg -resize 192x192 public/icons/icon-192x192.png
convert logo.svg -resize 384x384 public/icons/icon-384x384.png
convert logo.svg -resize 512x512 public/icons/icon-512x512.png
```
