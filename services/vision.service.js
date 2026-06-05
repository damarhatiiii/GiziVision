/**
 * Vision Service
 * Handles food recognition from images.
 * Supports multi-food detection — identifies ALL food items visible in an image.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Recognizes food from an image.
 * @param {string} base64Image - Base64 representation of the image.
 * @param {string} fileName - Original filename of the uploaded image.
 * @param {string} userApiKey - Optional user-provided Gemini API key.
 * @param {string} customName - Optional custom name provided by the user.
 * @returns {Promise<{isFood: boolean, items: Array<{name: string, confidence: number, nutrition?: any}>}>}
 */
export async function analyzeImage(base64Image, fileName = '', userApiKey = '', customName = '') {
  const apiKey = process.env.GEMINI_API_KEY || userApiKey;

  if (!apiKey) {
    return analyzeImageMock(base64Image, fileName, customName);
  }

  return analyzeImageWithGemini(base64Image, apiKey, customName);
}

/**
 * Analyze image using real Gemini Vision API — detects ALL food items
 */
export async function analyzeImageWithGemini(base64Image, apiKey, customName = '') {
  let base64Data = base64Image;
  let mimeType = 'image/jpeg';

  if (base64Image.startsWith('data:')) {
    const parts = base64Image.split(',');
    base64Data = parts[1] || base64Image;
    const match = parts[0].match(/data:(.*?);base64/);
    if (match) {
      mimeType = match[1];
    }
  }

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const customNameHint = customName 
    ? `The user suggests the food includes: "${customName}". Use this to help identify or specify the exact food items if it is accurate.`
    : '';

  const prompt = `
    Analyze this image and identify ALL Indonesian food and drink items visible.
    
    You must return a JSON object with the following structure:
    {
      "isFood": true or false. It must be true ONLY if the image displays at least one food item, meal, snack, or drink. If it displays a person, face, general object, or environment that is NOT food/drink, set this to false.
      "items": [
        {
          "name": "Standardized Indonesian Food Name" (e.g. "Nasi Goreng", "Telur Ceplok", "Kerupuk", etc. Use capital letters for each word.),
          "confidence": number between 0.0 and 1.0 representing your confidence in identifying this specific food item,
          "nutrition": {
            "calories": number (estimated energy value in kkal per 100g),
            "proteins": number (estimated proteins in grams per 100g),
            "fat": number (estimated fat in grams per 100g),
            "carbohydrate": number (estimated carbohydrates in grams per 100g)
          }
        }
      ]
    }
    
    Guidelines:
    - Return ONLY valid JSON matching the schema above.
    - If isFood is false, return an empty "items" array.
    - Identify EVERY distinct food/drink item visible in the image (e.g. rice, side dishes, condiments, drinks).
    - Each item should be a separate entry in the "items" array.
    - ${customNameHint}
    - Keep nutrition estimations as realistic as possible for Indonesian culinary styles.
    - Use common Indonesian food names (e.g. "Nasi Putih" instead of "White Rice", "Telur Dadar" instead of "Omelette").
  `;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Normalize response
    if (parsed.isFood === false || !parsed.items || parsed.items.length === 0) {
      return { isFood: parsed.isFood ?? false, items: [] };
    }

    const items = parsed.items.map(item => ({
      name: item.name || 'Makanan Tidak Dikenal',
      confidence: item.confidence || 0.85,
      nutrition: item.nutrition || { calories: 0, proteins: 0, fat: 0, carbohydrate: 0 }
    }));

    return { isFood: true, items };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    const msg = error.message || '';
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID') || msg.includes('invalid API key')) {
      throw new Error('API_KEY_INVALID: API Key Gemini tidak valid atau tidak diatur dengan benar.');
    } else if (msg.includes('fetch failed') || msg.includes('timeout') || msg.includes('timed out') || msg.includes('undici') || msg.includes('network') || msg.includes('ENOTFOUND')) {
      throw new Error('AI_NO_RESPONSE: AI tidak merespon (kemungkinan masalah koneksi internet atau batas limit API).');
    } else if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('quota') || msg.includes('Quota Failure')) {
      throw new Error('AI_QUOTA_EXCEEDED: Layanan AI sedang mencapai batas penggunaan. Silakan coba lagi beberapa saat.');
    } else {
      throw new Error(`AI_GENERIC_ERROR: Gagal memproses gambar menggunakan Gemini AI. Detail: ${msg}`);
    }
  }
}

/**
 * Fallback Mock analysis — returns multi-item format
 */
export async function analyzeImageMock(base64Image, fileName = '', customName = '') {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const popularItems = [
    'Bakso', 'Nasi goreng', 'Sate ayam', 'Rendang',
    'Gado-gado', 'Pempek', 'Soto ayam', 'Tahu goreng',
    'Tempe murni goreng', 'Abon', 'Mie Goreng'
  ];

  let detectedItems = [];
  const searchSource = (customName || fileName || '').toLowerCase();

  if (searchSource) {
    // Detect multiple items from comma/space separated custom names
    const nameHints = customName ? customName.split(/[,;+&]/).map(s => s.trim()).filter(Boolean) : [];
    
    if (nameHints.length > 1) {
      // User provided multiple food names
      detectedItems = nameHints.map(hint => ({
        name: hint,
        confidence: Math.round((0.88 + Math.random() * 0.11) * 100) / 100,
        nutrition: null
      }));
    } else {
      // Single detection from filename/custom name
      let detectedFoodName = '';
      if (searchSource.includes('bakso')) detectedFoodName = 'Bakso';
      else if (searchSource.includes('nasi') && searchSource.includes('goreng')) detectedFoodName = 'Nasi goreng';
      else if ((searchSource.includes('mie') && searchSource.includes('goreng')) || (searchSource.includes('mi') && searchSource.includes('goreng'))) detectedFoodName = 'Mie Goreng';
      else if (searchSource.includes('mie') || searchSource.includes('mi')) detectedFoodName = 'Mie Goreng';
      else if (searchSource.includes('sate')) detectedFoodName = 'Sate ayam';
      else if (searchSource.includes('rendang')) detectedFoodName = 'Rendang';
      else if (searchSource.includes('gado')) detectedFoodName = 'Gado-gado';
      else if (searchSource.includes('pempek')) detectedFoodName = 'Pempek';
      else if (searchSource.includes('soto')) detectedFoodName = 'Soto ayam';
      else if (searchSource.includes('tahu')) detectedFoodName = 'Tahu goreng';
      else if (searchSource.includes('tempe')) detectedFoodName = 'Tempe murni goreng';
      else if (searchSource.includes('abon')) detectedFoodName = 'Abon';
      else if (customName) detectedFoodName = customName;

      if (detectedFoodName) {
        detectedItems = [{
          name: detectedFoodName,
          confidence: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
          nutrition: null
        }];
      }
    }
  }

  // Fallback to random popular item
  if (detectedItems.length === 0) {
    const randomIndex = Math.floor(Math.random() * popularItems.length);
    detectedItems = [{
      name: popularItems[randomIndex],
      confidence: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
      nutrition: null
    }];
  }

  return {
    isFood: true,
    items: detectedItems
  };
}
