const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// All other GET requests not handled before will return the React app
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