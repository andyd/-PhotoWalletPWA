import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test images directory if it doesn't exist
const testImagesDir = path.join(__dirname, 'test-images');
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir);
}

// Create a simple HTML file that generates test images
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Generate Test Images</title>
</head>
<body>
    <h1>Generating Test Images...</h1>
    <div id="status"></div>
    
    <script>
        const images = [
            { name: 'test-image-1.jpg', color: '#FF6B6B', text: 'Test Image 1' },
            { name: 'test-image-2.jpg', color: '#4ECDC4', text: 'Test Image 2' },
            { name: 'test-image-3.jpg', color: '#45B7D1', text: 'Test Image 3' },
            { name: 'test-image-4.jpg', color: '#96CEB4', text: 'Test Image 4' },
            { name: 'test-image-5.jpg', color: '#FFEAA7', text: 'Test Image 5' }
        ];
        
        let completed = 0;
        
        images.forEach((img, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            // Draw background
            ctx.fillStyle = img.color;
            ctx.fillRect(0, 0, 400, 300);
            
            // Add some pattern
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            for (let i = 0; i < 20; i++) {
                ctx.fillRect(Math.random() * 400, Math.random() * 300, 10, 10);
            }
            
            // Add text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(img.text, 200, 150);
            
            // Add smaller text
            ctx.font = '16px Arial';
            ctx.fillText('Photo Wallet Test', 200, 180);
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = img.name;
                a.click();
                URL.revokeObjectURL(url);
                
                completed++;
                document.getElementById('status').innerHTML = \`Generated \${completed}/\${images.length} images\`;
                
                if (completed === images.length) {
                    document.getElementById('status').innerHTML = 'All test images generated! Check your downloads folder.';
                }
            }, 'image/jpeg', 0.9);
        });
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'generate-test-images.html'), htmlContent);

console.log('✅ Test image generator created!');
console.log('📁 Open generate-test-images.html in your browser to create test images');
console.log('📸 The images will be downloaded to your Downloads folder');
console.log('🎯 You can then use these images to test the Photo Wallet app');
