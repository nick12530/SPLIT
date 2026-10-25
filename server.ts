import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser with 30mb limit for high-res receipt uploads
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
    });
  });

  // Receipt image parsing endpoint
  app.post('/api/parse-receipt', async (req, res) => {
    try {
      const { image, mimeType = 'image/jpeg', model = 'gemini-3.8-flash' } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Missing receipt image data' });
      }

      if (!ai) {
        // Fallback simulated parsing if API key is not yet set
        return res.json({
          restaurantName: 'Corner Bistro & Grill',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          subtotal: 58.00,
          tax: 5.22,
          tip: 10.44,
          tipPercentage: 18,
          total: 73.66,
          currency: '$',
          items: [
            { name: 'Artisan Guacamole & Chips', price: 9.50, quantity: 1, category: 'Appetizers' },
            { name: 'Grilled Salmon Bowl', price: 21.00, quantity: 1, category: 'Mains' },
            { name: 'Smash Burger Deluxe', price: 16.50, quantity: 1, category: 'Mains' },
            { name: 'Sparkling Lemonade (x2)', price: 11.00, quantity: 2, category: 'Drinks' },
          ],
          note: 'Parsed with sample fallback (Set GEMINI_API_KEY in Secrets for live vision parsing)',
        });
      }

      // Clean base64 string
      const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

      const prompt = `You are an expert receipt OCR and billing analyst. Analyze this receipt image with extreme accuracy.
Extract all purchased items (individual line items, their prices, quantities, and general category).
Also extract the restaurant name, date/time if visible, subtotal (sum of food/drinks before tax/tip), tax, tip (if already paid/printed, else 0), and total.
Ensure every price is a positive number and item names are clean and recognizable.`;

      // Try chosen model, or fallback to gemini-3.8-flash
      const primaryModel = model || 'gemini-3.8-flash';
      let response;
      try {
        response = await ai.models.generateContent({
          model: primaryModel,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                restaurantName: { type: Type.STRING },
                date: { type: Type.STRING },
                currency: { type: Type.STRING },
                subtotal: { type: Type.NUMBER },
                tax: { type: Type.NUMBER },
                tip: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER },
                      quantity: { type: Type.INTEGER },
                      category: { type: Type.STRING },
                    },
                    required: ['name', 'price'],
                  },
                },
              },
              required: ['items'],
            },
          },
        });
      } catch (err: any) {
        console.warn(`Model ${primaryModel} failed: ${err.message}. Trying gemini-3.8-flash fallback...`);
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
      }

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      // Validate & clean items
      const items = (parsed.items || []).map((item: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: item.name || `Item ${idx + 1}`,
        price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
        quantity: item.quantity || 1,
        category: item.category || 'Other',
        assignedTo: [],
      }));

      const calculatedSubtotal = items.reduce((sum: number, it: any) => sum + it.price, 0);
      const subtotal = typeof parsed.subtotal === 'number' && parsed.subtotal > 0 ? parsed.subtotal : calculatedSubtotal;
      const tax = typeof parsed.tax === 'number' && !isNaN(parsed.tax) ? parsed.tax : 0;
      const tip = typeof parsed.tip === 'number' && !isNaN(parsed.tip) ? parsed.tip : 0;
      const total = typeof parsed.total === 'number' && parsed.total > 0 ? parsed.total : subtotal + tax + tip;
      const tipPercentage = subtotal > 0 && tip > 0 ? Math.round((tip / subtotal) * 100) : 18;

      return res.json({
        restaurantName: parsed.restaurantName || 'Restaurant Receipt',
        date: parsed.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        currency: parsed.currency || '$',
        subtotal,
        tax,
        tip,
        tipPercentage,
        total,
        items,
      });
    } catch (error: any) {
      console.error('Error in /api/parse-receipt:', error);
      res.status(500).json({ error: error.message || 'Failed to parse receipt image' });
    }
  });

  // Multi-turn Natural Language bill assignment chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        currentBillState,
        modelPreference = 'gemini-3.8-flash',
      } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!ai) {
        // Fallback local rule-based processor if Gemini API key is missing
        return res.json(simulateLocalAssistant(message, currentBillState));
      }

      const systemInstruction = `You are SplitSmart, an intelligent dining bill splitter assistant.
Your job is to understand natural language commands from users splitting a restaurant bill and return:
1. Friendly explanation message
2. Machine-executable state actions to update item assignments, participants, tax, or tips.
3. 2-3 contextual next suggestions for the user.

Current Bill State:
- Restaurant: ${currentBillState.restaurantName || 'Unknown'}
- Subtotal: $${currentBillState.subtotal || 0}
- Tax: $${currentBillState.tax || 0}
- Tip: $${currentBillState.tip || 0} (${currentBillState.tipPercentage || 0}%)
- Existing Participants: ${(currentBillState.participants || []).map((p: any) => `${p.name} (id: ${p.id})`).join(', ') || 'None yet'}
- Available Items on Receipt:
${(currentBillState.items || []).map((i: any) => `  - id: "${i.id}" | "${i.name}" | $${i.price.toFixed(2)} | Currently assigned to: ${(i.assignedTo || []).join(', ') || 'nobody'}`).join('\n')}

Action Definitions:
- ASSIGN_ITEM: { type: "ASSIGN_ITEM", itemMatch: "<fuzzy name or exact item id>", personNames: ["Dhruv"], mode: "replace" | "add" | "share" }
  * "Dhruv had the nachos" -> mode: "replace", personNames: ["Dhruv"] (only person first name, e.g. ["Dhruv"], no commentary)
  * "Sarah and Sue shared the pizza" -> personNames: ["Sarah", "Sue"], mode: "replace"
  * "Also give Sue some of the nachos" -> mode: "add", personNames: ["Sue"]
  * Match itemMatch intelligently against the item names above (e.g. "nachos" matches "Loaded Beef Nachos Grande").
- UNASSIGN_ITEM: { type: "UNASSIGN_ITEM", itemMatch: "<item name or id>", personNames: ["Sarah"] }
- ADD_PERSON: { type: "ADD_PERSON", name: "David" }
- REMOVE_PERSON: { type: "REMOVE_PERSON", name: "David" }
- SET_TIP: { type: "SET_TIP", percentage: 20 } or { type: "SET_TIP", amount: 15.00 }
- SET_TAX: { type: "SET_TAX", amount: 8.50 }
- SPLIT_ALL_EVENLY: { type: "SPLIT_ALL_EVENLY" }
- CLEAR_ASSIGNMENTS: { type: "CLEAR_ASSIGNMENTS" }

Important rules:
- In 'personNames', provide only clean, distinct person first names (e.g. ["Dhruv", "Sarah"]). Do NOT include instructions or notes in personNames.
- If user asks questions like "Who owes what?", "Explain Dhruv's breakdown", explain clearly in 'message'.
- Always respond in valid JSON matching the schema.`;

      // Select model
      const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
      const targetModel = validModels.includes(modelPreference) ? modelPreference : 'gemini-3.8-flash';

      // Format previous conversation history for multi-turn
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (item.sender === 'user') {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'assistant') {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      let response;
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                message: {
                  type: Type.STRING,
                  description: 'A friendly conversational answer explaining what was updated and the impact.',
                },
                actions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        enum: [
                          'ASSIGN_ITEM',
                          'UNASSIGN_ITEM',
                          'ADD_PERSON',
                          'REMOVE_PERSON',
                          'SET_TIP',
                          'SET_TAX',
                          'SPLIT_ALL_EVENLY',
                          'CLEAR_ASSIGNMENTS',
                        ],
                      },
                      itemMatch: { type: Type.STRING },
                      personNames: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      name: { type: Type.STRING },
                      mode: { type: Type.STRING, enum: ['replace', 'add', 'share'] },
                      percentage: { type: Type.NUMBER },
                      amount: { type: Type.NUMBER },
                    },
                    required: ['type'],
                  },
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['message'],
            },
          },
        });
      } catch (err: any) {
        console.warn(`Target model ${targetModel} error: ${err.message}. Retrying with gemini-3.8-flash...`);
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
      }

      const parsedResponse = JSON.parse(response.text || '{}');
      const rawActions = Array.isArray(parsedResponse.actions) ? parsedResponse.actions : [];
      const sanitizedActions = rawActions.map((act: any) => {
        if (Array.isArray(act.personNames)) {
          act.personNames = act.personNames
            .map((n: any) => {
              if (typeof n !== 'string') return '';
              const cleaned = n.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0];
              return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase() : '';
            })
            .filter((n: string) => n.length > 1 && !['Mode', 'Replace', 'Add', 'Share', 'Them', 'Him', 'Her'].includes(n));
        }
        return act;
      });

      return res.json({
        message: parsedResponse.message || "I've processed your bill update.",
        actions: sanitizedActions,
        suggestions: parsedResponse.suggestions || [
          'Who owes what right now?',
          'Split unassigned items evenly',
          'Tip 20%',
        ],
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: error.message || 'Chat request failed' });
    }
  });

  // Client router
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Local simulation fallback for seamless offline or preview testing
function simulateLocalAssistant(message: string, currentBillState: any) {
  const lower = message.toLowerCase();
  const actions: any[] = [];
  let explanation = '';

  // Check tip
  const tipMatch = lower.match(/(?:tip|gratuity)\s*(?:of|is|to)?\s*(\d+)%/i);
  if (tipMatch) {
    const tipPct = parseInt(tipMatch[1], 10);
    actions.push({ type: 'SET_TIP', percentage: tipPct });
    explanation = `Updated tip to ${tipPct}%.`;
  }

  // Check split all
  if (lower.includes('split everything') || lower.includes('split all') || lower.includes('split evenly')) {
    actions.push({ type: 'SPLIT_ALL_EVENLY' });
    explanation = `Split all items equally among all participants.`;
  }

  // Check clear
  if (lower.includes('clear') || lower.includes('reset')) {
    actions.push({ type: 'CLEAR_ASSIGNMENTS' });
    explanation = `Cleared all item assignments.`;
  }

  // Check simple "X had the Y" or "X and Y shared Z"
  const items = currentBillState.items || [];
  for (const item of items) {
    const itemNameLower = item.name.toLowerCase();
    const words = itemNameLower.split(/\s+/).filter((w: string) => w.length > 3);
    const matchedWord = words.find((w: string) => lower.includes(w));

    if (matchedWord || lower.includes(itemNameLower)) {
      // Find person names mentioned
      const people: string[] = [];
      const parts = lower.split(/\b(?:had|got|ordered|shared|ate|drank|took)\b/);
      if (parts.length > 1) {
        const subject = parts[0].replace(/^(please|can you|hey|split|assign)/, '').trim();
        const names = subject.split(/\band\b|,/).map((n: string) => n.trim()).filter((n: string) => n.length > 1);
        names.forEach((name: string) => {
          const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
          people.push(capitalized);
          actions.push({ type: 'ADD_PERSON', name: capitalized });
        });
      }

      if (people.length > 0) {
        actions.push({
          type: 'ASSIGN_ITEM',
          itemMatch: item.name,
          personNames: people,
          mode: 'replace',
        });
        explanation = `Assigned "${item.name}" to ${people.join(' and ')}.`;
      }
      break;
    }
  }

  if (!explanation) {
    explanation = `Got it! I reviewed: "${message}". You can assign items by saying e.g. "Dhruv had the nachos" or "Sarah and Sue shared the pizza".`;
  }

  return {
    message: explanation,
    actions,
    suggestions: [
      'Dhruv had the nachos',
      'Sarah and Sue shared the pizza',
      'Tip 20%',
      'Split unassigned items evenly',
    ],
  };
}

startServer();
