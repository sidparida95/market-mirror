// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path'); // Add path module

const app = express();
const PORT = 3000;

app.use(cors());

// **NEW**: Serve static files (like market-mirror.html) from the current directory
app.use(express.static(path.join(__dirname)));

// **NEW**: Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Endpoint fetches news from dynamic RSS feeds
app.get('/news', async (req, res) => {
    const region = req.query.region;
    
    const rssFeedUrl = (region === 'global')
        ? 'http://feeds.marketwatch.com/marketwatch/topstories/' // MarketWatch Top Stories
        : 'http://feeds.feedburner.com/ndtvprofit-latest';      // NDTV Profit for India
    
    const converterUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;

    try {
        console.log(`Fetching live news from: ${rssFeedUrl}`);
        const response = await fetch(converterUrl);
        if (!response.ok) throw new Error(`RSS service responded with status ${response.status}`);
        
        const newsData = await response.json();
        if (newsData.status !== 'ok') throw new Error('Failed to parse RSS feed.');
        
        console.log('OK: News fetched successfully.');
        res.json(newsData);
    } catch (error) {
        console.error(`FAIL: News - ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Market Mirror server is running.`);
    console.log(`✅ Open your browser and go to http://localhost:${PORT}`);
});