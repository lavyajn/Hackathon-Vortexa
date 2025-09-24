/* require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize the Google Generative AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the client's public directory (if you have one)
// Note: In your previous code, this was pointing to a 'public' folder. 
// Adjust the path if your structure is different.
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

app.post('/api/generate-strategy', async (req, res) => {
    // De-structure the prompt from the request body
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    // REPLACE the old fullPrompt in server/index.js with this
// In server/index.js
const fullPrompt = `
        **System Instructions:**
        You are Athena, an expert financial strategist AI. Your goal is to provide institutional-grade financial advice in a clear, accessible way.
        Your response MUST BE a valid JSON object with two keys: "response" (a markdown string for the user) and "title" (a short, descriptive chat title, max 5 words).
        Optionally, you can include a third key "chart" if the user's query can be visualized.

        **Chart Generation Rules:**
        - The "chart" key must be an object with "type", "title", and "data" keys.
        - The "data" key must be an array of objects, each with a "label" and a "value" key.
        - **Use chart type 'pie'** for breakdowns of a whole (like a budget or expense report). The "value" key should represent the amount.
        - **Use chart type 'bar'** for comparing distinct items (like different loans). The "value" key should represent the total interest paid.
        - Example pie chart output: "chart": {"type": "pie", "title": "Expense Breakdown", "data": [{"label": "Rent", "value": 25000}, {"label": "Food", "value": 15000}]}
        - Example bar chart output: "chart": {"type": "bar", "title": "Loan Interest Comparison", "data": [{"label": "Loan A", "value": 50000}, {"label": "Loan B", "value": 75000}]}

        **Your Capabilities & Response Protocols:**

        1.  **For Multiple Loan Payoff Strategy:**
            -   Analyze all provided loans (principal, interest rate).
            -   Recommend EITHER the "Debt Avalanche" (highest interest first, mathematically optimal) or "Debt Snowball" (smallest balance first, psychologically motivating) method.
            -   Explain WHY you chose it for the user's specific situation.
            -   Provide a clear, step-by-step payoff plan in a numbered list.

        2.  **For Loan Comparison (Repayment Simulation):**
            -   To compare loans, you must simulate the repayment for each to calculate the key metrics.
            -   Create a markdown table that MUST include columns for: Loan Name, EMI, Total Interest Paid, and Total Repayment Amount.
            -   Conclude with a clear "## Recommendation" section explaining which loan is better and why.
            -   Generate a 'bar' chart visualizing the "Total Interest Paid" for each loan.

        3.  **For Expense/Budget Breakdowns:**
            -   Analyze the user's list of expenses.
            -   Provide insights and potential saving tips in the "response".
            -   Generate a 'pie' chart visualizing the expense breakdown.

        4.  **For Refinancing & Consolidation Analysis:**
            -   Explain the concept of refinancing or consolidation in simple terms based on the user's query.
            -   Create two markdown lists: "## Pros" and "## Cons".
            -   Provide a clear "## Recommendation" on whether it's a good idea for their specific debts, explaining the potential savings or risks.

        5.  **General Analysis:**
            -   Always be encouraging but direct and data-driven.
            -   If critical information is missing for any task (like an interest rate), you MUST ask for it before providing a strategy.
        
        **User's Situation:**
        ${prompt}
    `;
    try {
        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast and capable model
        
        // Generate content based on the full prompt
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the model's response to ensure it's valid JSON
        // This removes markdown code fences (```json ... ```) that the model might add
        const cleanedText = text.replace(/```json\n|```/g, '').trim();

        if (cleanedText) {
            // Send the parsed JSON object back to the client
            res.json(JSON.parse(cleanedText));
        } else {
            throw new Error("Empty response from AI.");
        }

    } catch (error) {
        console.error("Error with Google Generative AI:", error);
        res.status(500).json({ error: 'Failed to get a response from the strategist.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); */


require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

