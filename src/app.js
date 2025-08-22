import {
    Chart,
    LineController,
    ScatterController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';
  
  Chart.register(
    LineController,
    ScatterController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler
  );
  
  const marketDataConfig = {
      benchmarks: {
          'S&P 500': { name: 'S&P 500 Index', region: 'Global', yahooSymbol: '^GSPC' },
          'Nasdaq': { name: 'Nasdaq Composite', region: 'Global', yahooSymbol: '^IXIC' },
          'Russell 2000': { name: 'Russell 2000 Index', region: 'Global', yahooSymbol: '^RUT' },
          'Nifty 50': { name: 'Nifty 50', region: 'India', yahooSymbol: '^NSEI' },
          'Sensex': { name: 'BSE Sensex', region: 'India', yahooSymbol: '^BSESN' },
      },
      volatility: {
          'VIX': { name: 'CBOE Volatility Index', region: 'Global', yahooSymbol: '^VIX' },
          'India VIX': { name: 'India VIX', region: 'India', yahooSymbol: '^INDIAVIX' },
      },
      commodities: {
          'Gold': { name: 'Gold Spot', region: 'Global', yahooSymbol: 'GC=F' },
          'Crude Oil': { name: 'WTI Crude Oil', region: 'Global', yahooSymbol: 'CL=F' },
      },
      currencies: {
          'DXY': { name: 'US Dollar Index', region: 'Global', yahooSymbol: 'DX-Y.NYB' },
          'USD/INR': { name: 'USD/INR Rate', region: 'India', yahooSymbol: 'USDINR=X' },
      },
      bonds: {
          'US 10Y Yield': { name: '10-Year Treasury Yield', region: 'Global', yahooSymbol: '^TNX' },
          'High-Yield Bonds': { name: 'HYG ETF', region: 'Global', yahooSymbol: 'HYG' },
      },
      specialized: {
          'Emerging Markets': { name: 'MSCI Emerging Markets ETF', region: 'Global', yahooSymbol: 'EEM' },
          'Bank Nifty': { name: 'Nifty Bank Index', region: 'India', yahooSymbol: '^NSEBANK' },
      }
  };
  
  const signalsConfig = [
      // =================================================================
      // Category: Volatility & Fear Signals (12 Signals)
      // =================================================================
      { name: 'Extreme Fear (Panic)', type: 'critical', region: 'Global',
      desc: 'The VIX is above 35, signaling panic or capitulation in the market. This reflects extreme uncertainty and a potential for erratic price swings.',
      action: 'High-risk environment. Traders may consider closing risky positions or buying protection (puts). Extreme levels can sometimes precede sharp bounces (capitulation bottom).',
      check: d => d.volatility?.VIX?.price > 35 
      },
      { name: 'High Fear', type: 'critical', region: 'Global',
      desc: 'The VIX is above 25, signaling significant market fear. This is a risk-off environment where investors are actively hedging.',
      action: 'Reduce long exposure, consider short positions, or buy put options for portfolio protection. Volatility-based assets may perform well.',
      check: d => d.volatility?.VIX?.price > 25 && d.volatility?.VIX?.price <= 35 
      },
      { name: 'Elevated Fear', type: 'warning', region: 'Global',
      desc: 'The VIX is above 20, indicating higher-than-average market stress. Caution is warranted as volatility is rising.',
      action: 'Tighten stop-losses on existing long positions. Avoid adding new high-risk positions until conditions stabilize.',
      check: d => d.volatility?.VIX?.price > 20 && d.volatility?.VIX?.price <= 25 
      },
      { name: 'Market Complacency', type: 'warning', region: 'Global',
      desc: 'The VIX is below 12, indicating very low fear and high investor confidence. While positive, extreme complacency can make markets vulnerable to negative shocks.',
      action: 'While the trend may be up, consider taking partial profits on long positions. Look for signs of a potential reversal.',
      check: d => d.volatility?.VIX?.price < 12 
      },
      { name: 'Indian Volatility Spike', type: 'critical', region: 'India',
      desc: d => `India VIX has surged by ${d.volatility?.['India VIX']?.changePercent?.toFixed(1)}%, indicating a sharp increase in expected volatility for the Indian market, often ahead of a major event or due to market stress.`,
      action: 'Traders may become cautious on Indian equities, reduce leverage, or hedge with Nifty put options.',
      check: d => d.volatility?.['India VIX']?.changePercent > 15 
      },
      { name: 'Indian Market Calm', type: 'info', region: 'India',
      desc: 'The India VIX is below 12, suggesting a stable and low-volatility environment conducive for steady gains in the Indian market.',
      action: 'This environment is generally favorable for option sellers (writing puts/calls) and for trend-following strategies.',
      check: d => d.volatility?.['India VIX']?.price < 12 
      },
      { name: 'Volatility Crush', type: 'info', region: 'Global',
      desc: 'The VIX has fallen more than 15% today. This "crush" often occurs after a major risk event (like a central bank decision) has passed, removing uncertainty.',
      action: 'This is often bullish for equities. Traders may look to sell put options to collect premium or close out existing hedges.',
      check: d => d.volatility?.VIX?.changePercent < -15 
      },
      { name: 'Coordinated Fear', type: 'critical', region: 'Intermarket',
      desc: 'Both the US VIX and India VIX are rising sharply, indicating widespread global risk aversion affecting both developed and emerging markets.',
      action: 'A strong signal to reduce overall market exposure globally. Cash or safe-haven assets like Gold may be preferred.',
      check: d => d.volatility?.VIX?.changePercent > 8 && d.volatility?.['India VIX']?.changePercent > 8 
      },
      { name: 'Fear Divergence', type: 'info', region: 'Intermarket',
      desc: 'Fear levels are moving in opposite directions in the US and India, suggesting a regional disconnect in risk perception. One market may be reacting to local news not affecting the other.',
      action: 'This may present relative value trades (e.g., long the calmer market, short the more volatile one).',
      check: d => (d.volatility?.VIX?.changePercent * d.volatility?.['India VIX']?.changePercent) < 0 
      },
      { name: 'Protective Buying', type: 'warning', region: 'Global',
      desc: 'The S&P 500 is rising, but the VIX is also rising. This suggests that even as the market goes up, smart money is buying protection (puts), indicating a lack of trust in the rally.',
      action: 'Be cautious of a "bull trap." The rally may lack conviction and could reverse. Avoid chasing prices higher.',
      check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.volatility?.VIX?.changePercent > 0.5 
      },
      { name: 'Complacency Sell-Off', type: 'warning', region: 'Global',
      desc: 'The S&P 500 is falling, but the VIX is also falling or flat. This suggests an unusual lack of fear from option traders, which can mean the sell-off has further to go.',
      action: 'This is a bearish sign. Traders may see this as an opportunity to initiate or add to short positions.',
      check: d => d.benchmarks?.['S&P 500']?.changePercent < -0.5 && d.volatility?.VIX?.changePercent < 0 
      },
      { name: 'Volatility Threshold Breached', type: 'info', region: 'Global',
      desc: 'The VIX has crossed above the key 20 level, signaling a transition from a low-volatility to a high-volatility regime.',
      action: 'Expect wider trading ranges and larger price swings. Strategies that profit from volatility may become more attractive.',
      check: d => d.volatility?.VIX?.price > 20 },
      // Add all other signals from previous turns here...
  ];
      
  let currentView = 'all', autoRefresh = true, refreshInterval, priceChart, newsChart, newsData = [], liveMarketData = {};
  let selectedDate = null;
  let chartState = { symbol: '^GSPC', range: '1d', interval: '5m' };
  
  // --- EVENT LISTENERS ---
  function initializeEventListeners() {
      // Control Buttons
      document.getElementById('btn-all').addEventListener('click', (e) => toggleView(e.currentTarget, 'all'));
      document.getElementById('btn-global').addEventListener('click', (e) => toggleView(e.currentTarget, 'global'));
      document.getElementById('btn-india').addEventListener('click', (e) => toggleView(e.currentTarget, 'india'));
      document.getElementById('refresh-btn').addEventListener('click', refreshData);
      document.getElementById('autorefresh-btn').addEventListener('click', (e) => toggleAutoRefresh(e.currentTarget));
  
      // Timeline Scrubber
      document.getElementById('timeline-scrubber').addEventListener('input', (e) => handleTimelineScrub(e.currentTarget.value));
  
      // Chart Controls
      document.getElementById('chartSymbolSelect').addEventListener('change', updateChart);
      document.getElementById('btn-1d').addEventListener('click', (e) => switchTimeframe(e.currentTarget, '1d', '5m'));
      document.getElementById('btn-5d').addEventListener('click', (e) => switchTimeframe(e.currentTarget, '5d', '30m'));
      document.getElementById('btn-1m').addEventListener('click', (e) => switchTimeframe(e.currentTarget, '1mo', '1d'));
      document.getElementById('btn-3m').addEventListener('click', (e) => switchTimeframe(e.currentTarget, '3mo', '1d'));
  }
  
  // --- CHARTING ---
  async function renderCharts() {
      const priceContainer = document.getElementById('priceChartContainer');
      const newsContainer = document.getElementById('newsChartContainer');
      priceContainer.innerHTML = '<div class="loading"></div>';
      newsContainer.innerHTML = ''; 
  
      if (priceChart) priceChart.destroy();
      if (newsChart) newsChart.destroy();
  
      const stockData = await fetchYahooFinanceData(chartState.symbol, chartState.range, chartState.interval);
      if (!stockData?.historicalData?.prices || stockData.historicalData.prices.every(p => p === null)) {
          priceContainer.innerHTML = `<div class="error">Chart data for ${chartState.symbol} unavailable.</div>`;
          return;
      }
  
      priceContainer.innerHTML = '';
      const priceCanvas = document.createElement('canvas');
      priceContainer.appendChild(priceCanvas);
  
      newsContainer.innerHTML = '';
      const newsCanvas = document.createElement('canvas');
      newsContainer.appendChild(newsCanvas);
  
      const { timestamps, prices } = stockData.historicalData;
      
      let labels;
      const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
      if (chartState.range === '1d') {
          labels = timestamps.map(ts => ts ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      } else if (chartState.range === '5d') {
           labels = timestamps.map(ts => {
               if (!ts) return '';
               const d = new Date(ts * 1000);
               return [dayFormatter.format(d), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })];
           });
      } else {
          labels = timestamps.map(ts => ts ? new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '');
      }
      
      const newsMarkers = newsData.map(news => {
          const newsTime = new Date(news.pubDate).getTime();
          let nearestTimestampIndex = -1, minDiff = Infinity;
          timestamps.forEach((ts, index) => {
              if (ts) {
                  const diff = Math.abs(ts * 1000 - newsTime);
                  if (diff < minDiff) { minDiff = diff; nearestTimestampIndex = index; }
              }
          });
          if (prices[nearestTimestampIndex] === null) {
              for (let i = nearestTimestampIndex; i >= 0; i--) { if (prices[i] !== null) { nearestTimestampIndex = i; break; } }
          }
          if (prices[nearestTimestampIndex] === null) return null;
          return { index: nearestTimestampIndex, item: news };
      }).filter((marker, index, self) => marker && index === self.findIndex(m => m.item.link === marker.item.link));
  
      // Main Price Chart
      priceChart = new Chart(priceCanvas.getContext('2d'), { 
          type: 'line', 
          data: { labels: labels, datasets: [{ label: chartState.symbol, data: prices, borderColor: '#00ff41', backgroundColor: 'rgba(0, 255, 65, 0.1)', borderWidth: 2, fill: true, tension: 0.1, pointRadius: 0 }] }, 
          options: { 
              responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, 
              plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.9)', titleColor: '#00ff41', bodyColor: '#66ff66', borderColor: '#00ff41', borderWidth: 1, displayColors: false, callbacks: { title: (context) => new Date(timestamps[context[0].dataIndex] * 1000).toLocaleString() } } }, 
              scales: { 
                  x: { ticks: { color: '#339933', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }, 
                  y: { ticks: { color: '#339933' } } 
              } 
          } 
      });
  
      // News Timeline Chart
      newsChart = new Chart(newsCanvas.getContext('2d'), {
          type: 'scatter',
          data: {
              labels: labels,
              datasets: [{
                  label: 'News Events',
                  data: newsMarkers.map(marker => ({ x: marker.index, y: 1 })),
                  pointStyle: 'triangle',
                  radius: 7,
                  hoverRadius: 10,
                  backgroundColor: '#ff0040',
              }]
          },
          options: {
              responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
              onHover: (e, el) => e.native.target.style.cursor = el[0] ? 'pointer' : 'default', 
              onClick: (e) => { const points = newsChart.getElementsAtEventForMode(e, 'index', { intersect: true }, true); if (points[0]) { const marker = newsMarkers[points[0].index]; if (marker) window.open(marker.item.link, '_blank'); } },
              plugins: {
                  legend: { display: false },
                  tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)', displayColors: false,
                      callbacks: {
                          title: () => '', 
                          label: (context) => {
                              const marker = newsMarkers[context.dataIndex];
                              return marker ? marker.item.title : '';
                          }
                      }
                  }
              },
              scales: {
                  x: { display: false },
                  y: { display: false, min: 0, max: 2 } 
              }
          }
      });
  }
  
  // --- DATA FETCHING & RENDERING PIPELINE ---
  async function fetchApi(endpoint) { 
      try { 
          const r = await fetch(`/${endpoint}`);
          const d = await r.json(); 
          if (!r.ok) throw new Error(d.error || `Server Error`); 
          return d; 
      } catch (e) { 
          console.error(`Fetch Fail: /${endpoint}`, e); 
          document.getElementById('dashboardGrid').innerHTML = `<div class="error" style="grid-column: 1 / -1;"><strong>Connection Failed.</strong><br>Ensure server is running.</div>`; 
          return null; 
      } 
  }
  async function fetchYahooFinanceData(s, r = '1d', i = '5m') { const d = await fetchApi(`finance-data/${s}?range=${r}&interval=${i}`); if (!d?.chart?.result?.[0]) return null; const { meta, indicators } = d.chart.result[0], { regularMarketPrice, chartPreviousClose } = meta, c = regularMarketPrice - chartPreviousClose, p = (c / chartPreviousClose) * 100; return { price: regularMarketPrice?.toFixed(2) || 'N/A', change: c?.toFixed(2) || 'N/A', changePercent: !isNaN(p) ? p : 0, sentiment: getSentiment(p), historicalData: { timestamps: d.chart.result[0].timestamp, prices: indicators.quote[0].close } }; }
  async function fetchHistoricalDataForDate(s, d) { const ds = new Date(d); ds.setHours(0,0,0,0); const de = new Date(d); de.setHours(23,59,59,999); const p1 = Math.floor(ds.getTime()/1000), p2 = Math.floor(de.getTime()/1000); const data = await fetchApi(`finance-data/${s}?period1=${p1}&period2=${p2}`); if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]) return null; const q = data.chart.result[0].indicators.quote[0]; if (!q.close || q.close.length < 2) return null; const cp = q.close[q.close.length - 1], pc = q.close[q.close.length - 2], c = cp - pc, p = (c / pc) * 100; return { price: cp?.toFixed(2) || 'N/A', change: c?.toFixed(2) || 'N/A', changePercent: !isNaN(p) ? p : 0, sentiment: getSentiment(p) }; }
  async function fetchAllMarketData(d = null) { const data = {}; for (const c in marketDataConfig) data[c] = {}; const p = []; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) { const y = marketDataConfig[c][s].yahooSymbol; const pr = d ? fetchHistoricalDataForDate(y, d).then(r => ({ category: c, symbolKey: s, data: r })) : fetchYahooFinanceData(y).then(r => ({ category: c, symbolKey: s, data: r })); p.push(pr); } const r = await Promise.all(p); r.forEach(i => { if (i.data) data[i.category][i.symbolKey] = i.data; }); return data; }
  async function fetchLiveNews(v) { const r = (v === 'global') ? 'global' : 'india'; const d = await fetchApi(`news?region=${r}`); return d?.items || []; }
  function getSentiment(p) { const c = parseFloat(p); if (c > 1.5) return 'bullish'; if (c < -1.5) return 'bearish'; return 'neutral-status'; }
  function generateExecutiveSummary(d, v) { const da = {}; let t = 'Overall Market'; if (v === 'global') { t = 'Global Markets'; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) if (marketDataConfig[c][s].region === 'Global' && d[c]?.[s]) da[s] = d[c][s]; } else if (v === 'india') { t = 'Indian Markets'; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) if (marketDataConfig[c][s].region === 'India' && d[c]?.[s]) da[s] = d[c][s]; } else { for (const c in d) Object.assign(da, d[c]); } const ad = Object.values(da).filter(Boolean); if (ad.length === 0) return { summary: 'Data unavailable.', status: 'neutral', title: t }; const bc = ad.filter(d => d.sentiment === 'bullish').length, brc = ad.filter(d => d.sentiment === 'bearish').length; let s = 'neutral'; if (bc > brc) s = 'bullish'; if (brc > bc) s = 'bearish'; let sm = `Sentiment for <strong>${t}</strong> is <strong>${s.toUpperCase()}</strong>. `; const km = ad.sort((a,b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0,1); if(km.length > 0 && km[0].changePercent !== 0) { const kmn = Object.keys(da).find(k => da[k] === km[0]); sm += `Key mover: ${kmn} (${km[0].changePercent.toFixed(2)}%).`; } return { summary: sm, status: s, title: t }; }
  
  function renderSignals(d) {
      const sg = document.getElementById('signalsGrid');
      let activeSignals = signalsConfig.filter(s => {
          try { return s.check(d); } catch { return false; }
      });
      if (currentView === 'global') {
          activeSignals = activeSignals.filter(s => s.region === 'Global' || s.region === 'Intermarket');
      } else if (currentView === 'india') {
          activeSignals = activeSignals.filter(s => s.region === 'India' || s.region === 'Intermarket');
      }
      const priority = { critical: 1, warning: 2, opportunity: 3, info: 4 };
      activeSignals.sort((a, b) => priority[a.type] - priority[b.type]);
      const displayedSignals = activeSignals.slice(0, 12);
      if (displayedSignals.length === 0) {
          sg.innerHTML = `<div style="color:var(--text-dim);text-align:center;grid-column:1 / -1;">No significant signals detected for this view.</div>`;
          return;
      }
      sg.innerHTML = displayedSignals.map(s => {
          const desc = typeof s.desc === 'function' ? s.desc(d) : s.desc;
          const action = s.action || 'No specific action recommended.';
          return `<div class="signal-card ${s.type}">
                      <div class="signal-title">${s.name}</div>
                      <div class="signal-desc">${desc}</div>
                      <div class="signal-action">${action}</div>
                  </div>`;
      }).join('');
  }
  
  function renderMarketData(d) { const g = document.getElementById('dashboardGrid'); let h = ''; for (const c in marketDataConfig) { let chvi = false, ch = ''; for (const sk in marketDataConfig[c]) { const i = marketDataConfig[c][sk]; if (currentView === 'all' || (currentView === 'global' && i.region === 'Global') || (currentView === 'india' && i.region === 'India')) { chvi = true; ch += createSentimentCard(c, sk, i, d[c]?.[sk]); } } if (chvi) { h += `<h3 class="section-title" style="grid-column:1 / -1;margin-bottom:0;">${c}</h3>` + ch; } } g.innerHTML = h; }
  function createSentimentCard(c, sk, i, d) { if (!d) return `<div class="sentiment-card"><div class="card-header"><div class="card-title">${sk}</div></div><div style="text-align:center;color:var(--text-dim);padding:20px 0;">Data unavailable</div></div>`; const cc = parseFloat(d.change) > 0 ? 'positive' : parseFloat(d.change) < 0 ? 'negative' : 'neutral', cs = parseFloat(d.change) >= 0 ? '+' : ''; return `<div class="sentiment-card"><div class="card-header"><div class="card-title">${sk}</div><div class="category-tag">${i.region}</div></div><div class="metric-row"><div class="metric-name">${i.name}</div><div class="metric-value"><div class="status-indicator ${d.sentiment}"></div></div></div><div class="metric-row"><div class="metric-name">Price</div><div class="price">${d.price}</div></div><div class="metric-row"><div class="metric-name">Change</div><div class="change ${cc}">${cs}${d.change} (${cs}${d.changePercent.toFixed(2)}%)</div></div></div>`; }
  function renderNews(n, v) { const c = document.getElementById('newsContainer'); document.getElementById('news-title').textContent = v === 'global' ? 'Live Global Business News' : 'Live Indian Business News'; if (!n || n.length === 0) { c.innerHTML = '<div style="padding:10px;color:var(--text-dim);text-align:center;">No live news available.</div>'; return; } c.innerHTML = n.slice(0, 10).map(i => `<div class="news-item"><div class="news-title"><a href="${i.link}" target="_blank" rel="noopener noreferrer">${i.title}</a></div><div class="news-time">${new Date(i.pubDate).toLocaleString()}</div></div>`).join(''); }
  function renderExecutiveSummary({ summary, status, title }) { document.getElementById('summary-title').textContent = `${title} Summary`; document.getElementById('executiveSummary').innerHTML = `<div class="summary-header"><div class="section-title" style="margin:0;border:none;padding:0;font-size:1rem;">Status</div><div class="summary-status summary-${status}">${status.toUpperCase()}</div></div><div class="summary-text">${summary}</div>`; }
  async function renderDashboard(d = null) { const ish = d !== null; document.getElementById('dashboardGrid').innerHTML = '<div class="loading"></div>'; document.getElementById('signalsGrid').innerHTML = '<div class="loading"></div>'; const dp = fetchAllMarketData(d); const np = ish ? Promise.resolve([]) : fetchLiveNews(currentView); const [md, fn] = await Promise.all([dp, np]); newsData = fn || []; liveMarketData = md || {}; if (!liveMarketData || document.querySelector('#dashboardGrid .error')) return; renderMarketData(liveMarketData); renderSignals(liveMarketData); document.getElementById('news-panel').style.display = ish ? 'none' : 'block'; if (!ish) { renderNews(newsData, currentView); } const sd = generateExecutiveSummary(liveMarketData, currentView); renderExecutiveSummary(sd); updateLastUpdated(); if (ish) { document.getElementById('priceChartContainer').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);">Live chart unavailable for historical dates.</div>`; document.getElementById('newsChartContainer').innerHTML = ''; } else { renderCharts(); } }
  function handleTimelineScrub(v) { const da = 90 - v, d = new Date(); d.setDate(d.getDate() - da); document.getElementById('autorefresh-btn').disabled = (da !== 0); if (autoRefresh && da !== 0) { toggleAutoRefresh(document.getElementById('autorefresh-btn')); } if (da === 0) { selectedDate = null; document.getElementById('timeline-date').textContent = "TODAY (LIVE)"; renderDashboard(); } else { selectedDate = d; document.getElementById('timeline-date').textContent = d.toDateString().toUpperCase(); renderDashboard(d); } }
  function toggleView(btn, view = 'all') { currentView = view; document.querySelectorAll('.controls .control-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); handleTimelineScrub(document.getElementById('timeline-scrubber').value); }
  function refreshData() { renderDashboard(selectedDate); }
  function toggleAutoRefresh(btn) { autoRefresh = !autoRefresh; btn.textContent = `Auto-Refresh: ${autoRefresh ? 'ON' : 'OFF'}`; if (autoRefresh) startAutoRefresh(); else clearInterval(refreshInterval); }
  function switchTimeframe(btn, range, interval) { chartState.range = range; chartState.interval = interval; document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); if (!selectedDate) renderCharts(); }
  function updateChart() { chartState.symbol = document.getElementById('chartSymbolSelect').value; if (!selectedDate) renderCharts(); }
  function startAutoRefresh() { clearInterval(refreshInterval); refreshInterval = setInterval(() => { if (autoRefresh && selectedDate === null) renderDashboard(); }, 900000); }
  function updateLastUpdated() { document.getElementById('lastUpdated').textContent = selectedDate ? `Displaying Historical Data for ${selectedDate.toDateString()}` : `Live Data | Updated: ${new Date().toLocaleTimeString()}`; }
  function populateChartSelector() { const s = document.getElementById('chartSymbolSelect'); s.innerHTML = ''; for (const c in marketDataConfig) { const o = document.createElement('optgroup'); o.label = c.charAt(0).toUpperCase() + c.slice(1); for (const sk in marketDataConfig[c]) { const i = marketDataConfig[c][sk]; const op = document.createElement('option'); op.value = i.yahooSymbol; op.textContent = `${sk} (${i.region})`; if (op.value === chartState.symbol) op.selected = true; o.appendChild(op); } s.appendChild(o); } }
  
  window.addEventListener('load', () => {
      populateChartSelector();
      renderDashboard();
      startAutoRefresh();
      initializeEventListeners();
  });