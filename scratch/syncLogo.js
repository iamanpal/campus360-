const fs = require('fs');
const path = require('path');

const srcLogo = path.join(__dirname, '..', 'logo.png');
if (fs.existsSync(srcLogo)) {
  const publicDir = path.join(__dirname, '..', 'public');
  const publicImgDir = path.join(publicDir, 'images');
  if (!fs.existsSync(publicImgDir)) {
    fs.mkdirSync(publicImgDir, { recursive: true });
  }
  fs.copyFileSync(srcLogo, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(srcLogo, path.join(publicImgDir, 'logo.png'));
  console.log('Logo copied successfully to public/ and public/images/');
} else {
  console.log('Source logo.png not found');
}
