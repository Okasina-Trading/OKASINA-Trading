export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageUrl, albumName, filename } = req.body;
    const { OLLAMA_API_URL } = process.env;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Missing imageUrl' });
    }

    try {
        // Extract hints from filename and album
        const hints = extractHints(filename, albumName);

        // Use Ollama to generate product details
        const ollamaUrl = OLLAMA_API_URL || 'http://localhost:11434';

        const prompt = `You are a fashion e-commerce expert. Based on this information, generate product details:

Filename: ${filename || 'unknown'}
Album: ${albumName || 'general'}
Hints: ${hints.join(', ')}

Generate a JSON response with:
- name: Short, catchy product name (max 50 chars)
- description: Detailed product description (2-3 sentences)
- category: Either "Clothing" or "Accessories"
- suggestedPrice: Price in USD (number only)
- tags: Array of 3-5 relevant tags

Respond ONLY with valid JSON, no markdown.`;

        const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5:7b',
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 300
                }
            })
        });

        if (!ollamaRes.ok) {
            throw new Error(`Ollama error: ${ollamaRes.status}`);
        }

        const ollamaData = await ollamaRes.json();
        let productData;

        try {
            // Try to parse JSON from Ollama response
            const responseText = ollamaData.response.trim();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                productData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // Fallback to rule-based generation
            productData = generateFallbackProduct(hints, albumName);
        }

        // Ensure all required fields
        const result = {
            name: productData.name || generateProductName(hints),
            description: productData.description || generateDescription(hints, albumName),
            category: productData.category || categorizeProduct(hints),
            suggestedPrice: productData.suggestedPrice || estimatePrice(hints),
            tags: productData.tags || hints.slice(0, 5),
            imageUrl: imageUrl
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error('AI analysis error:', error);

        // Always return a fallback product
        const hints = extractHints(filename, albumName);
        return res.status(200).json(generateFallbackProduct(hints, albumName, imageUrl));
    }
}

// Helper functions
function extractHints(filename = '', albumName = '') {
    const hints = [];
    const text = `${filename} ${albumName}`.toLowerCase();

    // Fashion keywords
    const keywords = {
        clothing: ['dress', 'shirt', 'pants', 'skirt', 'jacket', 'coat', 'top', 'blouse', 'jeans', 'sweater'],
        accessories: ['bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry', 'necklace', 'bracelet', 'earring'],
        colors: ['red', 'blue', 'black', 'white', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray'],
        styles: ['casual', 'formal', 'elegant', 'vintage', 'modern', 'classic', 'trendy', 'chic']
    };

    Object.values(keywords).flat().forEach(keyword => {
        if (text.includes(keyword)) {
            hints.push(keyword);
        }
    });

    return hints.length > 0 ? hints : ['fashion', 'stylish', 'quality'];
}

function categorizeProduct(hints) {
    const clothingKeywords = ['dress', 'shirt', 'pants', 'skirt', 'jacket', 'top', 'blouse', 'jeans', 'sweater'];
    const isClothing = hints.some(h => clothingKeywords.includes(h.toLowerCase()));
    return isClothing ? 'Clothing' : 'Accessories';
}

function generateProductName(hints) {
    const adjectives = ['Elegant', 'Stylish', 'Classic', 'Modern', 'Chic', 'Trendy'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const item = hints[0] || 'Fashion Item';
    return `${adj} ${item.charAt(0).toUpperCase() + item.slice(1)}`;
}

function generateDescription(hints, albumName) {
    const category = categorizeProduct(hints);
    const style = hints.join(', ') || 'stylish';
    return `Beautiful ${category.toLowerCase()} piece featuring ${style} design. Perfect for any occasion. High-quality materials and excellent craftsmanship. ${albumName ? `From our ${albumName} collection.` : ''}`.trim();
}

function estimatePrice(hints) {
    const category = categorizeProduct(hints);
    // Base prices
    const base = category === 'Clothing' ? 45 : 25;
    // Add variation
    return base + Math.floor(Math.random() * 30);
}

function generateFallbackProduct(hints, albumName, imageUrl) {
    return {
        name: generateProductName(hints),
        description: generateDescription(hints, albumName),
        category: categorizeProduct(hints),
        suggestedPrice: estimatePrice(hints),
        tags: hints.slice(0, 5),
        imageUrl: imageUrl || ''
    };
}
