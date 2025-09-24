document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selections ---
    const promptForm = document.getElementById('prompt-form');
    const promptInput = document.getElementById('prompt-input');
    const sendButton = document.getElementById('send-btn');
    const messageList = document.getElementById('message-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyContainer = document.getElementById('history-container');

    // --- State Management ---
    let messages = [];
    let chatHistory = {};
    let currentChatId = null;
    let isLoading = false;

    // --- API Configuration ---
    const API_URL = 'http://localhost:3001/api/generate-strategy'; // IMPORTANT: Replace with your deployed Render URL for production

    // --- Core Functions ---

    /**
     * Renders the current list of messages to the screen
     */
    const renderMessages = () => {
        messageList.innerHTML = ''; // Clear existing messages
        if (messages.length === 0 && !isLoading) {
             messageList.innerHTML = `
                <div class="welcome-message">
                    <h2>Hello! I'm your AI Strategist.</h2>
                    <p>How can I help you manage your debt today?</p>
                    <p class="example-prompt">
                        Try saying: "I have a ₹5,00,000 car loan at 9.5% for 5 years and a ₹50,000 credit card bill at 24%. My monthly income is ₹75,000. What should I do?"
                    </p>
                </div>`;
        } else {
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.role}`;
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';

                if (msg.role === 'assistant') {
                    contentDiv.innerHTML = marked.parse(msg.content); // Use marked to parse Markdown
                } else {
                    contentDiv.textContent = msg.content;
                }

                messageDiv.appendChild(contentDiv);
                messageList.appendChild(messageDiv);
            });
        }
        
        if (isLoading) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message assistant';
            loadingDiv.innerHTML = `<div class="message-content loading-dots"><span>.</span><span>.</span><span>.</span></div>`;
            messageList.appendChild(loadingDiv);
        }
        
        messageList.scrollTop = messageList.scrollHeight; // Auto-scroll to bottom
    };

    /**
     * Renders the chat history in the sidebar
     */
    const renderHistory = () => {
        historyContainer.innerHTML = '';
        Object.keys(chatHistory).forEach(chatId => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = chatHistory[chatId].title;
            historyItem.dataset.chatId = chatId;
            if (chatId === currentChatId) {
                historyItem.classList.add('active');
            }
            historyContainer.appendChild(historyItem);
        });
    };

    /**
     * Loads chat history from local storage
     */
    const loadHistoryFromStorage = () => {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
        }
        renderHistory();
    };

    /**
     * Saves the current chat history to local storage
     */
    const saveHistoryToStorage = () => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    };
    
    /**
     * Handles the form submission to send a prompt to the AI
     * @param {Event} e The form submission event
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        if (!prompt || isLoading) return;

        isLoading = true;
        sendButton.disabled = true;

        const userMessage = { role: 'user', content: prompt };
        messages.push(userMessage);
        renderMessages();
        promptInput.value = '';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const { response: aiMarkdown, title } = await response.json();
            const assistantMessage = { role: 'assistant', content: aiMarkdown };
            messages.push(assistantMessage);

            // Save conversation to history
            const idToSave = currentChatId || crypto.randomUUID();
            if (!currentChatId) {
                currentChatId = idToSave;
            }
            
            chatHistory[idToSave] = {
                title: chatHistory[idToSave]?.title || title,
                messages: [...messages]
            };

            saveHistoryToStorage();
            renderHistory();

        } catch (error) {
            console.error('Error fetching AI response:', error);
            messages.push({ role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' });
        } finally {
            isLoading = false;
            sendButton.disabled = false;
            renderMessages();
        }
    };
    
    /**
     * Starts a new, empty chat session
     */
    const handleNewChat = () => {
        currentChatId = null;
        messages = [];
        isLoading = false;
        renderMessages();
        renderHistory(); // To remove the 'active' class from the old chat
    };

    /**
     * Loads a previous chat from the history
     * @param {Event} e The click event on the history container
     */
    const handleHistoryClick = (e) => {
        const historyItem = e.target.closest('.history-item');
        if (historyItem) {
            const chatId = historyItem.dataset.chatId;
            if (chatId !== currentChatId) {
                currentChatId = chatId;
                messages = [...chatHistory[chatId].messages];
                renderMessages();
                renderHistory();
            }
        }
    };
    

    // --- Event Listeners ---
    promptForm.addEventListener('submit', handleFormSubmit);
    newChatBtn.addEventListener('click', handleNewChat);
    historyContainer.addEventListener('click', handleHistoryClick);

    // --- Initial Application Load ---
    loadHistoryFromStorage();
    renderMessages();
});