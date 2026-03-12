const generateGeminiResponse = require("./geminiService");
const generateStubResponse = require("./stubService");

async function generateAIResponse(question, injectError, severity) {
  const provider = process.env.MODEL_PROVIDER || "stub";

  if (provider === "gemini") {
    return generateGeminiResponse(question, injectError, severity);
  }

  return generateStubResponse(question, injectError, severity);
}

module.exports = generateAIResponse;