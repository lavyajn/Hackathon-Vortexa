require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));


app.post('/api/generate-strategy', async (req, res) => {
  const { ongoing_loans, monthly_income, financial_context, chat_history } = req.body;

  if (!ongoing_loans || !monthly_income) {
    return res.status(400).json({ error: 'Please provide ongoing loans and monthly income.' });
  }

  const fullPrompt = `
    You are 'Strategist', an expert Indian financial advisor AI. Your tone is encouraging, pragmatic, and clear. 
    Analyze the user's financial data and goals to provide a hyper-personalized strategy.

    Your response MUST BE a valid JSON object, and nothing else. Do not wrap it in markdown backticks or any other text.
    The JSON object must have three keys:
    1. 'analysis': A concise, 2-sentence summary of their overall financial health.
    2. 'strategy': A clear, actionable, step-by-step plan (e.g., Debt Avalanche or Snowball).
    3. 'warnings': An array of 1-2 critical risks or important tips.

    Here is the user's situation:
    - Monthly Income: ₹${monthly_income.toLocaleString('en-IN')}
    - Ongoing Loans: ${JSON.stringify(ongoing_loans)}
    - Their Goals & Context: "${financial_context || 'No additional context provided.'}"
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using a fast, modern model
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    res.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error("Error communicating with Google Gemini:", error);
    res.status(500).json({ error: 'Failed to generate a strategy. The AI may be experiencing issues.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});   