const { GoogleGenerativeAI } = require('@google/generative-ai');
require('colors');

let geminiClient = null;
let geminiModel  = null;

/**
 * Initialise the Gemini 2.5 Flash client and verify the connection.
 * Call this once at server startup (after dotenv is loaded).
 */
async function connectGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing from .env'.red.bold);
    return;
  }

  try {
    geminiClient = new GoogleGenerativeAI(apiKey);

    // Grab the model — this is the object you call generateContent() on
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Quick smoke-test: ask for a one-word reply so we know the key works
    const result = await geminiModel.generateContent('Reply with the single word: connected');
    const text   = result.response.text().trim().toLowerCase();

    if (text.includes('connected')) {
      console.log('🤖 Gemini 2.5 Flash → Connected successfully!'.green.bold);
    } else {
      // API responded but with unexpected text — still treat as connected
      console.log(`🤖 Gemini 2.5 Flash → Connected (response: "${text}")`.green);
    }
  } catch (err) {
    console.error(`❌ Gemini connection failed: ${err.message}`.red.bold);
    // Don't crash the server — AI features will simply be unavailable
    geminiClient = null;
    geminiModel  = null;
  }
}

/**
 * Returns the shared GoogleGenerativeAI instance.
 * Use this when you need to call getGenerativeModel() with custom settings.
 */
function getGeminiClient() {
  if (!geminiClient) {
    throw new Error('Gemini client is not initialised. Check your GEMINI_API_KEY.');
  }
  return geminiClient;
}

/**
 * Returns the default gemini-2.5-flash model instance.
 * Use this for quick generateContent() calls anywhere in the app.
 *
 * @example
 *   const model  = getGeminiModel();
 *   const result = await model.generateContent('Summarise this article: ...');
 *   const text   = result.response.text();
 */
function getGeminiModel() {
  if (!geminiModel) {
    throw new Error('Gemini model is not initialised. Check your GEMINI_API_KEY.');
  }
  return geminiModel;
}

module.exports = { connectGemini, getGeminiClient, getGeminiModel };
