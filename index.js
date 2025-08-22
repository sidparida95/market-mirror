const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- EXPANDED NEWS SOURCE CONFIGURATION ---
const newsFeeds = {
    global: [
        'http://feeds.reuters.com/reuters/businessNews',         // Reuters Business
        'https://apnews.com/rss/business.rss',                   // Associated Press Business
        'http://feeds.marketwatch.com/marketwatch/topstories/',  // MarketWatch
        'https://feeds.npr.org/1006/rss.xml'                      // NPR Business
    ],
    india: [
        'https://economictimes.indiatimes.com/rssfeedstopstories.cms', // The Economic Times
        'https://www.livemint.com/rss/news',                           // Livemint
        'https://www.business-standard.com/rss/latest.rss',            // Business Standard
        'https://www.reuters.com/tools/rss/feeds/new/India'           // Reuters India
    ]
};

app.use(cors());

// Serve the static files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint for fetching financial data
app.get('/finance-data/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { range, interval, period1, period2 } = req.query;
    
    let yahooUrl;
    if (period1 && period2) {
        yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    } else {
        yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    }

    try {
        const response = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) throw new Error(`Yahoo API responded with status ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from Yahoo Finance' });
    }
});

// **UPGRADED**: Endpoint now fetches from ALL sources, combines, and curates the best news
app.get('/news', async (req, res) => {
    const region = req.query.region || 'global';
    const feedsToTry = newsFeeds[region];
    console.log(`Fetching news for region: ${region}`);

    // Create a fetch promise for each feed URL
    const fetchPromises = feedsToTry.map(feedUrl => {
        const converterUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        return fetch(converterUrl).then(response => response.json());
    });

    try {
        const results = await Promise.allSettled(fetchPromises);
        let allArticles = [];

        // Aggregate articles from all successful fetches
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.status === 'ok') {
                console.log(`Successfully fetched from ${feedsToTry[index]}`);
                allArticles.push(...result.value.items);
            } else {
                console.error(`Failed to fetch from ${feedsToTry[index]}`);
            }
        });

        if (allArticles.length === 0) {
            throw new Error('Could not fetch news from any source.');
        }

        // Curate the "best" articles:
        // 1. Remove duplicates by checking for unique titles
        const uniqueArticles = [];
        const seenTitles = new Set();
        for (const article of allArticles) {
            if (article.title && !seenTitles.has(article.title.trim())) {
                uniqueArticles.push(article);
                seenTitles.add(article.title.trim());
            }
        }

        // 2. Sort the unique articles by publication date (newest first)
        uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
        // 3. Return the top 15
        const topArticles = uniqueArticles.slice(0, 15);

        console.log(`OK: Curated ${topArticles.length} unique articles.`);
        res.json({ status: 'ok', items: topArticles });

    } catch (error) {
        console.error(`FAIL: News fetching failed for region '${region}'.`, error);
        res.status(500).json({ error: error.message });
    }
});

// All other GET requests not handled before will return the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`✅ Market Mirror server is running on port ${PORT}.`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ ERROR: Port ${PORT} is already in use.`);
        console.error('Please stop the other application or change the PORT variable.');
    } else {
        console.error('An error occurred during server startup:', err);
    }
    process.exit(1);
});