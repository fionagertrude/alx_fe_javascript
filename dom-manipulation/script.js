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
    loadQuotesFromStorage();
    showRandomQuote();
    populateCategories();
    updateQuoteList();
    setupEventListeners();
    startPeriodicSync();
    
    console.log('Application initialized');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// TASK 1: BASIC FUNCTIONS
// ============================================

function showRandomQuote() {
    const filteredQuotes = getFilteredQuotes();
    
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = 
            '<p>No quotes available. Add some quotes first!</p>';
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
    // Form is in HTML, function exists for requirement
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
    saveQuotesToStorage();
    populateCategories();
    
    textInput.value = '';
    categoryInput.value = '';
    
    showNotification('Quote added successfully!', 'success');
    showRandomQuote();
}

// ============================================
// TASK 2: WEB STORAGE
// ============================================

function saveQuotesToStorage() {
    localStorage.setItem('quotesData', JSON.stringify(quotes));
    console.log('Saved quotes to local storage');
}

function loadQuotesFromStorage() {
    const storedQuotes = localStorage.getItem('quotesData');
    
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
        console.log(`Loaded ${quotes.length} quotes from local storage`);
    } else {
        quotes = getDefaultQuotes();
        saveQuotesToStorage();
    }
    
    // Load selected category
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        selectedCategory = savedCategory;
        document.getElementById('categoryFilter').value = selectedCategory;
    }
    
    // Check session storage
    const sessionQuote = sessionStorage.getItem('lastViewedQuote');
    if (sessionQuote) {
        console.log('Session quote:', JSON.parse(sessionQuote));
    }
}

function getDefaultQuotes() {
    return [
        { id: 1, text: "The only way to do great work is to love what you do.", category: "Motivation" },
        { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
        { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
    ];
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
                throw new Error('Invalid JSON format. Expected an array.');
            }
            
            const validQuotes = importedQuotes.filter(q => 
                q && q.text && q.category && 
                typeof q.text === 'string' && 
                typeof q.category === 'string'
            );
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in file.');
            }
            
            quotes.push(...validQuotes);
            saveQuotesToStorage();
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
    
    // Restore selected category
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
// TASK 3: SERVER SYNC
// ============================================

async function fetchQuotesFromServer() {
    showNotification('Fetching quotes from server...', 'info');
    
    try {
        const response = await fetch(API_URL + '?_limit=3');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        // Convert posts to quotes
        const serverQuotes = posts.map(post => ({
            id: post.id + 1000, // Offset to avoid conflicts with local IDs
            text: post.title,
            category: 'Server',
            body: post.body,
            source: 'server',
            timestamp: new Date().toISOString()
        }));
        
        // Merge with local quotes
        const conflicts = mergeServerQuotes(serverQuotes);
        
        if (conflicts.length > 0) {
            showNotification(`Fetched ${serverQuotes.length} quotes. ${conflicts.length} conflicts resolved.`, 'warning');
            showConflictAlert(conflicts);
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
        const localQuotes = quotes.filter(q => q.source === 'local').slice(0, 3);
        
        if (localQuotes.length === 0) {
            showNotification('No local quotes to post.', 'warning');
            return;
        }
        
        // Convert to format for API
        const postsToSend = localQuotes.map(quote => ({
            title: quote.text.substring(0, 50),
            body: `${quote.category}: ${quote.text}`,
            userId: 1
        }));
        
        // Send each quote
        for (const post of postsToSend) {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(post)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await response.json();
        }
        
        showNotification(`Successfully posted ${localQuotes.length} quotes to server.`, 'success');
        
    } catch (error) {
        showNotification(`Failed to post to server: ${error.message}`, 'error');
        console.error('Post error:', error);
    }
}

function syncQuotes() {
    showNotification('Syncing with server...', 'info');
    
    // Perform sync
    fetchQuotesFromServer();
    postDataToServer();
}

function mergeServerQuotes(serverQuotes) {
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
                    resolved: false
                });
                
                // Server wins (simple conflict resolution)
                quotes[existingIndex] = serverQuote;
            }
        }
    });
    
    // Save merged quotes
    saveQuotesToStorage();
    
    return conflicts;
}

function showConflictAlert(conflicts) {
    if (conflicts.length > 0) {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'notification warning';
        conflictDiv.innerHTML = `
            <strong>⚠️ Data Conflicts Detected!</strong>
            <p>${conflicts.length} conflict(s) found between local and server data.</p>
            <p>Server version was used for all conflicts.</p>
            <button onclick="this.parentElement.style.display='none'">Dismiss</button>
        `;
        
        const notificationDiv = document.getElementById('notification');
        notificationDiv.innerHTML = '';
        notificationDiv.appendChild(conflictDiv);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            conflictDiv.style.display = 'none';
        }, 10000);
    }
}

// ============================================
// PERIODIC SYNC
// ============================================

function startPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    const autoSync = document.getElementById('autoSync');
    if (autoSync.checked) {
        syncInterval = setInterval(() => {
            console.log('Auto-sync triggered');
            fetchQuotesFromServer();
        }, 10000); // Every 10 seconds
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateQuoteList() {
    const container = document.getElementById('allQuotes');
    const filteredQuotes = getFilteredQuotes();
    
    container.innerHTML = '<h4>Quote List:</h4>';
    
    if (filteredQuotes.length === 0) {
        container.innerHTML += '<p>No quotes found.</p>';
        return;
    }
    
    filteredQuotes.forEach((quote, index) => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid #eee';
        div.innerHTML = `
            <p><strong>${index + 1}.</strong> "${quote.text}"</p>
            <p><em>Category: ${quote.category} | Source: ${quote.source || 'local'}</em></p>
        `;
        container.appendChild(div);
    });
}

function showNotification(message, type) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.innerHTML = `
        <div class="notification ${type}">
            ${message}
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notificationDiv.innerHTML = '';
    }, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Show New Quote button
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    
    // Export button
    document.getElementById('exportJson').addEventListener('click', exportToJsonFile);
    
    // Import file
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);
    
    // Save to session
    document.getElementById('saveSession').addEventListener('click', function() {
        const currentText = document.getElementById('quoteDisplay').querySelector('p').textContent;
        if (currentText && !currentText.includes('No quotes')) {
            sessionStorage.setItem('savedQuote', JSON.stringify({
                text: currentText.replace(/"/g, ''),
                category: 'Session Saved',
                timestamp: new Date().toISOString()
            }));
            showNotification('Quote saved to session storage!', 'success');
        }
    });
    
    // Auto-sync checkbox
    document.getElementById('autoSync').addEventListener('change', startPeriodicSync);
}