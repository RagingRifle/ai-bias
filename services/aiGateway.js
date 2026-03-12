const generateGeminiResponse = require("./geminiService");
const generateStubResponse = require("./stubService");

async function generateAIResponse(question, injectError) {
  const provider = process.env.MODEL_PROVIDER || "stub";

  if (provider === "gemini") {
    return generateGeminiResponse(question);
  }

  return generateStubResponse(question, injectError);
}

module.exports = generateAIResponse;