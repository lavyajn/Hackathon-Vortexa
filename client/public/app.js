document.addEventListener('DOMContentLoaded', () => {
     // --- DOM Elements ---
     const sidebar = document.querySelector('.sidebar');
     const sidebarToggle = document.getElementById('sidebar-toggle');
     const navLinks = document.querySelectorAll('.nav-item a');
     const panelContainer = document.querySelector('.panel-container');
     const chatPanel = document.getElementById('chat-panel');
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
     let chatHistory = [];
     let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
     const API_URL = 'http://localhost:3001/api/generate-strategy';
 
     // --- Core Functions ---
 
     // Function to handle panel switching
     const switchPanel = (panelId) => {
         document.querySelectorAll('.panel').forEach(panel => {
             panel.classList.remove('active');
         });
         document.getElementById(panelId).classList.add('active');
     };
 
     // Function to handle chat history loading and saving
     const loadChatHistory = () => {
         const storedHistory = localStorage.getItem('chatHistory');
         if (storedHistory) {
             chatHistory = JSON.parse(storedHistory);
             chatHistory.forEach(session => {
                 const isUser = session.role === 'user';
                 displayMessage(session.role, session.content, false);
             });
         }
         if (chatHistory.length > 0) {
             initialGreeting.style.display = 'none';
         }
     };
     
     const saveChatHistory = () => {
         localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
         renderHistoryList();
     };
 
     const addHistorySession = (userPrompt, aiResponse) => {
         const session = {
             id: Date.now(),
             userPrompt,
             aiResponse,
             date: new Date().toISOString()
         };
         chatHistory.push(session);
         saveChatHistory();
     };
 
     const renderHistoryList = () => {
         if (chatHistory.length === 0) {
             historyEmptyState.style.display = 'block';
             historyList.innerHTML = '';
             return;
         }
         historyEmptyState.style.display = 'none';
         historyList.innerHTML = '';
         chatHistory.forEach(session => {
             const historyItem = document.createElement('li');
             historyItem.classList.add('history-item');
             historyItem.textContent = session.userPrompt.substring(0, 50) + '...';
             // Add a click listener to load this history session
             historyItem.addEventListener('click', () => {
                 // Future functionality: load this specific chat session
                 console.log('Loading chat session:', session.id);
             });
             historyList.appendChild(historyItem);
         });
     };
 
     // Function to display a message in the chat window
     const displayMessage = (role, content) => {
         const messageElement = document.createElement('div');
         messageElement.classList.add('chat-bubble', role);
         // Clean up the text for display, handling JSON and newlines
         const cleanedContent = typeof content === 'object' ? 
             JSON.stringify(content, null, 2) : 
             content.replace(/\n/g, '<br>');
         messageElement.innerHTML = cleanedContent;
         chatWindow.appendChild(messageElement);
         chatWindow.scrollTop = chatWindow.scrollHeight;
 
         if (initialGreeting.style.display !== 'none') {
             initialGreeting.style.display = 'none';
         }
     };
 
     // Function to parse the user's prompt
     const parseUserPrompt = (prompt) => {
         const data = {
             ongoing_loans: [],
             financial_context: '',
             assets: [],
             liabilities: [],
             monthly_income: 0,
             desired_interest_tenure: 0,
             // Example of a simple parser for structured data
         };
 
         const lines = prompt.split('\n');
         let currentSection = 'context';
 
         for (const line of lines) {
             if (line.startsWith('Loans:')) {
                 currentSection = 'loans';
             } else if (line.startsWith('Assets:')) {
                 currentSection = 'assets';
             } else if (line.startsWith('Income:')) {
                 currentSection = 'income';
             } else if (line.startsWith('Tenure:')) {
                 currentSection = 'tenure';
             } else {
                 switch (currentSection) {
                     case 'loans':
                         try {
                             const [name, principal, interest] = line.split(',').map(s => s.trim());
                             if (name && principal && interest) {
                                 data.ongoing_loans.push({ name, principal: parseFloat(principal), interestRate: parseFloat(interest) });
                             }
                         } catch (e) {}
                         break;
                     case 'assets':
                         try {
                             const [name, value] = line.split(',').map(s => s.trim());
                             if (name && value) {
                                 data.assets.push({ name, value: parseFloat(value) });
                             }
                         } catch (e) {}
                         break;
                     case 'income':
                         data.monthly_income = parseFloat(line.trim());
                         break;
                     case 'tenure':
                         data.desired_interest_tenure = parseFloat(line.trim());
                         break;
                     default:
                         data.financial_context += line + '\n';
                 }
             }
         }
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
             document.querySelector('.nav-item.active').classList.remove('active');
             e.currentTarget.parentElement.classList.add('active');
         });
     });
 
     // Chat form submission
     chatInputForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         const userPrompt = userInput.value.trim();
         if (!userPrompt) return;
         
         displayMessage('user', userPrompt);
         userInput.value = '';
         loadingDots.classList.remove('hidden');
 
         const userData = parseUserPrompt(userPrompt);
 
         // This is where you call your backend API
         try {
             const response = await axios.post(API_URL, {
                 ...userData,
                 chat_history: chatHistory.map(h => ({ role: h.role, content: h.userPrompt || h.aiResponse }))
             });
 
             const aiResponse = response.data;
             const fullResponse = `**Analysis:**\n${aiResponse.analysis}\n\n**Strategy:**\n${aiResponse.strategy}\n\n**Warnings:**\n- ${aiResponse.warnings.join('\n- ')}`;
 
             displayMessage('ai', fullResponse);
             addHistorySession(userPrompt, fullResponse);
 
         } catch (error) {
             console.error('API Error:', error);
             displayMessage('ai', 'I am currently unable to provide a response. Please try again later.');
         } finally {
             loadingDots.classList.add('hidden');
         }
     });
 
     // Notification system
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
 
         reminders.push({ date, message });
         localStorage.setItem('reminders', JSON.stringify(reminders));
         renderReminders();
         notificationForm.reset();
     });
 
     notificationBell.addEventListener('click', () => {
         switchPanel('notification-settings-panel');
         document.querySelector('.nav-item.active')?.classList.remove('active');
     });
 
     // Initial load
     loadChatHistory();
     renderReminders();
 });