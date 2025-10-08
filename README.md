Athena: Your Personal AI Financial Strategist

🚀 Live Demo
Experience Athena live: https://athena-ai-omega.vercel.app/

🎯 The Problem
Managing personal debt is overwhelming. Traditional tools are just calculators—they provide numbers but offer no real strategy. They're impersonal, often confusing, and fail to address the user's core need: a clear, personalized guide to financial freedom. This leads to inaction, stress, and money lost to high interest rates.

✨ The Solution: Athena
Athena is not another calculator; it's a specialized AI financial strategist you can talk to. By leveraging a sophisticated instruction-tuned model, Athena understands your financial situation in plain English. It analyzes your unique context and provides a clear, actionable, and data-driven plan, turning financial anxiety into confidence.

🌟 Key Features
Conversational UI: No forms, no jargon. Describe your financial situation naturally, and Athena understands.

Intelligent Budget Analysis: List your income and expenses, and Athena provides a detailed breakdown with saving tips.

Dynamic Pie Charts: Automatically generates a pie chart within the chat to visualize your expense breakdown, making your budget easy to understand.

Expert Debt Payoff Strategy: Analyzes multiple loans and recommends the optimal payoff method (Debt Avalanche or Debt Snowball) with a step-by-step plan.

Loan Comparison & Simulation: Compares different loan offers by simulating repayment, calculating total interest, and providing a clear recommendation.

Dynamic Bar Charts: Generates bar charts to visually compare the total cost of different loans, helping users make data-driven decisions.

Refinancing & Consolidation Analysis: Explains complex financial concepts in simple terms and provides a balanced "Pros and Cons" analysis for your specific situation.

Persistent Chat History: All conversations are saved to local storage, so you can always come back to your plan.

💻 Technology Stack
Frontend: HTML5, CSS3, Vanilla JavaScript

Libraries: Chart.js for data visualization, Marked.js for Markdown rendering.

Deployment: Vercel

Backend: Node.js with Express

AI: Google Generative AI (Gemini)

Deployment: Render

🛠️ Project Setup & Local Installation
To run this project on your local machine, follow these steps:

1. Clone the Repository
git clone [https://github.com/lavyajn/athena-hackathon.git](https://github.com/lavyajn/athena-hackathon.git)
cd athena-hackathon

2. Set Up the Backend
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create a .env file in the /server directory
# and add your Google AI API Key
echo "GOOGLE_API_KEY=YOUR_API_KEY_HERE" > .env

# Start the server (runs on http://localhost:2000)
node index.js

3. Set Up the Frontend
The frontend is a static site and requires no build step.

Make sure the API_URL variable in client/app.js is pointed to http://localhost:2000/api/generate-strategy.

Open the client/index.html file in your browser. For the best experience (to avoid CORS issues), use a simple live server extension in your code editor (like Live Server for VS Code).

☁️ Deployment
The Backend is deployed as a Node.js Web Service on Render. The GOOGLE_API_KEY is set as a secret environment variable.

The Frontend is deployed as a static site on Vercel, with the root directory set to /client.

🔮 Future Enhancements
Proactive Reminders: Integrate the notification system to send alerts for upcoming EMI payments.

Investment Guidance: Add modules to provide basic investment strategies for debt-free users.

Market Integration: Connect to real-time loan offers from banks to provide live refinancing comparisons.

Built with passion for a 12-hour hackathon.
