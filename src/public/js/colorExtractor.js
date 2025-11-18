
// Class to extract colors from album cover art and apply dynamic gradients
class ColorExtractor {
    constructor(options = {}) {
        // Configuration variables that can be altered
        this.config = {
            minColorPercentage: options.minColorPercentage || 0.20, // 20% minimum usage
            maxColors: options.maxColors || 4,
            colorSimilarityThreshold: options.colorSimilarityThreshold || 10, // RGB difference threshold
            canvasSize: options.canvasSize || 100, // Smaller canvas for faster processing
            gradientDirections: options.gradientDirections || [
                "linear-gradient(45deg, {colors})",
                "linear-gradient(135deg, {colors})",
                "radial-gradient(circle at center, {colors})",
                "linear-gradient(to right, {colors})",
                "linear-gradient(to bottom right, {colors})"
            ]
        };
    }

    // Extract colors from an image element
    extractColors(imageElement) {
        return new Promise((resolve, reject) => {
            try {
                // Create a new image with CORS enabled
                const corsImage = new Image();
                corsImage.crossOrigin = "anonymous";
                
                corsImage.onload = () => {
                    try {
                        // Create canvas for color analysis
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        
                        canvas.width = this.config.canvasSize;
                        canvas.height = this.config.canvasSize;
                        
                        // Draw image to canvas
                        ctx.drawImage(corsImage, 0, 0, canvas.width, canvas.height);
                        
                        // Get image data
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const pixels = imageData.data;
                        
                        // Count colors
                        const colorCounts = {};
                        const totalPixels = pixels.length / 4;
                        
                        for (let i = 0; i < pixels.length; i += 4) {
                            const r = pixels[i];
                            const g = pixels[i + 1];
                            const b = pixels[i + 2];
                            const alpha = pixels[i + 3];
                            
                            // Skip transparent pixels
                            if (alpha < 128) continue;
                            
                            // Group similar colors
                            const colorKey = this.getColorGroup(r, g, b);
                            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
                        }
                        
                        // Convert to array and sort by frequency
                        const colorArray = Object.entries(colorCounts)
                            .map(([color, count]) => ({
                                color: color,
                                count: count,
                                percentage: count / totalPixels,
                                rgb: color.split(",").map(Number)
                            }))
                            .sort((a, b) => b.count - a.count);
                        
                        // Filter colors by minimum percentage or get most common
                        let selectedColors = colorArray.filter(
                            color => color.percentage >= this.config.minColorPercentage
                        );
                        
                        // If no colors meet the threshold, use most common colors
                        if (selectedColors.length === 0) {
                            selectedColors = colorArray.slice(0, this.config.maxColors);
                        } else {
                            selectedColors = selectedColors.slice(0, this.config.maxColors);
                        }
                        
                        // Ensure we have at least one color
                        if (selectedColors.length === 0 && colorArray.length > 0) {
                            selectedColors = [colorArray[0]];
                        }
                        
                        resolve(selectedColors);
                        
                    } catch (canvasError) {
                        // No fallback colors - let body keep existing background
                        resolve([]);
                    }
                };
                
                corsImage.onerror = () => {
                    resolve([]);
                };
                
                // Set the image source to trigger loading
                corsImage.src = imageElement.src;
                
            } catch (error) {
                resolve([]);
            }
        });
    }



    // Group similar colors based on threshold
    getColorGroup(r, g, b) {
        // Round colors to reduce similar variations
        const threshold = this.config.colorSimilarityThreshold;
        const groupedR = Math.round(r / threshold) * threshold;
        const groupedG = Math.round(g / threshold) * threshold;
        const groupedB = Math.round(b / threshold) * threshold;
        
        return `${Math.min(255, groupedR)},${Math.min(255, groupedG)},${Math.min(255, groupedB)}`;
    }

    // Convert RGB array to CSS rgb() string
    rgbToCss(rgb) {
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    // Generate CSS gradient from extracted colors
    generateGradient(colors) {
        if (colors.length === 0) {
            return null; // No gradient if no colors extracted
        }

        // Convert colors to CSS format
        const cssColors = colors.map(color => this.rgbToCss(color.rgb));
        
        // Add some transparency variations for more interesting gradients
        const gradientColors = cssColors.map((color, index) => {
            if (index % 2 === 0) {
                // Convert to rgba for some transparency
                const rgb = colors[index].rgb;
                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.8)`;
            }
            return color;
        });

        // Select random gradient direction
        const randomDirection = this.config.gradientDirections[
            Math.floor(Math.random() * this.config.gradientDirections.length)
        ];
        
        return randomDirection.replace("{colors}", gradientColors.join(", "));
    }

    // Apply gradient to body background
    applyGradientToBody(gradient) {
        // Only apply if gradient is provided
        if (!gradient) {
            return; // Keep existing body background
        }
        
        document.body.style.background = gradient;
        document.body.style.minHeight = "100vh";
        
        // Add a subtle overlay to ensure text readability
        const overlay = document.querySelector(".color-overlay") || document.createElement("div");
        overlay.className = "color-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            pointer-events: none;
            z-index: -1;
        `;
        
        if (!document.querySelector(".color-overlay")) {
            document.body.appendChild(overlay);
        }
    }

    // Check if image can be processed via canvas
    canProcessImage(imageElement) {
        try {
            // Try to create a small canvas test
            const testCanvas = document.createElement("canvas");
            const testCtx = testCanvas.getContext("2d");
            testCanvas.width = 1;
            testCanvas.height = 1;
            testCtx.drawImage(imageElement, 0, 0, 1, 1);
            testCtx.getImageData(0, 0, 1, 1);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Main method to process album cover and apply gradient
    async processAlbumCover(imageSelector = ".album-artwork img") {
        try {
            const imageElement = document.querySelector(imageSelector);
            
            if (!imageElement) {
                // No image found, keep existing body background
                return;
            }

            // Wait for image to load if not already loaded
            if (!imageElement.complete) {
                await new Promise((resolve) => {
                    imageElement.onload = resolve;
                    imageElement.onerror = resolve; // Continue even if image fails to load
                });
            }

            // Extract colors from the image
            const colors = await this.extractColors(imageElement);
            
            // Generate and apply gradient
            const gradient = this.generateGradient(colors);
            this.applyGradientToBody(gradient);  
        } catch (error) {
            // Keep existing body background if color extraction fails
            return;
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const colorExtractor = new ColorExtractor({
        minColorPercentage: 0.20,  // 20% minimum usage
        maxColors: 4,              // Get 4 colors
        colorSimilarityThreshold: 10, // Colors within 10 RGB units are considered similar
        canvasSize: 100            // Canvas size for analysis
    });
    
    // Process the album cover
    colorExtractor.processAlbumCover();
});

// Export for manual usage
window.ColorExtractor = ColorExtractor;
