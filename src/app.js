import {
    Chart,
    LineController,
    ScatterController, // <-- ADDED
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler             // <-- ADDED
  } from 'chart.js';
  
  Chart.register(
    LineController,
    ScatterController, // <-- ADDED
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler             // <-- ADDED
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

    // ===================================
    // Broad Market Equity Signals (13)
    // ===================================
    { name: 'Broad Market Sell-Off', type: 'critical', region: 'Global', desc: 'The S&P 500, Nasdaq, and Russell 2000 are all down significantly, indicating a broad-based market decline with nowhere to hide.', action: 'A strong bearish signal. Traders may consider broad market shorts (e.g., shorting SPY or QQQ) or buying VIX calls.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -1.0 && d.benchmarks?.Nasdaq?.changePercent < -1.2 && d.benchmarks?.['Russell 2000']?.changePercent < -1.2 },
    { name: 'Broad Market Rally', type: 'opportunity', region: 'Global', desc: 'The S&P 500, Nasdaq, and Russell 2000 are all up strongly, signaling a healthy and broad-based market rally.', action: 'A strong bullish signal. Traders may consider buying broad market ETFs or call options.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 1.0 && d.benchmarks?.Nasdaq?.changePercent > 1.2 && d.benchmarks?.['Russell 2000']?.changePercent > 1.2 },
    { name: 'Market Capitulation', type: 'critical', region: 'Global', desc: 'The S&P 500 is down more than 2.5%, a sign of panic selling. This can sometimes mark a short-term bottom as the last sellers are flushed out.', action: 'While dangerous, contrarian buyers look for these moments to start accumulating long positions, expecting a potential bounce.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -2.5 },
    { name: 'Market Euphoria', type: 'warning', region: 'Global', desc: 'The S&P 500 is up more than 2.5%, a sign of euphoric buying. This often indicates an overbought market susceptible to a pullback.', action: 'A signal to be cautious. Consider taking profits on long positions or tightening stop-losses. Avoid initiating new long positions.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 2.5 },
    { name: 'Global Equity Rally', type: 'opportunity', region: 'Intermarket', desc: 'Both the S&P 500 and Emerging Markets are rising together, signaling a synchronized global growth story.', action: 'Bullish for global equities. Consider long positions in both US (SPY) and Emerging Market (EEM) ETFs.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 1.0 && d.specialized?.['Emerging Markets']?.changePercent > 1.0 },
    { name: 'Global Equity Slump', type: 'critical', region: 'Intermarket', desc: 'Both the S&P 500 and Emerging Markets are falling, indicating widespread global economic concerns.', action: 'Bearish for global equities. Consider short positions or defensive assets like cash and bonds.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -1.0 && d.specialized?.['Emerging Markets']?.changePercent < -1.0 },
    { name: 'US Market Strength', type: 'info', region: 'Intermarket', desc: 'The S&P 500 is rising while Emerging Markets are falling, showing capital is flowing into the US market as a perceived safe haven.', action: 'Suggests a relative value trade: long US stocks (SPY) and short Emerging Market stocks (EEM).', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < 0 },
    { name: 'Emerging Market Strength', type: 'opportunity', region: 'Intermarket', desc: 'Emerging Markets are outperforming the S&P 500, a strong signal of global risk appetite and a potentially weakening dollar.', action: 'Bullish for non-US assets. Traders might look for opportunities in EEM or specific country ETFs.', check: d => d.specialized?.['Emerging Markets']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5 },
    { name: 'Weak Market Breadth', type: 'warning', region: 'Global', desc: 'The Nasdaq (large-cap tech) is up but the broader Russell 2000 (small caps) is down, suggesting a few mega-cap stocks are driving the market, which can be an unhealthy sign.', action: 'A sign of a fragile rally. Be cautious, as the rally may not be sustainable if it doesn\'t broaden to include more stocks.', check: d => d.benchmarks?.Nasdaq?.changePercent > 0.5 && d.benchmarks?.['Russell 2000']?.changePercent < 0 },
    { name: 'Strong Market Breadth', type: 'opportunity', region: 'Global', desc: 'Both the Nasdaq and the Russell 2000 are rising, showing that both large and small companies are participating in the rally, a sign of a healthy market.', action: 'Confirms bullish sentiment. This supports initiating or holding broad market long positions.', check: d => d.benchmarks?.Nasdaq?.changePercent > 1.0 && d.benchmarks?.['Russell 2000']?.changePercent > 1.0 },
    { name: 'S&P Overbought', type: 'warning', region: 'Global', desc: 'The S&P 500 has experienced a strong upward move of over 1.5% today, putting it in a technically overbought position and increasing the chance of a short-term pullback.', action: 'Avoid chasing the market higher. Good time to tighten stop-losses or take partial profits on existing longs.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 1.5 },
    { name: 'S&P Oversold', type: 'opportunity', region: 'Global', desc: 'The S&P 500 has sold off sharply by over 1.5% today, putting it in an oversold condition where a technical bounce is more likely.', action: 'Contrarian traders may look for signs of a bottom to initiate short-term long positions or sell put options.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -1.5 },
    { name: 'Global Growth Confidence', type: 'opportunity', region: 'Global', desc: 'Small-cap stocks (Russell 2000) and crude oil are both rising, indicating strong confidence in future economic growth and industrial demand.', action: 'Bullish for cyclical sectors like industrials, materials, and energy. Consider long positions in these areas.', check: d => d.benchmarks?.['Russell 2000']?.changePercent > 1.0 && d.commodities?.['Crude Oil']?.changePercent > 1.5 },
    
    // ===================================
    // Sector & Style Signals (12)
    // ===================================
    { name: 'Tech Dominance', type: 'info', region: 'Global', desc: `The Nasdaq is strongly outperforming the S&P 500, indicating a tech-led market where growth stocks are favored.`, action: 'Favors long positions in technology stocks (QQQ) and other growth-oriented sectors.', check: d => d.benchmarks?.Nasdaq?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.75 },
    { name: 'Tech Weakness', type: 'warning', region: 'Global', desc: 'The Nasdaq is significantly underperforming the S&P 500, signaling weakness in the technology sector and a potential rotation to other areas.', action: 'Suggests caution on tech stocks. Traders might reduce exposure to QQQ or look for short opportunities in weaker tech names.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.Nasdaq?.changePercent + 0.75 },
    { name: 'Value Over Growth', type: 'info', region: 'Global', desc: 'The S&P 500 is outperforming the Nasdaq, which may suggest a market rotation from growth stocks (tech) to value stocks (financials, industrials).', action: 'Traders may look for opportunities in value-oriented ETFs and sectors while reducing exposure to high-growth tech.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.2 && d.benchmarks?.Nasdaq?.changePercent < d.benchmarks?.['S&P 500']?.changePercent },
    { name: 'Small Cap Euphoria', type: 'warning', region: 'Global', desc: 'Small cap stocks (Russell 2000) are up more than 2.5%, which can be a sign of excessive speculation or market froth.', action: 'A signal to be cautious about overall market health. High risk-taking could lead to a sharp reversal.', check: d => d.benchmarks?.['Russell 2000']?.changePercent > 2.5 },
    { name: 'Small Cap Panic', type: 'critical', region: 'Global', desc: 'Small cap stocks (Russell 2000) are down more than 2.5%, indicating a flight from risk and potential economic concerns, as small companies are more sensitive to the domestic economy.', action: 'Bearish for the broader economy. A strong signal to adopt a defensive posture.', check: d => d.benchmarks?.['Russell 2000']?.changePercent < -2.5 },
    { name: 'Small Caps Lead Higher', type: 'opportunity', region: 'Global', desc: 'Small caps are outperforming large caps (S&P 500), which is often a bullish sign of a healthy, risk-on market with broad participation.', action: 'Confirms bullish sentiment. Traders may favor small-cap ETFs (IWM) over large-cap ones.', check: d => d.benchmarks?.['Russell 2000']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5 },
    { name: 'Small Caps Lag', type: 'warning', region: 'Global', desc: 'Small caps are underperforming large caps (S&P 500), suggesting investors are becoming more defensive and favoring the perceived safety of larger companies.', action: 'A leading indicator of potential market weakness. Caution is advised.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Russell 2000']?.changePercent + 0.5 },
    { name: 'Indian Banking Strength', type: 'opportunity', region: 'India', desc: 'The Bank Nifty is strongly outperforming the Nifty 50, suggesting a robust sentiment in the financial sector, which often leads the broader market higher.', action: 'Bullish for the Indian market. Traders might consider long positions in banking stocks or the Bank Nifty itself.', check: d => d.specialized?.['Bank Nifty']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.75 },
    { name: 'Indian Banking Drag', type: 'warning', region: 'India', desc: 'The Bank Nifty is underperforming the Nifty 50, indicating potential stress or weakness in the financial sector, which could pull the broader market down.', action: 'A bearish sign for the Indian market. Traders might avoid banking stocks or consider hedging.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > d.specialized?.['Bank Nifty']?.changePercent + 0.75 },
    { name: 'Indian Financial Stress', type: 'critical', region: 'India', desc: 'The Bank Nifty is down more than 2%, a significant drop that could indicate systemic concerns in the financial sector.', action: 'A strong signal to be cautious or bearish on the entire Indian market.', check: d => d.specialized?.['Bank Nifty']?.changePercent < -2.0 },
    { name: 'EM vs US Divergence', type: 'info', region: 'Intermarket', desc: 'Emerging Markets and the S&P 500 are moving in opposite directions, suggesting a clear preference for one region over the other based on macro factors.', action: 'A clear opportunity for a pairs trade: long the outperformer and short the underperformer.', check: d => d.specialized?.['Emerging Markets']?.changePercent * d.benchmarks?.['S&P 500']?.changePercent < 0 },
    { name: 'Tech vs Small Cap Rotation', type: 'info', region: 'Global', desc: 'Nasdaq (large-cap tech) and Russell 2000 (small-cap) are moving in opposite directions, indicating a rotation in market leadership between growth and domestic economy themes.', action: 'Traders can ride the rotation by favoring the outperforming group.', check: d => d.benchmarks?.Nasdaq?.changePercent * d.benchmarks?.['Russell 2000']?.changePercent < 0 },

    // ===================================
    // Commodity Signals (11)
    // ===================================
    { name: 'Major Oil Price Shock', type: 'critical', region: 'Global', desc: d => `Crude oil has moved by ${d.commodities?.['Crude Oil']?.changePercent?.toFixed(1)}%, a significant move that will impact inflation, consumer spending, and transportation stocks.`, action: 'High oil prices can hurt airlines and consumer stocks but benefit energy producers. Low prices do the opposite.', check: d => Math.abs(d.commodities?.['Crude Oil']?.changePercent) > 4.0 },
    { name: 'Gold as Safe Haven', type: 'info', region: 'Global', desc: 'Gold is rising while the S&P 500 is falling, confirming its status as a safe-haven asset in times of market stress.', action: 'In a risk-off environment, traders may increase allocation to gold (GLD) as a hedge against equity losses.', check: d => d.commodities?.Gold?.changePercent > 0.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.5 },
    { name: 'Gold Losing Luster', type: 'warning', region: 'Global', desc: 'Gold is falling even as the S&P 500 sells off. This is bearish, suggesting investors prefer cash and are selling all assets.', action: 'A sign of a liquidity crunch or major deleveraging. Cash is king in this environment.', check: d => d.commodities?.Gold?.changePercent < -0.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.5 },
    { name: 'Strong Gold Rally', type: 'opportunity', region: 'Global', desc: 'Gold is up more than 1.5%, a strong move often associated with inflation fears or significant geopolitical risk.', action: 'Bullish for gold and gold mining stocks. Traders might consider buying GLD or related equities.', check: d => d.commodities?.Gold?.changePercent > 1.5 },
    { name: 'Oil Plunge (Demand Fear)', type: 'warning', region: 'Global', desc: 'Crude oil has dropped more than 3%, which can signal falling global demand and potential recession fears.', action: 'Bearish for the global economy and energy stocks. Potentially bullish for transportation and consumer sectors due to lower fuel costs.', check: d => d.commodities?.['Crude Oil']?.changePercent < -3.0 },
    { name: 'Inflation Hedge Signal', type: 'warning', region: 'Global', desc: 'Gold is rising while bonds are selling off (yields rising), suggesting investors are buying gold specifically to hedge against inflation, anticipating that central banks are behind the curve.', action: 'A classic stagflation signal. Gold may outperform, while bonds and growth stocks may underperform.', check: d => d.commodities?.Gold?.changePercent > 0.8 && d.bonds?.['US 10Y Yield']?.changePercent > 2.0 },
    { name: 'Industrial Slowdown?', type: 'warning', region: 'Global', desc: 'Crude oil is falling while stocks are also falling, a combination that can point to fears of a slowdown in economic activity and corporate earnings.', action: 'A bearish signal for cyclical stocks. Defensive sectors like utilities and consumer staples may outperform.', check: d => d.commodities?.['Crude Oil']?.changePercent < -1.5 && d.benchmarks?.['S&P 500']?.changePercent < -1.0 },
    { name: 'Gold vs Dollar Inverse Correlation', type: 'info', region: 'Global', desc: 'Gold and the US Dollar are moving in opposite directions, following their classic inverse relationship.', action: 'This is a normal market state. A falling dollar is typically a tailwind for gold prices and vice-versa.', check: d => d.commodities?.Gold?.changePercent * d.currencies?.DXY?.changePercent < 0 },
    { name: 'Gold Breaking Correlation', type: 'info', region: 'Global', desc: 'Gold and the US Dollar are rising together, an unusual event that could signal a major "flight to safety" where both are seen as safe havens.', action: 'A sign of significant global instability. Traders may reduce risk across the board.', check: d => d.commodities?.Gold?.changePercent > 0.5 && d.currencies?.DXY?.changePercent > 0.5 },
    { name: 'Commodity Super Cycle?', type: 'opportunity', region: 'Global', desc: 'Gold and Oil are both positive while the US Dollar is negative, a bullish signal for the commodity complex.', action: 'Suggests a potential long-term trend in commodities. Consider long positions in commodity-related ETFs.', check: d => d.commodities?.Gold?.changePercent > 0.5 && d.commodities?.['Crude Oil']?.changePercent > 0.5 && d.currencies?.DXY?.changePercent < -0.3 },
    { name: 'Oil-Stock Divergence', type: 'warning', region: 'Global', desc: 'Crude oil is rising sharply, but stocks are falling. This suggests that energy costs are high enough to hurt corporate profits and consumer spending.', action: 'Bearish for the broader market, especially consumer discretionary and industrial sectors. Favorable only for energy stocks.', check: d => d.commodities?.['Crude Oil']?.changePercent > 2.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.5 },
    
    // ===================================
    // Currency Signals (10)
    // ===================================
    { name: 'Major Dollar Move', type: 'critical', region: 'Global', desc: d => `The US Dollar Index has moved by over 1%, a very large move that will have significant ripple effects across all global asset classes.`, action: 'A strong dollar is typically bearish for US corporate earnings (exporters), commodities, and emerging markets. A weak dollar is the opposite.', check: d => Math.abs(d.currencies?.DXY?.changePercent) > 1.0 },
    { name: 'Strong Dollar Headwind', type: 'critical', region: 'Global', desc: 'A rising dollar is putting pressure on both Equities and Commodities, a strong risk-off signal as global liquidity tightens.', action: 'Bearish for most assets except the dollar itself. A time to be defensive.', check: d => d.currencies?.DXY?.changePercent > 0.5 && d.benchmarks?.['S&P 500']?.changePercent < 0 && d.commodities?.Gold?.changePercent < 0 },
    { name: 'Weak Dollar Tailwind', type: 'opportunity', region: 'Global', desc: 'A falling dollar is boosting both Equities and Commodities, a strong risk-on signal as global financial conditions loosen.', action: 'Bullish for most assets, especially commodities and international stocks.', check: d => d.currencies?.DXY?.changePercent < -0.5 && d.benchmarks?.['S&P 500']?.changePercent > 0 && d.commodities?.Gold?.changePercent > 0 },
    { name: 'Rupee Under Pressure', type: 'warning', region: 'India', desc: `The Indian Rupee has weakened by more than 0.4% against the USD, which can fuel inflation and signal FII outflows.`, action: 'Negative for the Indian market. It hurts importers and can lead to foreign investors selling Indian assets.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.4 },
    { name: 'Rupee Strengthening', type: 'opportunity', region: 'India', desc: 'The Indian Rupee is strengthening against the USD, which helps control inflation and is attractive for FII inflows.', action: 'Positive for the Indian market, especially for companies with high import costs.', check: d => d.currencies?.['USD/INR']?.changePercent < -0.4 },
    { name: 'EM Currency Stress', type: 'warning', region: 'Intermarket', desc: 'The US Dollar is rising while Emerging Market stocks are falling, a classic sign of capital outflows from emerging markets.', action: 'Bearish for EM assets, including India. Suggests avoiding or reducing exposure to EEM.', check: d => d.currencies?.DXY?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < -0.5 },
    { name: 'Indian IT Sector Boost', type: 'info', region: 'India', desc: 'A weakening Rupee (USD/INR rising) is generally positive for Indian IT companies that earn revenue in dollars.', action: 'This specific macro condition can support a rally in Indian IT stocks, even if the broader market is weak.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.3 },
    { name: 'Risk-On Currency Flow', type: 'opportunity', region: 'Global', desc: 'The US Dollar is weakening while high-risk small-cap stocks are rallying, showing a strong appetite for risk.', action: 'This confirms a "risk-on" environment. Bullish for equities, particularly small caps and cyclical sectors.', check: d => d.currencies?.DXY?.changePercent < -0.4 && d.benchmarks?.['Russell 2000']?.changePercent > 1.0 },
    { name: 'Risk-Off Currency Flow', type: 'critical', region: 'Global', desc: 'The US Dollar is strengthening while high-risk small-cap stocks are selling off, a classic defensive move.', action: 'Confirms a "risk-off" environment. Bearish for equities; favors holding US Dollars.', check: d => d.currencies?.DXY?.changePercent > 0.4 && d.benchmarks?.['Russell 2000']?.changePercent < -1.0 },
    { name: 'Indian Importer Alert', type: 'warning', region: 'India', desc: 'A weakening Rupee can increase costs for Indian companies that rely on imports, such as oil marketing companies.', action: 'Potentially bearish for stocks in sectors with high import costs (e.g., oil & gas, manufacturing).', check: d => d.currencies?.['USD/INR']?.changePercent > 0.3 && d.commodities?.['Crude Oil']?.changePercent > 0 },
    
    // ===================================
    // Bond & Credit Market Signals (13)
    // ===================================
    { name: 'Major Bond Sell-Off', type: 'critical', region: 'Global', desc: d => `The 10-Year Treasury Yield has jumped by more than 5%, a major move signaling a repricing of interest rate expectations.`, action: 'Very bearish for existing bondholders and "long duration" assets like growth and tech stocks. Favors value and financial stocks.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 5.0 },
    { name: 'Major Bond Rally', type: 'opportunity', region: 'Global', desc: 'The 10-Year Treasury Yield is falling by more than 5%, indicating a significant flight to safety or a major shift in inflation expectations.', action: 'Bullish for existing bondholders and growth stocks. Can be a strong signal of impending economic weakness.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -5.0 },
    { name: 'Yields Up, Stocks Up (Reflation)', type: 'info', region: 'Global', desc: 'Both bond yields and stocks are rising, which can be a sign of a strong "pro-growth" economic environment where rising rates are seen as a confirmation of strength.', action: 'Bullish for cyclical and value stocks. Suggests the economy can handle higher interest rates.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 1.5 && d.benchmarks?.['S&P 500']?.changePercent > 0.8 },
    { name: 'Yields Up, Stocks Down (Stagflation Fear)', type: 'warning', region: 'Global', desc: 'Bond yields are rising but stocks are falling. This can signal fears that higher interest rates (inflation) will hurt the economy and corporate profits.', action: 'A difficult environment for investors. Bearish for most stocks, especially growth. Favors commodities.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 1.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.5 },
    { name: 'Yields Down, Stocks Up (Goldilocks)', type: 'opportunity', region: 'Global', desc: 'Bond yields are falling and stocks are rising. This is a very bullish "goldilocks" scenario, driven by expectations of lower inflation and continued growth.', action: 'The best environment for stocks, especially growth and technology. Consider long positions in QQQ and SPY.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -1.5 && d.benchmarks?.['S&P 500']?.changePercent > 0.8 },
    { name: 'Yields Down, Stocks Down (Recession Fear)', type: 'critical', region: 'Global', desc: 'Both bond yields and stocks are falling, a strong signal of recession fears where investors sell equities and pile into the safety of government bonds.', action: 'Highly defensive signal. Favors holding government bonds and cash. Bearish for almost all stocks.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -1.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.8 },
    { name: 'Credit Market Stress', type: 'critical', region: 'Global', desc: 'High-yield ("junk") bonds are selling off sharply, indicating a rising fear of corporate defaults and credit risk.', action: 'A leading indicator of economic trouble. Strongly bearish for the stock market.', check: d => d.bonds?.['High-Yield Bonds']?.changePercent < -1.0 },
    { name: 'Credit Market Rally', type: 'opportunity', region: 'Global', desc: 'High-yield bonds are rallying, signaling that investors are confident about corporate health and willing to take on more risk.', action: 'A leading indicator of economic strength. Bullish for the stock market, especially small caps.', check: d => d.bonds?.['High-Yield Bonds']?.changePercent > 0.8 },
    { name: 'Growth Stock Warning', type: 'warning', region: 'Global', desc: 'Treasury yields are rising sharply, which increases the discount rate for future earnings and can negatively impact high-growth tech stocks.', action: 'A signal to be cautious with tech stocks (Nasdaq). May favor a rotation to value.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 2.5 && d.benchmarks?.Nasdaq?.changePercent < 0 },
    { name: 'Defensive Rotation', type: 'info', region: 'Global', desc: 'Bonds are rallying (yields down) while high-risk small caps are selling off, showing a clear rotation into defensive assets.', action: 'Confirms a risk-off sentiment. Traders may reduce equity exposure and increase bond allocation.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -1.0 && d.benchmarks?.['Russell 2000']?.changePercent < -1.0 },
    { name: 'High Yield Divergence (Bearish)', type: 'warning', region: 'Global', desc: 'The S&P 500 is rising but high-yield bonds are falling. This is a bearish non-confirmation, as the "smart money" in the credit market is not confirming the stock market rally.', action: 'A strong warning sign that the equity rally may be deceptive and could fail.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.bonds?.['High-Yield Bonds']?.changePercent < 0 },
    { name: 'High Yield Confirmation (Bullish)', type: 'opportunity', region: 'Global', desc: 'Both the S&P 500 and high-yield bonds are rising together, showing that both equity and credit markets are aligned in a bullish, risk-on sentiment.', action: 'A strong confirmation of a healthy rally. Supports holding or adding to long equity positions.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.bonds?.['High-Yield Bonds']?.changePercent > 0.4 },
    { name: 'Yields Nearing Inversion', type: 'critical', region: 'Global', desc: 'The 10-Year Treasury Yield is approaching the 2-Year Yield. An inversion (10Y < 2Y) is a classic recession indicator.', action: 'Monitor yield curve spreads closely. An inversion is a high-probability recession signal, warranting a very defensive investment posture.', check: d => false }, // Note: Requires 2Y Yield data, which is not currently fetched. Conceptual signal.
    
    // ===================================
    // India-Specific Signals (8)
    // ===================================
    { name: 'India Outperformance', type: 'opportunity', region: 'Intermarket', desc: d => `The Nifty 50 is outperforming the S&P 500 by ${(d.benchmarks?.['Nifty 50']?.changePercent - d.benchmarks?.['S&P 500']?.changePercent).toFixed(1)}%, highlighting relative strength.`, action: 'Suggests favoring Indian equities over US equities. Look for long opportunities in Nifty 50 or strong Indian stocks.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5 },
    { name: 'India Underperformance', type: 'warning', region: 'Intermarket', desc: 'The Nifty 50 is significantly underperforming global markets, indicating specific weakness in the Indian market.', action: 'Suggests reducing exposure to Indian equities. Look for hedging opportunities or short positions.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.75 },
    { name: 'Indian Market Sell-Off', type: 'critical', region: 'India', desc: 'The Nifty 50 is down more than 1.5%, a significant intraday drop signaling broad selling pressure.', action: 'A clear bearish signal for the day. Traders may liquidate long positions or initiate shorts.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -1.5 },
    { name: 'Indian Market Breakout', type: 'opportunity', region: 'India', desc: 'The Nifty 50 is up more than 1.5%, signaling a strong bullish breakout that could lead to further upside.', action: 'A strong bullish signal. Traders may initiate long positions or buy Nifty call options.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 1.5 },
    { name: 'Indian Decoupling (Bullish)', type: 'opportunity', region: 'Intermarket', desc: 'The Indian market is rising even as major global markets like the S&P 500 are falling, showing strong domestic sentiment or local positive news.', action: 'Very bullish for India. Suggests Indian equities are a good place to be relative to the rest of the world.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.2 },
    { name: 'Indian Decoupling (Bearish)', type: 'warning', region: 'Intermarket', desc: 'The Indian market is falling even as global markets are rising, suggesting local factors (e.g., politics, RBI policy) are weighing on sentiment.', action: 'A signal to be cautious specifically on Indian assets, even if the global picture is positive.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.5 && d.benchmarks?.['S&P 500']?.changePercent > 0.2 },
    { name: 'Broad Indian Rally', type: 'opportunity', region: 'India', desc: 'Both the large-cap Nifty 50 and the financial-heavy Bank Nifty are rising strongly, indicating broad participation.', action: 'Confirms a healthy rally in the Indian market. Supports holding long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 1.0 && d.specialized?.['Bank Nifty']?.changePercent > 1.2 },
    { name: 'EM Outflow Risk for India', type: 'warning', region: 'Intermarket', desc: 'A rising dollar and falling Emerging Market Index can signal foreign institutional investors (FIIs) are pulling money out, which often negatively affects India.', action: 'A leading indicator for potential FII selling in the Indian market. Caution is advised.', check: d => d.currencies?.DXY?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < -0.8 },

    // ===================================
    // Nifty & Sensex Magnitude Signals (6)
    // ===================================
    { name: 'Nifty Strong Gain', type: 'opportunity', region: 'India', desc: 'The Nifty 50 is up more than 1%, indicating strong, broad-based buying momentum for the day.', action: 'Bullish signal. Traders may consider adding to long positions or buying call options, expecting the positive trend to continue.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 1.0 },
    { name: 'Nifty Heavy Loss', type: 'critical', region: 'India', desc: 'The Nifty 50 is down more than 1%, indicating significant, broad-based selling pressure.', action: 'Bearish signal. Traders may consider selling long positions, initiating shorts, or buying put options for hedging.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -1.0 },
    { name: 'Nifty Range-Bound Day', type: 'info', region: 'India', desc: 'The Nifty 50 is trading in a narrow range (less than +/- 0.3%), suggesting market indecision and consolidation.', action: 'A signal for range-trading strategies like selling straddles/strangles. Breakout traders may wait for a move outside this range.', check: d => Math.abs(d.benchmarks?.['Nifty 50']?.changePercent) < 0.3 },
    { name: 'Sensex Strong Momentum', type: 'opportunity', region: 'India', desc: 'The BSE Sensex is up more than 1%, typically driven by large-cap stock performance.', action: 'Bullish signal for blue-chip Indian stocks. Look for strength in the largest companies by market cap.', check: d => d.benchmarks?.Sensex?.changePercent > 1.0 },
    { name: 'Sensex Under Pressure', type: 'critical', region: 'India', desc: 'The BSE Sensex is down more than 1%, indicating weakness in India\'s largest companies.', action: 'Bearish signal for blue-chip stocks. Suggests caution and potential hedging of large-cap portfolios.', check: d => d.benchmarks?.Sensex?.changePercent < -1.0 },
    { name: 'Nifty-Sensex Divergence', type: 'warning', region: 'India', desc: 'The Nifty 50 and Sensex are moving in opposite directions, suggesting a lack of conviction in the market. This could mean a few specific stocks are moving the indices.', action: 'A sign of a confusing market. It is often wise to wait for a clearer trend to emerge before taking large positions.', check: d => (d.benchmarks?.['Nifty 50']?.changePercent * d.benchmarks?.Sensex?.changePercent) < 0 },

    // ===================================
    // India VIX & Volatility Regime Signals (6)
    // ===================================
    { name: 'India VIX - High Fear Zone', type: 'critical', region: 'India', desc: 'The India VIX is above 20, a level indicating high fear and uncertainty in the Indian market. Expect large price swings.', action: 'A time for caution. Reduce position sizes. Good environment for option buyers (long puts/calls) due to high expected volatility.', check: d => d.volatility?.['India VIX']?.price > 20 },
    { name: 'India VIX - Moderate Zone', type: 'info', region: 'India', desc: 'The India VIX is between 15 and 20. This is a normal, healthy volatility level for the Indian market.', action: 'Standard trading conditions. Both trend-following and range-bound strategies can be effective.', check: d => d.volatility?.['India VIX']?.price >= 15 && d.volatility?.['India VIX']?.price <= 20 },
    { name: 'India VIX - Low Fear Zone', type: 'info', region: 'India', desc: 'The India VIX is below 15, signaling a calm and complacent market environment, often associated with a bullish or sideways trend.', action: 'Favorable for option sellers looking to collect premium. Low volatility can persist, but be aware of potential complacency.', check: d => d.volatility?.['India VIX']?.price < 15 },
    { name: 'Bearish Complacency', type: 'warning', region: 'India', desc: 'The Nifty 50 is falling, but the India VIX is also falling. This is a bearish sign, as it suggests traders are not buying protection, leaving the market vulnerable to a steeper decline.', action: 'A signal that the downtrend may continue. Traders may see this as an opportunity to add to short positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.3 && d.volatility?.['India VIX']?.changePercent < 0 },
    { name: 'Bullish Confidence', type: 'opportunity', region: 'India', desc: 'The Nifty 50 is rising, and the India VIX is falling. This is a healthy sign of a confident rally, as traders are not rushing to buy protection.', action: 'Confirms a bullish trend. Supports holding or adding to long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.3 && d.volatility?.['India VIX']?.changePercent < -1.0 },
    { name: 'Active Hedging', type: 'warning', region: 'India', desc: 'The Nifty 50 is falling and the India VIX is rising. This is a classic risk-off signal where traders are actively buying put options to hedge their portfolios.', action: 'Confirms a bearish sentiment for the day. A signal to be defensive and avoid new long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.3 && d.volatility?.['India VIX']?.changePercent > 1.0 },

    // ===================================
    // Inter-Market & Macro Impact Signals (12)
    // ===================================
    { name: 'India vs. Emerging Markets (Outperformance)', type: 'opportunity', region: 'Intermarket', desc: 'The Nifty 50 is outperforming the broader Emerging Markets index (EEM), suggesting India is a favored destination for FII capital within the EM basket.', action: 'A strong case for investing in Indian equities. Traders might consider a pairs trade: long Nifty 50, short EEM.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > d.specialized?.['Emerging Markets']?.changePercent + 0.5 },
    { name: 'India vs. Emerging Markets (Underperformance)', type: 'warning', region: 'Intermarket', desc: 'The Nifty 50 is underperforming the broader Emerging Markets index (EEM), suggesting specific headwinds for India or better opportunities elsewhere.', action: 'Suggests caution for Indian equities. Capital may be rotating to other emerging markets.', check: d => d.specialized?.['Emerging Markets']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.5 },
    { name: 'Oil Price Pain', type: 'warning', region: 'Intermarket', desc: 'Crude Oil prices are rising while the Nifty 50 is falling. As a major oil importer, high oil prices are a negative for India\'s economy and market sentiment.', action: 'Bearish for the overall Indian market. Particularly negative for sectors like Paints, Airlines, and Cement.', check: d => d.commodities?.['Crude Oil']?.changePercent > 1.5 && d.benchmarks?.['Nifty 50']?.changePercent < -0.3 },
    { name: 'Lower Oil Price Boost', type: 'opportunity', region: 'Intermarket', desc: 'Crude Oil prices are falling while the Nifty 50 is rising. Lower oil prices reduce India\'s import bill and act as a tailwind for the economy.', action: 'Bullish for the Indian market. Positive for oil-consuming sectors.', check: d => d.commodities?.['Crude Oil']?.changePercent < -1.5 && d.benchmarks?.['Nifty 50']?.changePercent > 0.3 },
    { name: 'Global Risk-Off Contagion', type: 'critical', region: 'Intermarket', desc: 'The S&P 500 is down sharply, and the Nifty 50 is following it lower. This indicates that negative global sentiment is impacting the Indian market.', action: 'A signal to be defensive. When global markets are in risk-off mode, it\'s difficult for any single market to rally.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -1.0 && d.benchmarks?.['Nifty 50']?.changePercent < -0.75 },
    { name: 'Lagging the Global Rally', type: 'warning', region: 'Intermarket', desc: 'The S&P 500 is rising, but the Nifty 50 is flat or down. This shows a lack of participation from India in a global risk-on move.', action: 'A sign of relative weakness. Suggests that domestic issues might be holding the Indian market back.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.benchmarks?.['Nifty 50']?.changePercent < 0.1 },
    { name: 'Leading Global Markets', type: 'opportunity', region: 'Intermarket', desc: 'The Nifty 50 is rising strongly while the S&P 500 is flat or down, showcasing India\'s strong independent momentum.', action: 'Very bullish for India. A strong signal of domestic-led strength or "alpha".', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.8 && d.benchmarks?.['S&P 500']?.changePercent < 0.1 },
    { name: 'FII Outflow Warning', type: 'critical', region: 'India', desc: 'The Rupee is weakening (USD/INR up) and the Nifty 50 is falling. This combination is a classic indicator of Foreign Institutional Investors selling Indian assets.', action: 'A strong bearish signal. FII selling can lead to sustained downturns. A time for extreme caution.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.25 && d.benchmarks?.['Nifty 50']?.changePercent < -0.5 },
    { name: 'FII Inflow Signal', type: 'opportunity', region: 'India', desc: 'The Rupee is strengthening (USD/INR down) and the Nifty 50 is rising. This combination suggests strong FII buying activity.', action: 'A strong bullish signal. FII buying can fuel powerful rallies. Supports being long the Indian market.', check: d => d.currencies?.['USD/INR']?.changePercent < -0.25 && d.benchmarks?.['Nifty 50']?.changePercent > 0.5 },
    { name: 'Currency vs. Exporter Signal', type: 'info', region: 'India', desc: 'The Rupee is weakening while the Nifty is positive, which may indicate that export-oriented sectors (like IT) are leading the market.', action: 'Investigate if IT and other exporter stocks are outperforming. This could be a sector-specific opportunity.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.2 && d.benchmarks?.['Nifty 50']?.changePercent > 0 },
    { name: 'Indian Domestic Growth Signal', type: 'opportunity', region: 'Intermarket', desc: 'The Indian market (Nifty 50) is showing strength, while the broader Emerging Markets index is weak. This suggests India\'s growth is driven by strong domestic factors, not just global flows.', action: 'Bullish on India. Look for opportunities in companies focused on the domestic Indian economy.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < 0 },
    { name: 'Indian Beta Drag', type: 'warning', region: 'Intermarket', desc: 'The Indian market is being dragged down along with the broader Emerging Markets index, indicating it is suffering from a general risk-off sentiment towards EM.', action: 'Cautious stance. It is difficult for India to rally if the entire EM asset class is under pressure.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.5 && d.specialized?.['Emerging Markets']?.changePercent < -0.5 }
];
    
    let currentView = 'all', autoRefresh = true, refreshInterval, priceChart, newsChart, newsData = [], liveMarketData = {};
    let selectedDate = null;
    let chartState = { symbol: '^GSPC', range: '1d', interval: '5m' };

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
    async function fetchApi(endpoint) { try { const r = await fetch(`/${endpoint}`), d = await r.json(); if (!r.ok) throw new Error(d.error || `Server Error`); return d; } catch (e) { console.error(`Fetch Fail: /${endpoint}`, e); document.getElementById('dashboardGrid').innerHTML = `<div class="error" style="grid-column: 1 / -1;"><strong>Connection Failed.</strong><br>Ensure server is running.</div>`; return null; } }
    async function fetchYahooFinanceData(s, r = '1d', i = '5m') { const d = await fetchApi(`finance-data/${s}?range=${r}&interval=${i}`); if (!d?.chart?.result?.[0]) return null; const { meta, indicators } = d.chart.result[0], { regularMarketPrice, chartPreviousClose } = meta, c = regularMarketPrice - chartPreviousClose, p = (c / chartPreviousClose) * 100; return { price: regularMarketPrice?.toFixed(2) || 'N/A', change: c?.toFixed(2) || 'N/A', changePercent: !isNaN(p) ? p : 0, sentiment: getSentiment(p), historicalData: { timestamps: d.chart.result[0].timestamp, prices: indicators.quote[0].close } }; }
    async function fetchHistoricalDataForDate(s, d) { const ds = new Date(d); ds.setHours(0,0,0,0); const de = new Date(d); de.setHours(23,59,59,999); const p1 = Math.floor(ds.getTime()/1000), p2 = Math.floor(de.getTime()/1000); const data = await fetchApi(`finance-data/${s}?period1=${p1}&period2=${p2}`); if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]) return null; const q = data.chart.result[0].indicators.quote[0]; if (!q.close || q.close.length < 2) return null; const cp = q.close[q.close.length - 1], pc = q.close[q.close.length - 2], c = cp - pc, p = (c / pc) * 100; return { price: cp?.toFixed(2) || 'N/A', change: c?.toFixed(2) || 'N/A', changePercent: !isNaN(p) ? p : 0, sentiment: getSentiment(p) }; }
    async function fetchAllMarketData(d = null) { const data = {}; for (const c in marketDataConfig) data[c] = {}; const p = []; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) { const y = marketDataConfig[c][s].yahooSymbol; const pr = d ? fetchHistoricalDataForDate(y, d).then(r => ({ category: c, symbolKey: s, data: r })) : fetchYahooFinanceData(y).then(r => ({ category: c, symbolKey: s, data: r })); p.push(pr); } const r = await Promise.all(p); r.forEach(i => { if (i.data) data[i.category][i.symbolKey] = i.data; }); return data; }
    async function fetchLiveNews(v) { const r = (v === 'global') ? 'global' : 'india'; const d = await fetchApi(`news?region=${r}`); return d?.items || []; }
    function getSentiment(p) { const c = parseFloat(p); if (c > 1.5) return 'bullish'; if (c < -1.5) return 'bearish'; return 'neutral-status'; }
    function generateExecutiveSummary(d, v) { const da = {}; let t = 'Overall Market'; if (v === 'global') { t = 'Global Markets'; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) if (marketDataConfig[c][s].region === 'Global' && d[c]?.[s]) da[s] = d[c][s]; } else if (v === 'india') { t = 'Indian Markets'; for (const c in marketDataConfig) for (const s in marketDataConfig[c]) if (marketDataConfig[c][s].region === 'India' && d[c]?.[s]) da[s] = d[c][s]; } else { for (const c in d) Object.assign(da, d[c]); } const ad = Object.values(da).filter(Boolean); if (ad.length === 0) return { summary: 'Data unavailable.', status: 'neutral', title: t }; const bc = ad.filter(d => d.sentiment === 'bullish').length, brc = ad.filter(d => d.sentiment === 'bearish').length; let s = 'neutral'; if (bc > brc) s = 'bullish'; if (brc > bc) s = 'bearish'; let sm = `Sentiment for <strong>${t}</strong> is <strong>${s.toUpperCase()}</strong>. `; const km = ad.sort((a,b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0,1); if(km.length > 0 && km[0].changePercent !== 0) { const kmn = Object.keys(da).find(k => da[k] === km[0]); sm += `Key mover: ${kmn} (${km[0].changePercent.toFixed(2)}%).`; } return { summary: sm, status: s, title: t }; }
    
    function renderSignals(d) {
        const sg = document.getElementById('signalsGrid');
        
        // 1. Get all currently active signals
        let activeSignals = signalsConfig.filter(s => {
            try { return s.check(d); } catch { return false; }
        });

        // 2. Filter signals based on the current view (global/india/all)
        if (currentView === 'global') {
            activeSignals = activeSignals.filter(s => s.region === 'Global' || s.region === 'Intermarket');
        } else if (currentView === 'india') {
            activeSignals = activeSignals.filter(s => s.region === 'India' || s.region === 'Intermarket');
        }

        // 3. Sort by priority (critical > warning > opportunity > info)
        const priority = { critical: 1, warning: 2, opportunity: 3, info: 4 };
        activeSignals.sort((a, b) => priority[a.type] - priority[b.type]);

        // 4. Limit to the top 12 most important signals
        const displayedSignals = activeSignals.slice(0, 12);

        if (displayedSignals.length === 0) {
            sg.innerHTML = `<div style="color:var(--text-dim);text-align:center;grid-column:1 / -1;">No significant signals detected for this view.</div>`;
            return;
        }

        // 5. Render the final list of signals, including the action
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
    window.addEventListener('load', () => { populateChartSelector(); renderDashboard(); startAutoRefresh(); });
