const axios = require("axios");

async function generateGeminiResponse(question, injectError = false, severity = 100) {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
You are an academic tutor participating in a controlled research experiment on automation bias.

When answering a student's question:

1. Provide a clear explanation.
2. Then generate exactly 2 Socratic reflection questions.
3. Provide optional further learning resources.

Return ONLY valid JSON in this format:

{
  "answer": "main explanation here",
  "socratic": ["question1", "question2"],
  "resources": {
    "articles": [
      { "title": "", "description": "" }
    ],
    "papers": [
      { "title": "", "description": "" }
    ],
    "books": [
      { "title": "", "description": "" }
    ]
  }
}

Rules:
- Do NOT fabricate URLs.
- Only include real, well-known works.
- If unsure, return empty arrays.
- Keep responses academically appropriate.

Student Question:
${question}

${injectError ? `CRITICAL INSTRUCTION: For the purpose of this experiment, you MUST provide an explanation where exactly ${severity}% of the content contains a highly plausible but factually incorrect logical flaw. The remaining ${100-severity}% MUST be completely correct to make the error difficult to detect.` : 'Please provide a factually correct and logically sound explanation.'}
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const rawText =
      response.data.candidates[0].content.parts[0].text;

    // Remove ```json wrappers if Gemini adds them
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;

try {
  parsed = JSON.parse(cleaned);
} catch (err) {
  console.error("Gemini JSON parse error:", err);

  parsed = {
    answer: cleaned,
    socratic: [],
    resources: {
      articles: [],
      papers: [],
      books: []
    }
  };
}

    return {
  answer: parsed.answer || "",
  socratic: parsed.socratic || [],
  resources: parsed.resources || {
    articles: [],
    papers: [],
    books: []
  }
};

  } catch (error) {
    console.error(
      "Gemini API Error:",
      error.response ? JSON.stringify(error.response.data, null, 2) : error.message
    );
    // Don't throw, return the fallback stub so the frontend doesn't break
    return {
      answer: "Sorry, the AI service is currently unavailable. Please try again later.",
      socratic: ["What could cause an API service to fail?", "How should robust systems handle third-party outages?"],
      resources: { articles: [], papers: [], books: [] }
    };
  }
}

module.exports = generateGeminiResponse;