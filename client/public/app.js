document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navLinks = document.querySelectorAll('.nav-item a');
    const chatInputForm = document.getElementById('chat-input-form');
    const userInput = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const initialGreeting = document.getElementById('initial-greeting');
    const loadingDots = document.querySelector('.loading-dots');
    const notificationBell = document.getElementById('notification-bell');
    const notificationCount = document.getElementById('notification-count');
    const historyList = document.getElementById('history-list');
    const historyEmptyState = document.getElementById('history-empty-state');
    const activeRemindersList = document.getElementById('active-reminders-list');
    const notificationsEmptyState = document.getElementById('notifications-empty-state');
    const notificationForm = document.getElementById('notification-form');

    // --- State Variables ---
    // CORRECTED: Chat history is now a simple array of message objects.
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const API_URL = 'http://localhost:3001/api/generate-strategy';

    // --- Core Functions ---

    // Function to handle panel switching
    const switchPanel = (panelId) => {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const activePanel = document.getElementById(panelId);
        if(activePanel) {
            activePanel.classList.add('active');
        } else {
            // Fallback to chat panel if ID is invalid
            document.getElementById('chat-panel').classList.add('active');
        }
    };

    // CORRECTED: Simplified chat history loading
    const loadChatHistory = () => {
        if (chatHistory.length > 0) {
            initialGreeting.style.display = 'none';
            chatHistory.forEach(message => {
                displayMessage(message.role, message.content);
            });
            renderHistoryList();
        }
    };

    // CORRECTED: Simplified saving
    const saveChatHistory = () => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        renderHistoryList();
    };

    // CORRECTED: Renders a list based on the user's first prompt in a session
    const renderHistoryList = () => {
        const userPrompts = chatHistory.filter(item => item.role === 'user');

        if (userPrompts.length === 0) {
            historyEmptyState.style.display = 'block';
            historyList.innerHTML = '';
            return;
        }

        historyEmptyState.style.display = 'none';
        historyList.innerHTML = '';
        userPrompts.forEach((session, index) => {
            const historyItem = document.createElement('li');
            historyItem.classList.add('history-item');
            historyItem.textContent = session.content.substring(0, 30) + '...';
            // Note: Loading a specific session would require more complex logic
            // to split history into distinct conversations.
            historyList.appendChild(historyItem);
        });
    };
    
    // Function to display a message in the chat window
    const displayMessage = (role, content) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-bubble', role);
        // Using a proper Markdown parser would be better, but this handles newlines
        const cleanedContent = content.replace(/\n/g, '<br>');
        messageElement.innerHTML = cleanedContent;
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll

        if (initialGreeting.style.display !== 'none') {
            initialGreeting.style.display = 'none';
        }
    };
    
    // We'll keep the parser as is, but a more robust NLP approach on the backend is better long-term.
    const parseUserPrompt = (prompt) => {
        const data = {
             ongoing_loans: [], financial_context: '', assets: [], liabilities: [],
             monthly_income: 0, desired_interest_tenure: 0
        };
        // This parser is very basic; the main logic relies on the AI backend.
        data.financial_context = prompt; // Send the whole prompt for the AI to parse
        return data;
    };

    // --- Event Listeners ---

    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Panel navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = e.currentTarget.dataset.panel;
            switchPanel(panelId);
            document.querySelector('.nav-item.active')?.classList.remove('active');
            e.currentTarget.parentElement.classList.add('active');
        });
    });

    // *** MAJOR CORRECTION: Chat form submission using fetch() ***
    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userPrompt = userInput.value.trim();
        if (!userPrompt) return;
        
        displayMessage('user', userPrompt);
        chatHistory.push({ role: 'user', content: userPrompt }); // Add user message to history
        userInput.value = '';
        loadingDots.classList.remove('hidden'); // Show loading dots

        const userData = parseUserPrompt(userPrompt);

        try {
            // REPLACED axios with fetch
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...userData,
                    // Send a simplified history for context
                    chat_history: chatHistory.slice(-4) 
                })
            });

            if (!response.ok) {
                // Handle HTTP errors like 404 or 500
                throw new Error(`API Error: ${response.statusText}`);
            }

            const aiResponseData = await response.json();
            
            // Format the response for display
            const fullResponse = `**Analysis:**\n${aiResponseData.analysis}\n\n**Strategy:**\n${aiResponseData.strategy}\n\n**Warnings:**\n- ${aiResponseData.warnings.join('\n- ')}`;

            displayMessage('ai', fullResponse);
            chatHistory.push({ role: 'ai', content: fullResponse }); // Add AI response to history
            saveChatHistory(); // Save the full conversation

        } catch (error) {
            console.error('API Error:', error);
            displayMessage('ai', 'I am currently unable to provide a response. Please try again later.');
        } finally {
            // THIS IS KEY: The finally block always runs, hiding the dots
            loadingDots.classList.add('hidden');
        }
    });

    // --- Notification System (No changes needed here) ---
    const renderReminders = () => {
        if (reminders.length === 0) {
            notificationsEmptyState.style.display = 'block';
            activeRemindersList.innerHTML = '';
            notificationCount.classList.add('hidden');
        } else {
            notificationsEmptyState.style.display = 'none';
            activeRemindersList.innerHTML = '';
            reminders.forEach(reminder => {
                const reminderItem = document.createElement('li');
                reminderItem.classList.add('reminder-item');
                reminderItem.textContent = `${reminder.message} (Due: ${new Date(reminder.date).toLocaleDateString()})`;
                activeRemindersList.appendChild(reminderItem);
            });
            notificationCount.classList.remove('hidden');
            notificationCount.textContent = reminders.length;
        }
    };

    notificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('reminder-date').value;
        const message = document.getElementById('reminder-message').value;
        if (!date || !message) return;

        reminders.push({ date, message });
        localStorage.setItem('reminders', JSON.stringify(reminders));
        renderReminders();
        notificationForm.reset();
    });

    notificationBell.addEventListener('click', () => {
        switchPanel('notification-settings-panel');
        document.querySelector('.nav-item.active')?.classList.remove('active');
    });

    // --- Initial Load ---
    loadChatHistory();
    renderReminders();
});