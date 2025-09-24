require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/api/generate-strategy', async (req, res) => {
  const { ongoing_loans, monthly_income, financial_context, chat_history } = req.body;

  // Basic validation to ensure we have the minimum required data
  if (!ongoing_loans || !monthly_income) {
    return res.status(400).json({ error: 'Please provide ongoing loans and monthly income.' });
  }

  const systemPrompt = `
    You are 'Strategist', an expert Indian financial advisor AI. Your tone is encouraging, pragmatic, and clear. 
    You will receive a user's financial data and their goals. Your analysis must be hyper-personalized to their situation.
    Your response MUST BE a valid JSON object, and nothing else.
    The JSON object must have three keys:
    1. 'analysis': A concise, 2-sentence summary of their overall financial health, considering their income, debts, and stated goals.
    2. 'strategy': A clear, actionable, step-by-step plan. This could be a debt payoff strategy (like Avalanche or Snowball), advice on their new loan, or a suggestion to consolidate. Be specific.
    3. 'warnings': An array of 1-2 critical risks or important tips. For example, "Your debt-to-income ratio is high," or "Avoid taking on new credit card debt while paying off this loan."
  `;

  try {

    // =================== START OF MOCK IMPLEMENTATION ===================

    console.log("⚠️ OpenAI API call is disabled. Returning mock data. ⚠️");

    // This is a high-quality fake response that looks real.
    const mockResponse = {
      analysis: "Your current debt-to-income ratio is manageable, but the high interest on your credit card is significantly impacting your long-term savings goals.",
      strategy: "We strongly recommend the 'Debt Avalanche' method. Continue paying the minimum on your Personal Loan, and aggressively pay down the 38% APY Credit Card with any extra funds. Once cleared, roll that payment into the Personal Loan.",
      warnings: [
        "Avoid adding any new expenses to your credit card until the balance is zero.",
        "Consider building a small emergency fund of ₹15,000-₹20,000 before aggressively paying debt."
      ]
    };

    // We add a small delay to make it feel like the AI is "thinking".
    setTimeout(() => {
      res.json(mockResponse);
    }, 1500); // 1.5 second delay

    // ===================  END OF MOCK IMPLEMENTATION  ===================
    
    /* // We build a message history for the AI, starting with our system prompt.
    // We then add the previous chat history that the frontend sent us.
    const messages = [
      { role: "system", content: systemPrompt },
      ...chat_history, // Spread the existing chat history here
      {
        role: "user",
        // The final user message contains all the latest structured and unstructured data.
        content: `
          Here is my latest financial situation:
          - Monthly Income: ₹${monthly_income.toLocaleString('en-IN')}
          - Ongoing Loans: ${JSON.stringify(ongoing_loans)}
          - My Goals & Context: "${financial_context || 'No additional context provided.'}"

          Please provide my personalized financial strategy.
        `,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const strategyJson = completion.choices[0].message.content;
    if (strategyJson) {
      res.json(JSON.parse(strategyJson));
    } else {
        throw new Error("Empty response from AI.");
    } */

  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    res.status(500).json({ error: 'Failed to generate a strategy. The AI may be experiencing issues.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})