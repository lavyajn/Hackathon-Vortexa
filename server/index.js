require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 2001;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client','public'))); // Assumes client folder has your html/css

app.post('/api/generate-strategy', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }
    
    // REVISED AND MORE FORCEFUL INSTRUCTION SET
    const fullPrompt = `
        **System Instructions:**
        You are Athena, an expert financial strategist AI.
        **Your primary directive is to EXTRACT all financial data (income, debts, expenses) directly from the user's prompt. Do NOT ask for information if it has already been provided.**
        
        Your response MUST BE a valid JSON object. It must contain "response" (a markdown string) and "title" (a short chat title) keys.

        **Chart Generation Rules (MANDATORY WHEN DATA IS AVAILABLE):**
        - If the user's prompt contains data sufficient for a chart (e.g., a list of expenses or multiple loans), you **MUST** include a "chart" key in your JSON response.
        - The "chart" key must be an object with "type", "title", and "data" keys.
        - "data" must be an array of objects, each with a "label" and a "value" key.
        - **Use 'pie' chart type** for breakdowns of a whole (like a budget). The "value" key is the expense amount.
        - **Use 'bar' chart type** for comparing distinct items (like loans). The "value" key is the total interest paid.

        **Your Capabilities & Response Protocols:**

        1.  **For Multiple Loan Payoff Strategy:** Analyze provided loans and recommend "Debt Avalanche" or "Debt Snowball" with a step-by-step plan.
        2.  **For Loan Comparison (Repayment Simulation):** Create a markdown table comparing EMI, Total Interest Paid, and Total Repayment. You **MUST** generate a 'bar' chart visualizing the "Total Interest Paid".
        3.  **For Expense/Budget Breakdowns:** Analyze the user's list of expenses and provide saving tips. You **MUST** generate a 'pie' chart visualizing the expense breakdown.
        4.  **For Refinancing & Consolidation Analysis:** Explain the concept and create "## Pros" and "## Cons" lists, followed by a recommendation.
        5.  **General Analysis:** If, after careful analysis, critical information is TRULY missing, you may ask for it. But always act on the data you have first.
        
        **User's Situation:**
        ${prompt}
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json\n|```/g, '').trim();

        if (cleanedText) {
            res.json(JSON.parse(cleanedText));
        } else {
            throw new Error("Empty response from AI.");
        }
    } catch (error)
    {
        console.error("Error with Google Generative AI:", error);
        res.status(500).json({ error: 'Failed to get a response from the strategist.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

