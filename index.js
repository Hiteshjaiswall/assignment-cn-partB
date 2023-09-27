const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');

// Connect to your MongoDB database
mongoose.connect('mongodb://0.0.0.0/booksDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Create a Mongoose schema for the books
const bookSchema = new mongoose.Schema({
    title: String,
    price: String,
    availability: String,
    rating: String,
});

// Create a Mongoose model for the books
const Book = mongoose.model('Book', bookSchema);

async function scrapePage(pageNumber) {
    const url = `http://books.toscrape.com/catalogue/page-${pageNumber}.html`;

    try {
        const response = await axios.get(url);
        if (response.status !== 200) {
            console.error(`Failed to fetch page ${url}. Status code: ${response.status}`);
            return;
        }

        const $ = cheerio.load(response.data);

        // Extract book attributes
        $('.product_pod').each(async (index, element) => {
            const title = $(element).find('h3 a').attr('title');
            const price = $(element).find('.price_color').text();
            const availability = $(element).find('.availability').text().trim();
            const rating = $(element).find('p.star-rating').attr('class').split(' ')[1];

            // Create a new book document and save it to MongoDB
            try {
                const book = new Book({
                    title,
                    price,
                    availability,
                    rating,
                });

                await book.save();
                console.log('Saved book to MongoDB:', title);
            } catch (err) {
                console.error('Error saving book to MongoDB:', err);
            }
        });
    } catch (error) {
        console.error('Error scraping page:', error);
    }
}

// Main function to scrape all pages
async function scrapeAllPages() {
    const totalPages = 50; // Assuming there are 50 pages

    for (let page = 1; page <= totalPages; page++) {
        await scrapePage(page);
    }

    mongoose.disconnect(); // Close the MongoDB connection when done
}

// Start scraping
scrapeAllPages();
