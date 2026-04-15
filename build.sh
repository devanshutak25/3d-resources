#!/bin/bash
# Build script: converts README.md to static HTML site
# No Jekyll, no Ruby — just Node.js (available on all Cloudflare Pages builds)

npm install marked

node -e "
const { marked } = require('marked');
const fs = require('fs');

const md = fs.readFileSync('README.md', 'utf8');
const html = marked.parse(md);

const page = \`<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>3D Resources — Software, Assets, Tutorials &amp; Tools for 3D Artists</title>
  <meta name=\"description\" content=\"Curated list of free and paid 3D software, assets, textures, HDRIs, tutorials, plugins, and learning resources for Blender, Houdini, Cinema 4D, Maya, ZBrush, Unreal Engine, and more.\">
  <meta name=\"keywords\" content=\"3d resources, blender, houdini, cinema 4d, maya, zbrush, unreal engine, free 3d models, textures, hdri, pbr materials, vfx tutorials, 3d animation, game assets, render engines, motion graphics, digital art, 3d learning, substance painter, free assets, 3d software\">
  <meta name=\"robots\" content=\"index, follow\">
  <meta name=\"author\" content=\"Devanshu Tak\">
  <link rel=\"canonical\" href=\"https://3d.devanshutak.xyz/\">
  <meta name=\"google-site-verification\" content=\"he46sgCFXN80qPjWX_KNO2ZJ8aqhaysIvSu1TQhCj2U\">

  <!-- Open Graph -->
  <meta property=\"og:title\" content=\"3D Resources — Software, Assets, Tutorials & Tools for 3D Artists\">
  <meta property=\"og:description\" content=\"Curated list of free and paid 3D software, assets, textures, HDRIs, tutorials, plugins, and learning resources for Blender, Houdini, Cinema 4D, Maya, ZBrush, Unreal Engine, and more.\">
  <meta property=\"og:url\" content=\"https://3d.devanshutak.xyz/\">
  <meta property=\"og:type\" content=\"website\">
  <meta property=\"og:locale\" content=\"en_US\">
  <meta property=\"og:site_name\" content=\"3D Resources\">
  <meta property=\"og:image\" content=\"https://3d.devanshutak.xyz/assets/og-image.png\">
  <meta property=\"og:image:width\" content=\"1200\">
  <meta property=\"og:image:height\" content=\"630\">

  <!-- Twitter -->
  <meta name=\"twitter:card\" content=\"summary_large_image\">
  <meta name=\"twitter:title\" content=\"3D Resources — Software, Assets, Tutorials & Tools for 3D Artists\">
  <meta name=\"twitter:description\" content=\"Curated list of free and paid 3D software, assets, textures, HDRIs, tutorials, plugins, and learning resources.\">
  <meta name=\"twitter:image\" content=\"https://3d.devanshutak.xyz/assets/og-image.png\">

  <!-- Schema.org -->
  <script type=\"application/ld+json\">
  {
    \"@context\": \"https://schema.org\",
    \"@type\": \"CollectionPage\",
    \"name\": \"3D Resources — Software, Assets, Tutorials & Tools for 3D Artists\",
    \"description\": \"Curated list of free and paid 3D software, assets, textures, HDRIs, tutorials, plugins, and learning resources for Blender, Houdini, Cinema 4D, Maya, ZBrush, Unreal Engine, and more.\",
    \"url\": \"https://3d.devanshutak.xyz/\",
    \"author\": {
      \"@type\": \"Person\",
      \"name\": \"Devanshu Tak\",
      \"url\": \"https://devanshutak.xyz\"
    },
    \"about\": [
      {\"@type\": \"Thing\", \"name\": \"3D Modeling\"},
      {\"@type\": \"Thing\", \"name\": \"Visual Effects\"},
      {\"@type\": \"Thing\", \"name\": \"Animation\"},
      {\"@type\": \"Thing\", \"name\": \"Game Development\"},
      {\"@type\": \"Thing\", \"name\": \"Digital Art\"},
      {\"@type\": \"Thing\", \"name\": \"Rendering\"},
      {\"@type\": \"Thing\", \"name\": \"Motion Graphics\"}
    ],
    \"inLanguage\": \"en\",
    \"isAccessibleForFree\": true
  }
  </script>

  <link rel=\"icon\" type=\"image/svg+xml\" href=\"/assets/favicon.svg\">
  <link rel=\"stylesheet\" href=\"/assets/css/style.css\">
</head>
<body>
  <div class=\"wrapper\">
    <header>
      <p class=\"view\"><a href=\"https://github.com/devanshutak25/3d-resources\">View on GitHub <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z\"/></svg></a></p>
    </header>
    <main>
      \${html}
    </main>
    <footer>
      <p><small><a href=\"https://devanshutak.xyz\">devanshutak.xyz</a></small></p>
    </footer>
  </div>
</body>
</html>\`;

// Write output
fs.mkdirSync('_site', { recursive: true });
fs.cpSync('assets', '_site/assets', { recursive: true });
fs.writeFileSync('_site/index.html', page);
console.log('Built _site/index.html');
"
