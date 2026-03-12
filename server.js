require('dotenv').config();
const express = require('express');
const cors = require('cors');
const generateAIResponse = require('./services/aiGateway');
const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
const admin = require("firebase-admin");

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require("./ai-bias-system-firebase-adminsdk-fbsvc-9b3a42287a.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Faculty-controlled settings (still in-memory for now)
let facultySettings = {
    sessionId: "Default-Session",
    venomFrequency: 30, // Percentage probability of error (0-100)
    venomSeverity: 50,   // Percentage of error within the answer
    reward: 2,
    penalty: 5
};

// Active questions (short-lived memory only)
let activeQuestions = {};

// Root
app.get('/', (req, res) => {
    res.send('Backend is running 🚀');
});

// Get faculty settings
app.get('/faculty-settings', (req, res) => {
    res.json(facultySettings);
});

// Update faculty settings
app.post('/faculty-settings', (req, res) => {
    facultySettings = req.body;
    res.json({ message: "Settings updated", facultySettings });
});

// Generate AI answer
app.post('/generate', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        const injectError = (Math.random() * 100) < facultySettings.venomFrequency;
        const aiResponse = await generateAIResponse(question, injectError, facultySettings.venomSeverity);

        const questionId =
            Date.now().toString() + Math.random().toString(36).substring(2);

        activeQuestions[questionId] = {
            question,
            sessionId: facultySettings.sessionId,
            errorInjected: injectError,
            venomSeverity: injectError ? facultySettings.venomSeverity : 0
        };

        res.json({
  questionId,
  question,
  answer: aiResponse.answer,
  socratic: aiResponse.socratic
});

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post('/submit', async (req, res) => {
    try {
        const { studentId, questionId, initialChoice, finalChoice, socraticTime, responseTime, confidence } = req.body;

        // Validation
        if (!studentId || !questionId || !initialChoice || !finalChoice || responseTime === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!["Correct", "Wrong"].includes(finalChoice)) {
            return res.status(400).json({ error: "Invalid finalChoice" });
        }

        if (typeof responseTime !== "number" || responseTime < 0) {
            return res.status(400).json({ error: "Invalid responseTime" });
        }

        if (studentId.length > 50) {
            return res.status(400).json({ error: "Invalid studentId" });
        }

        const storedQuestion = activeQuestions[questionId];

        if (!storedQuestion) {
            return res.status(400).json({ error: "Invalid or expired questionId" });
        }

        const errorInjected = storedQuestion.errorInjected;

        const LATE_THRESHOLD = 90000;
        const isLate = responseTime > LATE_THRESHOLD;

        let scoreDelta = 0;

        // False Positive
        if (errorInjected && finalChoice === "Correct") {
            scoreDelta = -facultySettings.penalty;
        }

        // True Positive
        if (!errorInjected && finalChoice === "Correct") {
            scoreDelta = facultySettings.reward;
        }

        // True Negative
        if (errorInjected && finalChoice === "Wrong") {
            scoreDelta = facultySettings.reward;
        }

        // False Negative
        if (!errorInjected && finalChoice === "Wrong") {
            scoreDelta = -2;
        }

        // 🔥 FIRESTORE LEADERBOARD UPDATE
        const leaderboardRef = db.collection("leaderboard").doc(studentId);
        const doc = await leaderboardRef.get();

        let currentScore = 0;

        if (doc.exists) {
            currentScore = doc.data().score;
        }

        const newScore = currentScore + scoreDelta;

        await leaderboardRef.set({
            score: newScore,
            updatedAt: new Date()
        });

        // 🔥 FIRESTORE LOGGING
        await db.collection("logs").add({
            studentId,
            questionId,
            sessionId: storedQuestion.sessionId,
            errorInjected,
            venomSeverity: storedQuestion.venomSeverity,
            initialChoice,
            finalChoice,
            socraticTime: socraticTime || 0,
            confidence: confidence || 0,
            responseTime,
            isLate,
            scoreDelta,
            totalScoreAfter: newScore,
            timestamp: new Date()
        });

        delete activeQuestions[questionId];

        res.json({
            scoreDelta,
            totalScore: newScore
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Submission failed" });
    }
});

// Get leaderboard
app.get('/leaderboard', async (req, res) => {
    const snapshot = await db.collection("leaderboard").get();

    const data = {};

    snapshot.forEach(doc => {
        data[doc.id] = doc.data().score;
    });

    res.json(data);
});

// Get logs
app.get('/logs', async (req, res) => {
    const snapshot = await db.collection("logs").get();

    const logs = [];

    snapshot.forEach(doc => {
        logs.push(doc.data());
    });

    res.json(logs);
});

// Export all
app.get('/export', async (req, res) => {
    const leaderboardSnap = await db.collection("leaderboard").get();
    const logsSnap = await db.collection("logs").get();

    const leaderboard = {};
    const logs = [];

    leaderboardSnap.forEach(doc => {
        leaderboard[doc.id] = doc.data().score;
    });

    logsSnap.forEach(doc => {
        logs.push(doc.data());
    });

    res.json({ leaderboard, logs });
});

// Firebase test route
app.get("/test-firebase", async (req, res) => {
  try {
    await db.collection("test").doc("ping").set({
      message: "Firebase connected",
      timestamp: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/analytics', async (req, res) => {
    const snapshot = await db.collection("logs").get();

    let total = 0;
    let injectedErrors = 0;
    let overTrust = 0;     // AI wrong but student said Correct
    let underTrust = 0;    // AI correct but student said Wrong
    let correctDecisions = 0;
    let totalResponseTime = 0;
    let lateCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        total++;

        if (data.errorInjected) injectedErrors++;
        if (data.isLate) lateCount++;

        totalResponseTime += data.responseTime;

        if (data.errorInjected && data.studentChoice === "Correct") {
            overTrust++;
        }

        if (!data.errorInjected && data.studentChoice === "Wrong") {
            underTrust++;
        }

        if (
            (data.errorInjected && data.studentChoice === "Wrong") ||
            (!data.errorInjected && data.studentChoice === "Correct")
        ) {
            correctDecisions++;
        }
    });

    const analytics = {
        totalInteractions: total,
        errorInjectionRate: total ? injectedErrors / total : 0,
        overTrustRate: total ? overTrust / total : 0,
        underTrustRate: total ? underTrust / total : 0,
        decisionAccuracy: total ? correctDecisions / total : 0,
        averageResponseTime: total ? totalResponseTime / total : 0,
        lateRate: total ? lateCount / total : 0,
        biasIndex: total ? (overTrust - underTrust) / total : 0
    };

    res.json(analytics);
});

app.get('/analytics/student/:id', async (req, res) => {
    const studentId = req.params.id;

    const snapshot = await db.collection("logs")
        .where("studentId", "==", studentId)
        .get();

    let total = 0;
    let overTrust = 0;
    let underTrust = 0;
    let correctDecisions = 0;
    let totalResponseTime = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        totalResponseTime += data.responseTime;

        if (data.errorInjected && data.studentChoice === "Correct") {
            overTrust++;
        }

        if (!data.errorInjected && data.studentChoice === "Wrong") {
            underTrust++;
        }

        if (
            (data.errorInjected && data.studentChoice === "Wrong") ||
            (!data.errorInjected && data.studentChoice === "Correct")
        ) {
            correctDecisions++;
        }
    });

    res.json({
        studentId,
        totalInteractions: total,
        overTrustRate: total ? overTrust / total : 0,
        underTrustRate: total ? underTrust / total : 0,
        decisionAccuracy: total ? correctDecisions / total : 0,
        averageResponseTime: total ? totalResponseTime / total : 0,
        biasIndex: total ? (overTrust - underTrust) / total : 0
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});