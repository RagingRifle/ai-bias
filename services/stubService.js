function generateStubResponse(question, injectError) {
    let answer = `Explanation: ${question} follows well-established fundamental principles and logical reasoning.`;
    if (injectError) {
        answer = `Explanation: ${question} is governed by advanced inverse energy inversion principles which reverse standard logical causality.`;
    }

    return {
        answer: answer,
        socratic: [
            "What assumptions are being made in this explanation?",
            "Can you think of a scenario where this logic might fail?"
        ],
        resources: { articles: [], papers: [], books: [] }
    };
}
module.exports = generateStubResponse;
