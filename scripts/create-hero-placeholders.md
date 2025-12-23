# Script để tạo Hero Banner Placeholder Images

## Option 1: Sử dụng Online Tools

1. **Canva** (https://www.canva.com/)
   - Template: "Banner" hoặc "Hero Image"
   - Size: 1920x800px
   - Export: JPEG, Quality 85%

2. **Figma** (https://www.figma.com/)
   - Frame: 1920x800px
   - Export: JPEG, Quality 85%

3. **Photoshop**
   - New Document: 1920x800px, 72 DPI
   - Export: Save for Web, JPEG, Quality 85%

## Option 2: Sử dụng AI Image Generator

1. **Midjourney / DALL-E**
   - Prompt: "Cute teddy bear on soft background, e-commerce banner, 1920x800, high quality, professional photography"
   - Download và resize về 1920x800px

2. **Stable Diffusion**
   - Model: Realistic Vision hoặc DreamShaper
   - Size: 1920x800px
   - Steps: 30-50

## Option 3: Sử dụng Stock Photos

1. **Unsplash** (https://unsplash.com/)
   - Search: "teddy bear", "soft toys", "plush toys"
   - Download và crop về 1920x800px

2. **Pexels** (https://www.pexels.com/)
   - Search: "teddy bear", "stuffed animals"
   - Download và crop về 1920x800px

## Optimization Steps

Sau khi có ảnh:

1. **Resize** về 1920x800px (nếu cần)
2. **Compress** bằng TinyPNG hoặc Squoosh
3. **Rename** thành `hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg`
4. **Place** vào `public/images/` folder

## Quick Command (nếu có ImageMagick)

```bash
# Resize và optimize
magick input.jpg -resize 1920x800^ -gravity center -extent 1920x800 -quality 85 hero-1.jpg

# Batch process
for i in {1..3}; do
  magick input-$i.jpg -resize 1920x800^ -gravity center -extent 1920x800 -quality 85 hero-$i.jpg
done
```

