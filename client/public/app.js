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
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const API_URL = 'http://localhost:3000/api/generate-strategy';

    // --- Core Functions ---

    // Function to handle panel switching
    const switchPanel = (panelId) => {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const activePanel = document.getElementById(panelId);
        if (activePanel) {
            activePanel.classList.add('active');
        } else {
            document.getElementById('chat-panel').classList.add('active');
        }
    };

    // Chat History Loading
    const loadChatHistory = () => {
        if (chatHistory.length > 0) {
            initialGreeting.style.display = 'none';
            chatHistory.forEach(message => {
                displayMessage(message.role, message.content);
            });
            renderHistoryList();
        }
    };
    
    // Renders chat history in the sidebar
    const renderHistoryList = () => {
        const userPrompts = chatHistory.filter(item => item.role === 'user');
        if (userPrompts.length === 0) {
            historyEmptyState.style.display = 'block';
            historyList.innerHTML = '';
            return;
        }
        historyEmptyState.style.display = 'none';
        historyList.innerHTML = '';
        userPrompts.forEach((session) => {
            const historyItem = document.createElement('li');
            historyItem.classList.add('history-item');
            historyItem.textContent = session.content.title || session.content.substring(0, 30) + '...';
            historyList.appendChild(historyItem);
        });
    };
    
    // Chat History Saving
    const saveChatHistory = () => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        renderHistoryList();
    };

    // --- NEW DYNAMIC CHART RENDERING FUNCTION ---
    const renderChartInBubble = (canvasId, chartData) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        new Chart(ctx, {
            type: chartData.type, // 'pie' or 'bar'
            data: {
                labels: chartData.data.map(item => item.label),
                datasets: [{
                    label: chartData.title,
                    data: chartData.data.map(item => item.value),
                    backgroundColor: ['#4A90E2', '#28a745', '#FFC107', '#DC3545', '#6c757d', '#17a2b8'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: chartData.type === 'pie' ? 'top' : 'display',
                    },
                    title: {
                        display: true,
                        text: chartData.title
                    }
                }
            }
        });
    };

    // --- NEW SMART DISPLAY MESSAGE FUNCTION ---
    const displayMessage = (role, aiDataObject) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-bubble', role);

        if (role === 'ai') {
            // Render the text part of the response
            const textContent = document.createElement('div');
            textContent.innerHTML = marked.parse(aiDataObject.response);
            messageElement.appendChild(textContent);

            // Check if there is chart data and render it
            if (aiDataObject.chart) {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-in-bubble';
                const canvasId = `chart-${Date.now()}`; // Unique ID for each canvas
                chartContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;
                messageElement.appendChild(chartContainer);

                // IMPORTANT: We must wait a tiny moment for the DOM to update
                // before trying to render the chart.
                setTimeout(() => {
                    renderChartInBubble(canvasId, aiDataObject.chart);
                }, 0);
            }
        } else {
            // For user messages, the content is just a string
            messageElement.textContent = aiDataObject;
        }
        
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        if (initialGreeting.style.display !== 'none') {
            initialGreeting.style.display = 'none';
        }
    };

    // --- EVENT LISTENERS ---
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = e.currentTarget.dataset.panel;
            switchPanel(panelId);
            document.querySelector('.nav-item.active')?.classList.remove('active');
            e.currentTarget.parentElement.classList.add('active');
        });
    });

    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userPrompt = userInput.value.trim();
        if (!userPrompt) return;
        
        displayMessage('user', userPrompt);
        userInput.value = '';
        loadingDots.classList.remove('hidden');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const aiData = await response.json();

            if (aiData.response) {
                // Pass the ENTIRE aiData object to the display function
                displayMessage('ai', aiData); 
                
                chatHistory.push({ role: 'user', content: userPrompt });
                chatHistory.push({ role: 'ai', content: aiData }); // Save the whole object
                saveChatHistory();
            } else {
                throw new Error("AI response format is incorrect.");
            }

        } catch (error) {
            console.error("CRITICAL ERROR in fetch/display process:", error);
            displayMessage('ai', { response: 'Sorry, an error occurred. Please check the console (F12).' });
        } finally {
            loadingDots.classList.add('hidden');
        }
    });

    // --- Notification System ---
    const renderReminders = () => {
        notificationCount.textContent = reminders.length;
        notificationCount.classList.toggle('hidden', reminders.length === 0);
        notificationsEmptyState.style.display = reminders.length === 0 ? 'block' : 'none';
        activeRemindersList.innerHTML = '';
        reminders.forEach(reminder => {
            const item = document.createElement('li');
            item.className = 'reminder-item';
            item.textContent = `${reminder.message} (Due: ${new Date(reminder.date).toLocaleDateString()})`;
            activeRemindersList.appendChild(item);
        });
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

