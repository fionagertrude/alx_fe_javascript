// Define quotes array
const quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Motivation" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
];

// Function to show a random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    quoteDisplay.innerHTML = `
        <p>"${quote.text}"</p>
        <p><strong>Category: ${quote.category}</strong></p>
    `;
}

// Function to create the add quote form
function createAddQuoteForm() {
    // Create form container
    const formDiv = document.createElement('div');
    
    // Create input for quote text
    const quoteInput = document.createElement('input');
    quoteInput.type = 'text';
    quoteInput.id = 'newQuoteText';
    quoteInput.placeholder = 'Enter a new quote';
    
    // Create input for quote category
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.id = 'newQuoteCategory';
    categoryInput.placeholder = 'Enter quote category';
    
    // Create add button
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Quote';
    addButton.onclick = addQuote;
    
    // Append elements to form
    formDiv.appendChild(quoteInput);
    formDiv.appendChild(categoryInput);
    formDiv.appendChild(addButton);
    
    // Add form to page
    document.body.appendChild(formDiv);
}

// Function to add a new quote
function addQuote() {
    // Get input values
    const quoteText = document.getElementById('newQuoteText').value;
    const quoteCategory = document.getElementById('newQuoteCategory').value;
    
    // Validate inputs
    if (!quoteText.trim() || !quoteCategory.trim()) {
        alert('Please enter both a quote and a category!');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: quoteText,
        category: quoteCategory
    };
    
    // Add to quotes array (make it mutable by removing const or using let)
    quotes.push(newQuote);
    
    // Clear inputs
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    // Update display
    showRandomQuote();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // Show initial quote
    showRandomQuote();
    
    // Create the form
    createAddQuoteForm();
    
    // Add event listener to "Show New Quote" button
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
});