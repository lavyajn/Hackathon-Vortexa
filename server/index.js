require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client','public')));

app.post('/api/generate-strategy', async (req, res) => {
  const { prompt, chatHistory } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const systemPrompt = `
    You are an expert financial advisor named 'Strategist'. Your goal is to have a natural conversation with the user about their debts.
    1.  Analyze the user's prompt to extract key financial data (debts, amounts, interest rates, income).
    2.  If the user's prompt is missing critical information (e.g., they mention a loan but no interest rate), YOUR FIRST RESPONSE must be to ask for that information in a friendly way. Do not provide a strategy until you have the key details.
    3.  Once you have enough information, provide a clear, actionable strategy.
    4.  **FORMAT YOUR ENTIRE RESPONSE IN MARKDOWN.** Use headings (##), bold text (**text**), and bulleted lists (-) to make the plan easy to read.
    5.  Your final output to the user should be a single markdown string.
    6.  Along with the response, generate a short, descriptive title for this conversation (max 5 words).
    
    Your entire output to the system MUST be a valid JSON object with two keys: "response" (the markdown string for the user) and "title" (the generated chat title).
    Example Output: { "response": "## Your Financial Analysis\\nBased on your numbers...", "title": "Car Loan & Card Debt" }
  `;
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const aiContent = completion.choices[0].message.content;
    if (aiContent) {
      res.json(JSON.parse(aiContent));
    } else {
      throw new Error("Empty response from AI.");
    }

  } catch (error) {
    console.error("Error with OpenAI:", error);
    res.status(500).json({ error: 'Failed to get a response from the strategist.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});   