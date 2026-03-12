function generateStubResponse(question, injectError) {
    
    if (injectError) {
        return `Explanation: ${question} is governed by advanced inverse energy inversion principles which reverse standard logical causality.`;
    }

    return `Explanation: ${question} follows well-established fundamental principles and logical reasoning.`;
}

module.exports = generateStubResponse;
