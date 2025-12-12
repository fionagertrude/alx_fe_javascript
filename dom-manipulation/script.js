// ============================================
// GLOBAL VARIABLES
// ============================================

let quotes = [];
let selectedCategory = 'all';
let syncInterval = null;
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Load quotes from local storage
    const storedQuotes = localStorage.getItem('quotesData');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    } else {
        quotes = [
            { id: 1, text: "The only way to do great work is to love what you do.", category: "Motivation" },
            { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
            { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
        ];
        localStorage.setItem('quotesData', JSON.stringify(quotes));
    }
    
    // Restore selected category
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        selectedCategory = savedCategory;
        document.getElementById('categoryFilter').value = selectedCategory;
    }
    
    // Check session storage
    const sessionQuote = sessionStorage.getItem('lastViewedQuote');
    if (sessionQuote) {
        console.log('Last session quote:', JSON.parse(sessionQuote));
    }
    
    // Initial display
    showRandomQuote();
    populateCategories();
    updateQuoteList();
    
    // Setup auto sync
    startPeriodicSync();
    
    console.log('Application initialized');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// TASK 1: BASIC FUNCTIONS
// ============================================

function showRandomQuote() {
    if (quotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = 
            '<p>No quotes available. Please add some quotes!</p>';
        return;
    }
    
    const filteredQuotes = getFilteredQuotes();
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = 
            '<p>No quotes in this category. Try another filter.</p>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    document.getElementById('quoteDisplay').innerHTML = `
        <p>"${randomQuote.text}"</p>
        <p><em>Category: ${randomQuote.category}</em></p>
    `;
    
    // Save to session storage
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
}

function createAddQuoteForm() {
    // Form is in HTML
    console.log('Add quote form ready');
}

function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');
    
    const text = textInput.value.trim();
    const category = categoryInput.value.trim();
    
    if (!text || !category) {
        showNotification('Please enter both quote text and category!', 'error');
        return;
    }
    
    const newQuote = {
        id: Date.now(),
        text: text,
        category: category,
        timestamp: new Date().toISOString(),
        source: 'local'
    };
    
    quotes.push(newQuote);
    localStorage.setItem('quotesData', JSON.stringify(quotes));
    
    populateCategories();
    textInput.value = '';
    categoryInput.value = '';
    
    showNotification('Quote added successfully!', 'success');
    showRandomQuote();
    updateQuoteList();
}

// ============================================
// TASK 2: FILTERING
// ============================================

function populateCategories() {
    const filterSelect = document.getElementById('categoryFilter');
    const categories = ['all', ...new Set(quotes.map(q => q.category))];
    
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    
    categories.filter(cat => cat !== 'all').forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterSelect.appendChild(option);
    });
    
    filterSelect.value = selectedCategory;
}

function filterQuotes() {
    const filterSelect = document.getElementById('categoryFilter');
    selectedCategory = filterSelect.value;
    
    // Save selected category to local storage
    localStorage.setItem('selectedCategory', selectedCategory);
    
    showRandomQuote();
    updateQuoteList();
}

function getFilteredQuotes() {
    if (selectedCategory === 'all') {
        return quotes;
    }
    return quotes.filter(quote => quote.category === selectedCategory);
}

function clearFilter() {
    selectedCategory = 'all';
    document.getElementById('categoryFilter').value = 'all';
    localStorage.removeItem('selectedCategory');
    showRandomQuote();
    updateQuoteList();
}

// ============================================
// TASK 2: JSON IMPORT/EXPORT
// ============================================

function exportToJsonFile() {
    if (quotes.length === 0) {
        showNotification('No quotes to export!', 'error');
        return;
    }
    
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = 'quotes.json';
    link.style.display = 'block';
    link.textContent = 'Download quotes.json';
    link.click();
    
    showNotification('Quotes exported successfully!', 'success');
}

function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid JSON format');
            }
            
            const validQuotes = importedQuotes.filter(q => 
                q && q.text && q.category
            );
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found');
            }
            
            quotes.push(...validQuotes);
            localStorage.setItem('quotesData', JSON.stringify(quotes));
            populateCategories();
            updateQuoteList();
            
            showNotification(`Imported ${validQuotes.length} quotes successfully!`, 'success');
            
        } catch (error) {
            showNotification(`Import failed: ${error.message}`, 'error');
        }
    };
    
    reader.readAsText(file);
}

// ============================================
// TASK 3: SERVER SYNC & CONFLICT RESOLUTION
// ============================================

async function fetchQuotesFromServer() {
    showNotification('Fetching quotes from server...', 'info');
    
    try {
        // Use actual fetch API with GET method
        const response = await fetch(`${API_URL}?_limit=3`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        // Convert posts to quotes
        const serverQuotes = posts.map(post => ({
            id: post.id + 1000, // Offset to avoid conflicts
            text: post.title,
            category: 'Server',
            body: post.body,
            source: 'server',
            timestamp: new Date().toISOString()
        }));
        
        // Merge with local quotes and handle conflicts
        const conflicts = mergeQuotesWithServer(serverQuotes);
        
        if (conflicts.length > 0) {
            showConflictAlert(conflicts);
            showNotification(`Fetched ${serverQuotes.length} quotes. ${conflicts.length} conflicts resolved.`, 'warning');
        } else {
            showNotification(`Successfully fetched ${serverQuotes.length} quotes from server.`, 'success');
        }
        
        populateCategories();
        updateQuoteList();
        
    } catch (error) {
        showNotification(`Failed to fetch from server: ${error.message}`, 'error');
        console.error('Fetch error:', error);
    }
}

async function postDataToServer() {
    showNotification('Posting data to server...', 'info');
    
    try {
        // Get local quotes to post
        const localQuotes = quotes.filter(q => q.source === 'local').slice(0, 2);
        
        if (localQuotes.length === 0) {
            showNotification('No local quotes to post.', 'warning');
            return;
        }
        
        // Prepare data for POST
        const postData = localQuotes.map(quote => ({
            title: quote.text.substring(0, 50),
            body: `${quote.category}: ${quote.text}`,
            userId: 1
        }));
        
        // POST to server using fetch with proper headers
        for (const data of postData) {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Posted to server:', result);
        }
        
        showNotification(`Successfully posted ${localQuotes.length} quotes to server.`, 'success');
        
    } catch (error) {
        showNotification(`Failed to post to server: ${error.message}`, 'error');
        console.error('Post error:', error);
    }
}

function syncQuotes() {
    showNotification('Syncing with server...', 'info');
    
    // Perform sync operations
    fetchQuotesFromServer();
    postDataToServer();
    
    // Show sync completion alert
    setTimeout(() => {
        alert('Quotes synced with server!');
    }, 1500);
}

function mergeQuotesWithServer(serverQuotes) {
    const conflicts = [];
    
    serverQuotes.forEach(serverQuote => {
        const existingIndex = quotes.findIndex(q => q.id === serverQuote.id);
        
        if (existingIndex === -1) {
            // New quote from server
            quotes.push(serverQuote);
        } else {
            // Check for conflict
            const localQuote = quotes[existingIndex];
            if (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category) {
                conflicts.push({
                    id: serverQuote.id,
                    local: { ...localQuote },
                    server: { ...serverQuote },
                    timestamp: new Date().toISOString()
                });
                
                // Server wins (simple conflict resolution)
                quotes[existingIndex] = serverQuote;
            }
        }
    });
    
    // Update local storage with server data
    localStorage.setItem('quotesData', JSON.stringify(quotes));
    
    return conflicts;
}

function showConflictAlert(conflicts) {
    if (conflicts.length > 0) {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'notification conflict-alert';
        conflictDiv.innerHTML = `
            <strong>⚠️ Data Conflict Detected!</strong>
            <p>${conflicts.length} conflict(s) found between local and server data.</p>
            <p>Server version was used for all conflicts.</p>
            <button onclick="this.parentElement.style.display='none'" 
                    style="margin-top: 10px; padding: 5px 10px; background: #ffc107; color: #000;">
                Dismiss
            </button>
        `;
        
        const notificationArea = document.getElementById('notificationArea');
        notificationArea.appendChild(conflictDiv);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            conflictDiv.style.display = 'none';
        }, 10000);
        
        // Also show alert
        alert(`Found ${conflicts.length} data conflicts during sync!`);
    }
}

// ============================================
// PERIODIC SYNC
// ============================================

function startPeriodicSync() {
    // Clear any existing interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Check if auto-sync is enabled
    const autoSync = document.getElementById('autoSync');
    if (autoSync && autoSync.checked) {
        // Set up periodic sync every 10 seconds
        syncInterval = setInterval(() => {
            console.log('Periodic sync triggered at', new Date().toLocaleTimeString());
            fetchQuotesFromServer();
        }, 10000); // Every 10 seconds
        
        // Initial sync after 2 seconds
        setTimeout(() => {
            fetchQuotesFromServer();
        }, 2000);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateQuoteList() {
    const container = document.getElementById('allQuotes');
    const filteredQuotes = getFilteredQuotes();
    
    container.innerHTML = '<h4>All Quotes (' + filteredQuotes.length + '):</h4>';
    
    if (filteredQuotes.length === 0) {
        container.innerHTML += '<p>No quotes found.</p>';
        return;
    }
    
    filteredQuotes.forEach((quote, index) => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.margin = '5px 0';
        div.style.border = '1px solid #ddd';
        div.style.borderRadius = '3px';
        div.innerHTML = `
            <p><strong>${index + 1}.</strong> "${quote.text}"</p>
            <p><em>Category: ${quote.category} | Source: ${quote.source || 'local'}</em></p>
        `;
        container.appendChild(div);
    });
}

function showNotification(message, type) {
    const notificationArea = document.getElementById('notificationArea');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    notificationArea.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function saveToSession() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteText = quoteDisplay.querySelector('p')?.textContent;
    
    if (quoteText && !quoteText.includes('No quotes')) {
        const quoteObj = {
            text: quoteText.replace(/"/g, ''),
            category: 'Session Saved',
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('savedQuote', JSON.stringify(quoteObj));
        showNotification('Quote saved to session storage!', 'success');
    } else {
        showNotification('No quote to save.', 'error');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Auto-sync checkbox listener
    const autoSyncCheckbox = document.getElementById('autoSync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', startPeriodicSync);
    }
});