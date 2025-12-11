// DOM = Document Object Model
// This is JavaScript's way of accessing and manipulating HTML elements

// Initialize an array of quote objects
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Motivation" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration" },
    { text: "Whoever is happy will make others happy too.", category: "Happiness" },
    { text: "You must be the change you wish to see in the world.", category: "Wisdom" },
    { text: "In the middle of difficulty lies opportunity.", category: "Opportunity" },
    { text: "The journey of a thousand miles begins with one step.", category: "Journey" }
];

// Store available categories
let categories = ["All", "Motivation", "Life", "Dreams", "Inspiration", "Happiness", "Wisdom", "Opportunity", "Journey"];

// Store the current selected category
let currentCategory = "All";

// DOM Manipulation Step 1: Get references to HTML elements
// We use document.getElementById() to "grab" elements from the HTML
const quoteDisplayElement = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const categoryButtonsContainer = document.getElementById('categoryButtons');

// DOM Manipulation Step 2: Wait for the page to fully load before running our code
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeCategories();
    showRandomQuote();
    
    // Add event listener to the "Show New Quote" button
    // This is how we make buttons interactive
    newQuoteButton.addEventListener('click', showRandomQuote);
});

// Function to initialize category buttons
function initializeCategories() {
    // Clear any existing buttons first
    categoryButtonsContainer.innerHTML = '';
    
    // DOM Manipulation: Create buttons for each category
    categories.forEach(category => {
        // Create a new button element
        const button = document.createElement('button');
        
        // Set the button text to the category name
        button.textContent = category;
        
        // Add CSS class for styling
        button.classList.add('category-btn');
        
        // Highlight the "All" button initially
        if (category === "All") {
            button.classList.add('active');
        }
        
        // Add click event to filter quotes by category
        button.addEventListener('click', function() {
            // Update current category
            currentCategory = category;
            
            // Update active button styling
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Show a random quote from the selected category
            showRandomQuote();
        });
        
        // DOM Manipulation: Add the button to the page
        categoryButtonsContainer.appendChild(button);
    });
}

// Function to display a random quote
function showRandomQuote() {
    // Filter quotes based on selected category
    let filteredQuotes;
    if (currentCategory === "All") {
        filteredQuotes = quotes;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === currentCategory);
    }
    
    // Check if there are quotes in the selected category
    if (filteredQuotes.length === 0) {
        quoteDisplayElement.innerHTML = `<p>No quotes found in the "${currentCategory}" category. Add some!</p>`;
        return;
    }
    
    // Get a random quote from the filtered array
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    // DOM Manipulation: Update the content of the quote display area
    // We're using template literals (backticks) for cleaner HTML generation
    quoteDisplayElement.innerHTML = `
        <p>"${randomQuote.text}"</p>
        <div class="quote-meta">— ${randomQuote.category}</div>
    `;
}

// Function to add a new quote (triggered by the Add Quote button)
function addQuote() {
    // DOM Manipulation: Get values from input fields
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    // Validate inputs
    if (newQuoteText.trim() === '' || newQuoteCategory.trim() === '') {
        alert('Please enter both quote text and category!');
        return;
    }
    
    // Create a new quote object
    const newQuote = {
        text: newQuoteText,
        category: newQuoteCategory
    };
    
    // Add the new quote to our array
    quotes.push(newQuote);
    
    // Check if the category is new, and add it to categories array if it is
    if (!categories.includes(newQuoteCategory)) {
        categories.push(newQuoteCategory);
        // Reinitialize category buttons to include the new category
        initializeCategories();
    }
    
    // Clear the input fields
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    // Show a success message
    alert(`Quote added to "${newQuoteCategory}" category!`);
    
    // Show the newly added quote
    currentCategory = newQuoteCategory;
    showRandomQuote();
}

// Bonus function to add a new category
function addCategory() {
    const newCategoryInput = document.getElementById('newCategory');
    const newCategoryName = newCategoryInput.value.trim();
    
    if (newCategoryName === '') {
        alert('Please enter a category name!');
        return;
    }
    
    if (categories.includes(newCategoryName)) {
        alert('Category already exists!');
        return;
    }
    
    // Add the new category
    categories.push(newCategoryName);
    
    // Clear the input
    newCategoryInput.value = '';
    
    // Update the category buttons
    initializeCategories();
    
    alert(`Category "${newCategoryName}" added!`);
}

// Additional feature: Show all quotes (for debugging/learning)
function displayAllQuotes() {
    console.log("All quotes in the array:");
    quotes.forEach((quote, index) => {
        console.log(`${index + 1}. "${quote.text}" [${quote.category}]`);
    });
}

// Call this function in the console to see all quotes
// displayAllQuotes();