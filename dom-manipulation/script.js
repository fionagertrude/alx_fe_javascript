// ============================================
// GLOBAL VARIABLES
// ============================================

let quotes = [];
let selectedCategory = 'all';
let syncInterval = null;

// ============================================
// TASK 1: BASIC FUNCTIONALITY
// ============================================

function showRandomQuote() {
    const filteredQuotes = getFilteredQuotes();
    
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = 
            '<p>No quotes available. Please add some quotes!</p>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p>"${randomQuote.text}"</p>
        <p><em>Category: ${randomQuote.category}</em></p>
    `;
    
    // Save to session storage
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
}

function createAddQuoteForm() {
    // Form is already in HTML
    console.log("Add quote form is ready");
}

function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    
    if (!quoteText || !quoteCategory) {
        showNotification('addQuoteNotification', 'Please enter both a quote and a category!', 'error');
        return;
    }
    
    const newQuote = {
        id: Date.now(),
        text: quoteText,
        category: quoteCategory,
        timestamp: new Date().toISOString(),
        source: 'local'
    };
    
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    showNotification('addQuoteNotification', 'Quote added successfully!', 'success');
    showRandomQuote();
    updateQuoteList();
}

// ============================================
// TASK 2: WEB STORAGE & JSON
// ============================================

function saveQuotes() {
    localStorage.setItem('quotesData', JSON.stringify(quotes));
    console.log('Saved quotes to local storage');
    updateQuoteCount();
}

function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotesData');
    
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
        console.log(`Loaded ${quotes.length} quotes from local storage`);
    } else {
        quotes = getDefaultQuotes();
        saveQuotes();
    }
    
    // Load last selected category
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        selectedCategory = savedCategory;
        document.getElementById('categoryFilter').value = selectedCategory;
    }
    
    // Load last session quote
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastQuote) {
        console.log('Last session quote:', JSON.parse(lastQuote));
    }
    
    updateQuoteCount();
}

function getDefaultQuotes() {
    return [
        { id: 1, text: "The only way to do great work is to love what you do.", category: "Motivation" },
        { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
        { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
        { id: 4, text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration" },
        { id: 5, text: "Whoever is happy will make others happy too.", category: "Happiness" }
    ];
}

function exportToJsonFile() {
    if (quotes.length === 0) {
        showNotification('importExportNotification', 'No quotes to export!', 'error');
        return;
    }
    
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = 'quotes.json';
    link.style.display = 'inline';
    link.textContent = 'quotes.json';
    link.click();
    
    showNotification('importExportNotification', 'Quotes exported successfully!', 'success');
    console.log('Exported quotes to JSON file');
}

function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuotes)) {
                throw new Error('JSON must contain an array of quotes');
            }
            
            const validQuotes = importedQuotes.filter(q => 
                q && q.text && q.category && 
                typeof q.text === 'string' && 
                typeof q.category === 'string'
            );
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in file');
            }
            
            const originalCount = quotes.length;
            quotes.push(...validQuotes);
            saveQuotes();
            populateCategories();
            
            showNotification('importExportNotification', 
                `Imported ${validQuotes.length} quotes successfully! Total: ${quotes.length}`, 
                'success');
            
            showRandomQuote();
            updateQuoteList();
            
        } catch (error) {
            showNotification('importExportNotification', `Import failed: ${error.message}`, 'error');
        }
    };
    
    reader.readAsText(file);
}

// ============================================
// TASK 2: FILTERING SYSTEM
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
    if (selectedCategory && selectedCategory !== 'all') {
        filterSelect.value = selectedCategory;
    }
}

function filterQuotes() {
    const filterSelect = document.getElementById('categoryFilter');
    selectedCategory = filterSelect.value;
    
    // Save selected category to local storage
    localStorage.setItem('selectedCategory', selectedCategory);
    
    // Show filtered quotes
    showRandomQuote();
    updateQuoteList();
    
    showNotification('filterNotification', 
        `Showing ${getFilteredQuotes().length} quotes from category: ${selectedCategory === 'all' ? 'All' : selectedCategory}`, 
        'success');
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
    showNotification('filterNotification', 'Filter cleared. Showing all quotes.', 'success');
}

function updateQuoteList() {
    const container = document.getElementById('allQuotes');
    const filteredQuotes = getFilteredQuotes();
    
    container.innerHTML = '';
    
    if (filteredQuotes.length === 0) {
        container.innerHTML = '<p>No quotes found.</p>';
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

function updateQuoteCount() {
    document.getElementById('quoteCount').textContent = quotes.length;
}

// ============================================
// TASK 3: SERVER SYNC & CONFLICT RESOLUTION
// ============================================

const MOCK_API_URL = 'https://jsonplaceholder.typicode.com/posts';

async function fetchQuotesFromServer() {
    showNotification('syncNotification', 'Fetching quotes from server...', 'info');
    
    try {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock server response
        const mockServerQuotes = [
            { id: 1001, text: "Server quote: Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.", category: "Programming", source: 'server' },
            { id: 1002, text: "Server quote: Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", category: "Programming", source: 'server' },
            { id: 1003, text: "Server quote: The best thing about a boolean is even if you are wrong, you are only off by a bit.", category: "Programming", source: 'server' }
        ];
        
        // Merge with local quotes
        const conflicts = await syncQuotesWithServerData(mockServerQuotes);
        
        if (conflicts.length > 0) {
            showConflictNotification(conflicts);
            showNotification('syncNotification', 
                `Fetched ${mockServerQuotes.length} quotes from server. ${conflicts.length} conflicts detected.`, 
                'warning');
        } else {
            showNotification('syncNotification', 
                `Successfully fetched ${mockServerQuotes.length} quotes from server.`, 
                'success');
        }
        
        populateCategories();
        updateQuoteList();
        
    } catch (error) {
        showNotification('syncNotification', `Failed to fetch from server: ${error.message}`, 'error');
    }
}

async function postDataToServer() {
    showNotification('syncNotification', 'Posting data to server...', 'info');
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful post
        const localQuotesToPost = quotes.filter(q => q.source === 'local');
        
        showNotification('syncNotification', 
            `Successfully posted ${localQuotesToPost.length} local quotes to server.`, 
            'success');
        
    } catch (error) {
        showNotification('syncNotification', `Failed to post to server: ${error.message}`, 'error');
    }
}

async function syncQuotes() {
    showNotification('syncNotification', 'Syncing with server...', 'info');
    
    try {
        // Fetch from server
        await fetchQuotesFromServer();
        
        // Post to server
        await postDataToServer();
        
        // Update UI
        showRandomQuote();
        updateQuoteList();
        
    } catch (error) {
        showNotification('syncNotification', `Sync failed: ${error.message}`, 'error');
    }
}

async function syncQuotesWithServerData(serverQuotes) {
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
                    local: localQuote,
                    server: serverQuote,
                    timestamp: new Date().toISOString()
                });
                
                // Server version wins (simple conflict resolution)
                quotes[existingIndex] = serverQuote;
            }
        }
    });
    
    saveQuotes();
    return conflicts;
}

function showConflictNotification(conflicts) {
    const notification = document.getElementById('conflictNotification');
    notification.innerHTML = `
        <strong>⚠️ Data Conflicts Detected!</strong>
        <p>${conflicts.length} conflict(s) found between local and server data.</p>
        <p>Server version was used. <button onclick="showConflictDetails()">View Details</button></p>
    `;
    notification.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 10000);
}

function showConflictDetails() {
    alert('Conflict details: Server data takes precedence over local changes.\n\n' +
          'In a real application, you would have options to:\n' +
          '1. Keep local version\n' +
          '2. Use server version\n' +
          '3. Merge both\n' +
          '4. Keep both as separate entries');
}

function startPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    if (document.getElementById('autoSync').checked) {
        syncInterval = setInterval(async () => {
            console.log('Auto-sync triggered');
            await fetchQuotesFromServer();
        }, 30000); // Every 30 seconds
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showNotification(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'notification ' + type;
    element.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Load quotes from local storage
    loadQuotes();
    
    // Show initial quote
    showRandomQuote();
    
    // Create form
    createAddQuoteForm();
    
    // Populate categories
    populateCategories();
    
    // Update quote list
    updateQuoteList();
    
    // Setup event listeners
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    
    document.getElementById('exportJson').addEventListener('click', exportToJsonFile);
    
    document.getElementById('saveSession').addEventListener('click', function() {
        const currentQuote = quotes[0]; // Just save first quote for demo
        if (currentQuote) {
            sessionStorage.setItem('savedQuote', JSON.stringify(currentQuote));
            showNotification('addQuoteNotification', 'Quote saved to session storage!', 'success');
        }
    });
    
    document.getElementById('autoSync').addEventListener('change', startPeriodicSync);
    
    // Start periodic sync
    startPeriodicSync();
    
    // Initial server sync after 2 seconds
    setTimeout(() => {
        if (document.getElementById('autoSync').checked) {
            fetchQuotesFromServer();
        }
    }, 2000);
    
    console.log('Application initialized');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);