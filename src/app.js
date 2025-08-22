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
    // Note: A `conditionString` has been added to each signal for the tooltip.
    // =================================================================
    // Category: Volatility & Fear Signals
    // =================================================================
    { name: 'Extreme Fear (Panic)', type: 'critical', region: 'Global', desc: 'The VIX is above 30, signaling panic or capitulation in the market.', action: 'High-risk environment. Consider closing risky positions or buying protection (puts).', check: d => d.volatility?.VIX?.price > 30, conditionString: "d.volatility?.VIX?.price > 30" },
    { name: 'High Fear', type: 'critical', region: 'Global', desc: 'The VIX is above 22, signaling significant market fear.', action: 'Reduce long exposure, consider short positions, or buy put options.', check: d => d.volatility?.VIX?.price > 22 && d.volatility?.VIX?.price <= 30, conditionString: "d.volatility?.VIX?.price > 22 && d.volatility?.VIX?.price <= 30" },
    { name: 'Elevated Fear', type: 'warning', region: 'Global', desc: 'The VIX is above 18, indicating higher-than-average market stress.', action: 'Tighten stop-losses on existing long positions.', check: d => d.volatility?.VIX?.price > 18 && d.volatility?.VIX?.price <= 22, conditionString: "d.volatility?.VIX?.price > 18 && d.volatility?.VIX?.price <= 22" },
    { name: 'Market Complacency', type: 'warning', region: 'Global', desc: 'The VIX is below 14, indicating low fear and high investor confidence.', action: 'Consider taking partial profits on long positions.', check: d => d.volatility?.VIX?.price < 14, conditionString: "d.volatility?.VIX?.price < 14" },
    { name: 'Indian Volatility Spike', type: 'critical', region: 'India', desc: d => `India VIX has surged by ${d.volatility?.['India VIX']?.changePercent?.toFixed(1)}%, indicating a sharp increase in expected volatility.`, action: 'Traders may become cautious on Indian equities, reduce leverage.', check: d => d.volatility?.['India VIX']?.changePercent > 10, conditionString: "d.volatility?.['India VIX']?.changePercent > 10" },
    { name: 'Indian Market Calm', type: 'info', region: 'India', desc: 'The India VIX is below 12, suggesting a stable and low-volatility environment.', action: 'Favorable environment for option sellers and trend-following strategies.', check: d => d.volatility?.['India VIX']?.price < 12, conditionString: "d.volatility?.['India VIX']?.price < 12" },
    { name: 'Volatility Crush', type: 'info', region: 'Global', desc: 'The VIX has fallen more than 10% today, often occurring after a major risk event has passed.', action: 'Often bullish for equities. Consider selling put options to collect premium.', check: d => d.volatility?.VIX?.changePercent < -10, conditionString: "d.volatility?.VIX?.changePercent < -10" },
    { name: 'Coordinated Fear', type: 'critical', region: 'Intermarket', desc: 'Both the US VIX and India VIX are rising sharply, indicating widespread global risk aversion.', action: 'A strong signal to reduce overall market exposure globally. Cash or Gold may be preferred.', check: d => d.volatility?.VIX?.changePercent > 5 && d.volatility?.['India VIX']?.changePercent > 5, conditionString: "d.volatility?.VIX?.changePercent > 5 && d.volatility?.['India VIX']?.changePercent > 5" },
    { name: 'Fear Divergence', type: 'info', region: 'Intermarket', desc: 'Fear levels are moving in opposite directions in the US and India, suggesting a regional disconnect in risk perception.', action: 'May present relative value trades (e.g., long the calmer market, short the more volatile one).', check: d => (d.volatility?.VIX?.changePercent * d.volatility?.['India VIX']?.changePercent) < 0, conditionString: "(d.volatility?.VIX?.changePercent * d.volatility?.['India VIX']?.changePercent) < 0" },
    { name: 'Protective Buying', type: 'warning', region: 'Global', desc: 'The S&P 500 is rising, but the VIX is also rising, indicating a lack of trust in the rally.', action: 'Be cautious of a "bull trap." The rally may lack conviction and could reverse.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.3 && d.volatility?.VIX?.changePercent > 0.3, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.3 && d.volatility?.VIX?.changePercent > 0.3" },
    { name: 'Complacency Sell-Off', type: 'warning', region: 'Global', desc: 'The S&P 500 is falling, but the VIX is also falling or flat, suggesting the sell-off has further to go.', action: 'A bearish sign. Opportunity to initiate or add to short positions.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -0.3 && d.volatility?.VIX?.changePercent < 0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent < -0.3 && d.volatility?.VIX?.changePercent < 0" },
    { name: 'Volatility Threshold Breached', type: 'info', region: 'Global', desc: 'The VIX has crossed above the key 20 level, signaling a transition to a high-volatility regime.', action: 'Expect wider trading ranges. Volatility-based strategies may become more attractive.', check: d => d.volatility?.VIX?.price > 20, conditionString: "d.volatility?.VIX?.price > 20" },

    // ===================================
    // Broad Market Equity Signals
    // ===================================
    { name: 'Broad Market Sell-Off', type: 'critical', region: 'Global', desc: 'Major US indices are all down significantly.', action: 'A strong bearish signal. Consider broad market shorts or buying VIX calls.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -0.8 && d.benchmarks?.Nasdaq?.changePercent < -1.0 && d.benchmarks?.['Russell 2000']?.changePercent < -1.0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent < -0.8 && d.benchmarks?.Nasdaq?.changePercent < -1.0 && d.benchmarks?.['Russell 2000']?.changePercent < -1.0" },
    { name: 'Broad Market Rally', type: 'opportunity', region: 'Global', desc: 'Major US indices are all up strongly.', action: 'A strong bullish signal. Consider buying broad market ETFs.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.benchmarks?.Nasdaq?.changePercent > 1.0 && d.benchmarks?.['Russell 2000']?.changePercent > 1.0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.benchmarks?.Nasdaq?.changePercent > 1.0 && d.benchmarks?.['Russell 2000']?.changePercent > 1.0" },
    { name: 'Market Capitulation', type: 'critical', region: 'Global', desc: 'The S&P 500 is down more than 2.0%, a sign of panic selling.', action: 'Contrarian buyers look for these moments to start accumulating positions for a potential bounce.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -2.0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent < -2.0" },
    { name: 'Market Euphoria', type: 'warning', region: 'Global', desc: 'The S&P 500 is up more than 2.0%, a sign of euphoric buying.', action: 'A signal to be cautious. Consider taking profits or tightening stop-losses.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 2.0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 2.0" },
    { name: 'Global Equity Rally', type: 'opportunity', region: 'Intermarket', desc: 'Both the S&P 500 and Emerging Markets are rising together.', action: 'Bullish for global equities. Consider long positions in both US (SPY) and EM (EEM) ETFs.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.specialized?.['Emerging Markets']?.changePercent > 0.8, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.8 && d.specialized?.['Emerging Markets']?.changePercent > 0.8" },
    { name: 'Global Equity Slump', type: 'critical', region: 'Intermarket', desc: 'Both the S&P 500 and Emerging Markets are falling.', action: 'Bearish for global equities. Consider short positions or defensive assets like cash and bonds.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -0.8 && d.specialized?.['Emerging Markets']?.changePercent < -0.8, conditionString: "d.benchmarks?.['S&P 500']?.changePercent < -0.8 && d.specialized?.['Emerging Markets']?.changePercent < -0.8" },
    { name: 'US Market Strength', type: 'info', region: 'Intermarket', desc: 'The S&P 500 is rising while Emerging Markets are falling, showing capital flowing to the US.', action: 'Suggests a relative value trade: long US stocks (SPY) and short EM stocks (EEM).', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < 0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.specialized?.['Emerging Markets']?.changePercent < 0" },
    { name: 'Emerging Market Strength', type: 'opportunity', region: 'Intermarket', desc: 'Emerging Markets are outperforming the S&P 500.', action: 'Bullish for non-US assets. Traders might look for opportunities in EEM.', check: d => d.specialized?.['Emerging Markets']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5, conditionString: "d.specialized?.['Emerging Markets']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5" },
    { name: 'Weak Market Breadth', type: 'warning', region: 'Global', desc: 'The Nasdaq is up but the broader Russell 2000 is down, an unhealthy sign.', action: 'A sign of a fragile rally. Be cautious, as the rally may not be sustainable.', check: d => d.benchmarks?.Nasdaq?.changePercent > 0.5 && d.benchmarks?.['Russell 2000']?.changePercent < 0, conditionString: "d.benchmarks?.Nasdaq?.changePercent > 0.5 && d.benchmarks?.['Russell 2000']?.changePercent < 0" },
    { name: 'Strong Market Breadth', type: 'opportunity', region: 'Global', desc: 'Both the Nasdaq and the Russell 2000 are rising, a sign of a healthy market.', action: 'Confirms bullish sentiment. This supports holding broad market long positions.', check: d => d.benchmarks?.Nasdaq?.changePercent > 0.8 && d.benchmarks?.['Russell 2000']?.changePercent > 0.8, conditionString: "d.benchmarks?.Nasdaq?.changePercent > 0.8 && d.benchmarks?.['Russell 2000']?.changePercent > 0.8" },
    { name: 'S&P Overbought', type: 'warning', region: 'Global', desc: 'The S&P 500 is up over 1.2%, putting it in a technically overbought position.', action: 'Avoid chasing the market higher. Time to tighten stop-losses.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 1.2, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 1.2" },
    { name: 'S&P Oversold', type: 'opportunity', region: 'Global', desc: 'The S&P 500 has sold off over 1.2%, putting it in an oversold condition.', action: 'Contrarian traders may look for signs of a bottom to initiate short-term longs.', check: d => d.benchmarks?.['S&P 500']?.changePercent < -1.2, conditionString: "d.benchmarks?.['S&P 500']?.changePercent < -1.2" },
    { name: 'Global Growth Confidence', type: 'opportunity', region: 'Global', desc: 'Small-cap stocks (Russell 2000) and crude oil are both rising.', action: 'Bullish for cyclical sectors like industrials, materials, and energy.', check: d => d.benchmarks?.['Russell 2000']?.changePercent > 0.8 && d.commodities?.['Crude Oil']?.changePercent > 1.0, conditionString: "d.benchmarks?.['Russell 2000']?.changePercent > 0.8 && d.commodities?.['Crude Oil']?.changePercent > 1.0" },

    // ===================================
    // Sector & Style Signals
    // ===================================
    { name: 'Tech Dominance', type: 'info', region: 'Global', desc: `The Nasdaq is strongly outperforming the S&P 500.`, action: 'Favors long positions in technology stocks (QQQ).', check: d => d.benchmarks?.Nasdaq?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5, conditionString: "d.benchmarks?.Nasdaq?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.5" },
    { name: 'Tech Weakness', type: 'warning', region: 'Global', desc: 'The Nasdaq is significantly underperforming the S&P 500.', action: 'Suggests caution on tech stocks. Reduce exposure to QQQ or look for shorts.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.Nasdaq?.changePercent + 0.5, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.Nasdaq?.changePercent + 0.5" },
    { name: 'Value Over Growth', type: 'info', region: 'Global', desc: 'The S&P 500 is outperforming the Nasdaq.', action: 'Traders may look for opportunities in value-oriented ETFs.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.2 && d.benchmarks?.Nasdaq?.changePercent < d.benchmarks?.['S&P 500']?.changePercent, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.2 && d.benchmarks?.Nasdaq?.changePercent < d.benchmarks?.['S&P 500']?.changePercent" },
    { name: 'Small Cap Euphoria', type: 'warning', region: 'Global', desc: 'Small cap stocks (Russell 2000) are up more than 2.0%.', action: 'A signal to be cautious about market froth. High risk-taking could lead to a sharp reversal.', check: d => d.benchmarks?.['Russell 2000']?.changePercent > 2.0, conditionString: "d.benchmarks?.['Russell 2000']?.changePercent > 2.0" },
    { name: 'Small Cap Panic', type: 'critical', region: 'Global', desc: 'Small cap stocks (Russell 2000) are down more than 2.0%.', action: 'Bearish for the broader economy. A strong signal to adopt a defensive posture.', check: d => d.benchmarks?.['Russell 2000']?.changePercent < -2.0, conditionString: "d.benchmarks?.['Russell 2000']?.changePercent < -2.0" },
    { name: 'Small Caps Lead Higher', type: 'opportunity', region: 'Global', desc: 'Small caps are outperforming large caps (S&P 500).', action: 'Confirms bullish sentiment. Traders may favor small-cap ETFs (IWM).', check: d => d.benchmarks?.['Russell 2000']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.4, conditionString: "d.benchmarks?.['Russell 2000']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.4" },
    { name: 'Small Caps Lag', type: 'warning', region: 'Global', desc: 'Small caps are underperforming large caps (S&P 500).', action: 'A leading indicator of potential market weakness. Caution is advised.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Russell 2000']?.changePercent + 0.4, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Russell 2000']?.changePercent + 0.4" },
    { name: 'Indian Banking Strength', type: 'opportunity', region: 'India', desc: 'The Bank Nifty is strongly outperforming the Nifty 50.', action: 'Bullish for the Indian market. Consider long positions in banking stocks.', check: d => d.specialized?.['Bank Nifty']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.6, conditionString: "d.specialized?.['Bank Nifty']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.6" },
    { name: 'Indian Banking Drag', type: 'warning', region: 'India', desc: 'The Bank Nifty is underperforming the Nifty 50.', action: 'A bearish sign for the Indian market. Avoid banking stocks or consider hedging.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > d.specialized?.['Bank Nifty']?.changePercent + 0.6, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > d.specialized?.['Bank Nifty']?.changePercent + 0.6" },
    { name: 'Indian Financial Stress', type: 'critical', region: 'India', desc: 'The Bank Nifty is down more than 1.5%.', action: 'A strong signal to be cautious or bearish on the entire Indian market.', check: d => d.specialized?.['Bank Nifty']?.changePercent < -1.5, conditionString: "d.specialized?.['Bank Nifty']?.changePercent < -1.5" },
    { name: 'EM vs US Divergence', type: 'info', region: 'Intermarket', desc: 'Emerging Markets and the S&P 500 are moving in opposite directions.', action: 'An opportunity for a pairs trade: long the outperformer and short the underperformer.', check: d => d.specialized?.['Emerging Markets']?.changePercent * d.benchmarks?.['S&P 500']?.changePercent < 0, conditionString: "d.specialized?.['Emerging Markets']?.changePercent * d.benchmarks?.['S&P 500']?.changePercent < 0" },
    { name: 'Tech vs Small Cap Rotation', type: 'info', region: 'Global', desc: 'Nasdaq and Russell 2000 are moving in opposite directions.', action: 'Traders can ride the rotation by favoring the outperforming group.', check: d => d.benchmarks?.Nasdaq?.changePercent * d.benchmarks?.['Russell 2000']?.changePercent < 0, conditionString: "d.benchmarks?.Nasdaq?.changePercent * d.benchmarks?.['Russell 2000']?.changePercent < 0" },

    // ===================================
    // Commodity Signals
    // ===================================
    { name: 'Major Oil Price Move', type: 'critical', region: 'Global', desc: d => `Crude oil has moved by ${d.commodities?.['Crude Oil']?.changePercent?.toFixed(1)}%, impacting inflation and transportation stocks.`, action: 'High oil prices hurt airlines and consumer stocks but benefit energy producers.', check: d => Math.abs(d.commodities?.['Crude Oil']?.changePercent) > 3.0, conditionString: "Math.abs(d.commodities?.['Crude Oil']?.changePercent) > 3.0" },
    { name: 'Gold as Safe Haven', type: 'info', region: 'Global', desc: 'Gold is rising while the S&P 500 is falling, confirming its safe-haven status.', action: 'Traders may increase allocation to gold (GLD) as a hedge.', check: d => d.commodities?.Gold?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < -0.4, conditionString: "d.commodities?.Gold?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < -0.4" },
    { name: 'Gold Losing Luster', type: 'warning', region: 'Global', desc: 'Gold is falling even as the S&P 500 sells off.', action: 'A sign of a liquidity crunch. Cash is king in this environment.', check: d => d.commodities?.Gold?.changePercent < -0.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.5, conditionString: "d.commodities?.Gold?.changePercent < -0.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.5" },
    { name: 'Strong Gold Rally', type: 'opportunity', region: 'Global', desc: 'Gold is up more than 1.2%, a strong move.', action: 'Bullish for gold and gold mining stocks. Consider buying GLD.', check: d => d.commodities?.Gold?.changePercent > 1.2, conditionString: "d.commodities?.Gold?.changePercent > 1.2" },
    { name: 'Oil Plunge (Demand Fear)', type: 'warning', region: 'Global', desc: 'Crude oil has dropped more than 2.5%, signaling falling global demand.', action: 'Bearish for the global economy and energy stocks. Potentially bullish for transportation.', check: d => d.commodities?.['Crude Oil']?.changePercent < -2.5, conditionString: "d.commodities?.['Crude Oil']?.changePercent < -2.5" },
    { name: 'Inflation Hedge Signal', type: 'warning', region: 'Global', desc: 'Gold is rising while bonds are selling off (yields rising).', action: 'A classic stagflation signal. Gold may outperform, while bonds and growth stocks may underperform.', check: d => d.commodities?.Gold?.changePercent > 0.6 && d.bonds?.['US 10Y Yield']?.changePercent > 1.5, conditionString: "d.commodities?.Gold?.changePercent > 0.6 && d.bonds?.['US 10Y Yield']?.changePercent > 1.5" },
    { name: 'Industrial Slowdown?', type: 'warning', region: 'Global', desc: 'Crude oil is falling while stocks are also falling.', action: 'A bearish signal for cyclical stocks. Defensive sectors may outperform.', check: d => d.commodities?.['Crude Oil']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.8, conditionString: "d.commodities?.['Crude Oil']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.8" },
    { name: 'Gold vs Dollar Inverse Correlation', type: 'info', region: 'Global', desc: 'Gold and the US Dollar are moving in opposite directions, as expected.', action: 'This is a normal market state. A falling dollar is typically a tailwind for gold prices.', check: d => d.commodities?.Gold?.changePercent * d.currencies?.DXY?.changePercent < 0, conditionString: "d.commodities?.Gold?.changePercent * d.currencies?.DXY?.changePercent < 0" },
    { name: 'Gold Breaking Correlation', type: 'info', region: 'Global', desc: 'Gold and the US Dollar are rising together, an unusual "flight to safety" event.', action: 'A sign of significant global instability. Reduce risk across the board.', check: d => d.commodities?.Gold?.changePercent > 0.4 && d.currencies?.DXY?.changePercent > 0.4, conditionString: "d.commodities?.Gold?.changePercent > 0.4 && d.currencies?.DXY?.changePercent > 0.4" },
    { name: 'Commodity Super Cycle?', type: 'opportunity', region: 'Global', desc: 'Gold and Oil are positive while the US Dollar is negative.', action: 'Suggests a potential trend in commodities. Consider long positions in commodity ETFs.', check: d => d.commodities?.Gold?.changePercent > 0.5 && d.commodities?.['Crude Oil']?.changePercent > 0.5 && d.currencies?.DXY?.changePercent < -0.3, conditionString: "d.commodities?.Gold?.changePercent > 0.5 && d.commodities?.['Crude Oil']?.changePercent > 0.5 && d.currencies?.DXY?.changePercent < -0.3" },
    { name: 'Oil-Stock Divergence', type: 'warning', region: 'Global', desc: 'Crude oil is rising sharply, but stocks are falling.', action: 'Bearish for the broader market, especially consumer discretionary and industrial sectors.', check: d => d.commodities?.['Crude Oil']?.changePercent > 1.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.3, conditionString: "d.commodities?.['Crude Oil']?.changePercent > 1.5 && d.benchmarks?.['S&P 500']?.changePercent < -0.3" },
    
    // ===================================
    // Currency Signals
    // ===================================
    { name: 'Major Dollar Move', type: 'critical', region: 'Global', desc: d => `The US Dollar Index has moved by over 0.8%, a large move affecting global assets.`, action: 'A strong dollar is typically bearish for commodities and emerging markets.', check: d => Math.abs(d.currencies?.DXY?.changePercent) > 0.8, conditionString: "Math.abs(d.currencies?.DXY?.changePercent) > 0.8" },
    { name: 'Strong Dollar Headwind', type: 'critical', region: 'Global', desc: 'A rising dollar is putting pressure on both Equities and Commodities.', action: 'Bearish for most assets except the dollar itself. A time to be defensive.', check: d => d.currencies?.DXY?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < 0 && d.commodities?.Gold?.changePercent < 0, conditionString: "d.currencies?.DXY?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < 0 && d.commodities?.Gold?.changePercent < 0" },
    { name: 'Weak Dollar Tailwind', type: 'opportunity', region: 'Global', desc: 'A falling dollar is boosting both Equities and Commodities.', action: 'Bullish for most assets, especially commodities and international stocks.', check: d => d.currencies?.DXY?.changePercent < -0.4 && d.benchmarks?.['S&P 500']?.changePercent > 0 && d.commodities?.Gold?.changePercent > 0, conditionString: "d.currencies?.DXY?.changePercent < -0.4 && d.benchmarks?.['S&P 500']?.changePercent > 0 && d.commodities?.Gold?.changePercent > 0" },
    { name: 'Rupee Under Pressure', type: 'warning', region: 'India', desc: `The Indian Rupee has weakened by more than 0.3% against the USD.`, action: 'Negative for the Indian market. Can signal FII outflows.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.3, conditionString: "d.currencies?.['USD/INR']?.changePercent > 0.3" },
    { name: 'Rupee Strengthening', type: 'opportunity', region: 'India', desc: 'The Indian Rupee is strengthening against the USD by more than 0.3%.', action: 'Positive for the Indian market, especially for companies with high import costs.', check: d => d.currencies?.['USD/INR']?.changePercent < -0.3, conditionString: "d.currencies?.['USD/INR']?.changePercent < -0.3" },
    { name: 'EM Currency Stress', type: 'warning', region: 'Intermarket', desc: 'The US Dollar is rising while Emerging Market stocks are falling.', action: 'Bearish for EM assets, including India. Suggests avoiding or reducing exposure to EEM.', check: d => d.currencies?.DXY?.changePercent > 0.4 && d.specialized?.['Emerging Markets']?.changePercent < -0.4, conditionString: "d.currencies?.DXY?.changePercent > 0.4 && d.specialized?.['Emerging Markets']?.changePercent < -0.4" },
    { name: 'Indian IT Sector Boost', type: 'info', region: 'India', desc: 'A weakening Rupee is generally positive for Indian IT companies.', action: 'This macro condition can support a rally in Indian IT stocks.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.2, conditionString: "d.currencies?.['USD/INR']?.changePercent > 0.2" },
    { name: 'Risk-On Currency Flow', type: 'opportunity', region: 'Global', desc: 'The US Dollar is weakening while high-risk small-cap stocks are rallying.', action: 'Confirms a "risk-on" environment. Bullish for equities.', check: d => d.currencies?.DXY?.changePercent < -0.4 && d.benchmarks?.['Russell 2000']?.changePercent > 0.8, conditionString: "d.currencies?.DXY?.changePercent < -0.4 && d.benchmarks?.['Russell 2000']?.changePercent > 0.8" },
    { name: 'Risk-Off Currency Flow', type: 'critical', region: 'Global', desc: 'The US Dollar is strengthening while high-risk small-cap stocks are selling off.', action: 'Confirms a "risk-off" environment. Bearish for equities; favors holding US Dollars.', check: d => d.currencies?.DXY?.changePercent > 0.4 && d.benchmarks?.['Russell 2000']?.changePercent < -0.8, conditionString: "d.currencies?.DXY?.changePercent > 0.4 && d.benchmarks?.['Russell 2000']?.changePercent < -0.8" },
    { name: 'Indian Importer Alert', type: 'warning', region: 'India', desc: 'A weakening Rupee can increase costs for Indian companies that rely on imports.', action: 'Potentially bearish for stocks in sectors with high import costs.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.2 && d.commodities?.['Crude Oil']?.changePercent > 0, conditionString: "d.currencies?.['USD/INR']?.changePercent > 0.2 && d.commodities?.['Crude Oil']?.changePercent > 0" },
    
    // ===================================
    // Bond & Credit Market Signals
    // ===================================
    { name: 'Major Bond Sell-Off', type: 'critical', region: 'Global', desc: d => `The 10-Year Treasury Yield has jumped by more than 4%.`, action: 'Bearish for long duration assets like growth and tech stocks.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 4.0, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent > 4.0" },
    { name: 'Major Bond Rally', type: 'opportunity', region: 'Global', desc: 'The 10-Year Treasury Yield is falling by more than 4%.', action: 'Bullish for bonds and growth stocks. Can signal impending economic weakness.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -4.0, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent < -4.0" },
    { name: 'Yields Up, Stocks Up (Reflation)', type: 'info', region: 'Global', desc: 'Both bond yields and stocks are rising, a sign of a pro-growth environment.', action: 'Bullish for cyclical and value stocks. Suggests the economy can handle higher rates.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 1.0 && d.benchmarks?.['S&P 500']?.changePercent > 0.5, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent > 1.0 && d.benchmarks?.['S&P 500']?.changePercent > 0.5" },
    { name: 'Yields Up, Stocks Down (Stagflation Fear)', type: 'warning', region: 'Global', desc: 'Bond yields are rising but stocks are falling.', action: 'A difficult environment. Bearish for most stocks, especially growth.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.3, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent > 1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.3" },
    { name: 'Yields Down, Stocks Up (Goldilocks)', type: 'opportunity', region: 'Global', desc: 'Bond yields are falling and stocks are rising, a very bullish scenario.', action: 'The best environment for stocks, especially growth and technology.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent > 0.5, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent > 0.5" },
    { name: 'Yields Down, Stocks Down (Recession Fear)', type: 'critical', region: 'Global', desc: 'Both bond yields and stocks are falling, a strong signal of recession fears.', action: 'Highly defensive signal. Favors holding government bonds and cash.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.5, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent < -1.0 && d.benchmarks?.['S&P 500']?.changePercent < -0.5" },
    { name: 'Credit Market Stress', type: 'critical', region: 'Global', desc: 'High-yield ("junk") bonds are selling off sharply.', action: 'A leading indicator of economic trouble. Strongly bearish for the stock market.', check: d => d.bonds?.['High-Yield Bonds']?.changePercent < -0.8, conditionString: "d.bonds?.['High-Yield Bonds']?.changePercent < -0.8" },
    { name: 'Credit Market Rally', type: 'opportunity', region: 'Global', desc: 'High-yield bonds are rallying, signaling investor confidence.', action: 'A leading indicator of economic strength. Bullish for the stock market.', check: d => d.bonds?.['High-Yield Bonds']?.changePercent > 0.6, conditionString: "d.bonds?.['High-Yield Bonds']?.changePercent > 0.6" },
    { name: 'Growth Stock Warning', type: 'warning', region: 'Global', desc: 'Treasury yields are rising sharply, negatively impacting tech stocks.', action: 'A signal to be cautious with tech stocks (Nasdaq). May favor a rotation to value.', check: d => d.bonds?.['US 10Y Yield']?.changePercent > 2.0 && d.benchmarks?.Nasdaq?.changePercent < 0, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent > 2.0 && d.benchmarks?.Nasdaq?.changePercent < 0" },
    { name: 'Defensive Rotation', type: 'info', region: 'Global', desc: 'Bonds are rallying while high-risk small caps are selling off.', action: 'Confirms a risk-off sentiment. Reduce equity exposure and increase bond allocation.', check: d => d.bonds?.['US 10Y Yield']?.changePercent < -0.8 && d.benchmarks?.['Russell 2000']?.changePercent < -0.8, conditionString: "d.bonds?.['US 10Y Yield']?.changePercent < -0.8 && d.benchmarks?.['Russell 2000']?.changePercent < -0.8" },
    { name: 'High Yield Divergence (Bearish)', type: 'warning', region: 'Global', desc: 'The S&P 500 is rising but high-yield bonds are falling.', action: 'A strong warning sign that the equity rally may be deceptive and could fail.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.4 && d.bonds?.['High-Yield Bonds']?.changePercent < 0, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.4 && d.bonds?.['High-Yield Bonds']?.changePercent < 0" },
    { name: 'High Yield Confirmation (Bullish)', type: 'opportunity', region: 'Global', desc: 'Both the S&P 500 and high-yield bonds are rising together.', action: 'A strong confirmation of a healthy rally. Supports holding or adding to long equity positions.', check: d => d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.bonds?.['High-Yield Bonds']?.changePercent > 0.3, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > 0.5 && d.bonds?.['High-Yield Bonds']?.changePercent > 0.3" },

    // ===================================
    // India-Specific Signals
    // ===================================
    { name: 'India Outperformance', type: 'opportunity', region: 'Intermarket', desc: d => `The Nifty 50 is outperforming the S&P 500 by ${(d.benchmarks?.['Nifty 50']?.changePercent - d.benchmarks?.['S&P 500']?.changePercent).toFixed(1)}%.`, action: 'Suggests favoring Indian equities over US equities.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.4, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > d.benchmarks?.['S&P 500']?.changePercent + 0.4" },
    { name: 'India Underperformance', type: 'warning', region: 'Intermarket', desc: 'The Nifty 50 is significantly underperforming global markets.', action: 'Suggests reducing exposure to Indian equities.', check: d => d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.5, conditionString: "d.benchmarks?.['S&P 500']?.changePercent > d.benchmarks?.['Nifty 50']?.changePercent + 0.5" },
    { name: 'Indian Market Sell-Off', type: 'critical', region: 'India', desc: 'The Nifty 50 is down more than 1.0%.', action: 'A clear bearish signal for the day. Traders may liquidate long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -1.0, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent < -1.0" },
    { name: 'Indian Market Breakout', type: 'opportunity', region: 'India', desc: 'The Nifty 50 is up more than 1.0%.', action: 'A strong bullish signal. Traders may initiate long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 1.0, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > 1.0" },
    { name: 'Indian Decoupling (Bullish)', type: 'opportunity', region: 'Intermarket', desc: 'The Indian market is rising even as major global markets are falling.', action: 'Very bullish for India. Suggests Indian equities are a good place to be relative to the world.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < -0.1, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > 0.4 && d.benchmarks?.['S&P 500']?.changePercent < -0.1" },
    { name: 'Indian Decoupling (Bearish)', type: 'warning', region: 'Intermarket', desc: 'The Indian market is falling even as global markets are rising.', action: 'A signal to be cautious specifically on Indian assets.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.4 && d.benchmarks?.['S&P 500']?.changePercent > 0.1, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent < -0.4 && d.benchmarks?.['S&P 500']?.changePercent > 0.1" },
    { name: 'Broad Indian Rally', type: 'opportunity', region: 'India', desc: 'Both the Nifty 50 and Bank Nifty are rising strongly.', action: 'Confirms a healthy rally in the Indian market. Supports holding long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.8 && d.specialized?.['Bank Nifty']?.changePercent > 1.0, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > 0.8 && d.specialized?.['Bank Nifty']?.changePercent > 1.0" },
    { name: 'EM Outflow Risk for India', type: 'warning', region: 'Intermarket', desc: 'A rising dollar and falling Emerging Market Index can signal FIIs are pulling money out.', action: 'A leading indicator for potential FII selling in the Indian market. Caution is advised.', check: d => d.currencies?.DXY?.changePercent > 0.4 && d.specialized?.['Emerging Markets']?.changePercent < -0.5, conditionString: "d.currencies?.DXY?.changePercent > 0.4 && d.specialized?.['Emerging Markets']?.changePercent < -0.5" },
    { name: 'Nifty Range-Bound Day', type: 'info', region: 'India', desc: 'The Nifty 50 is trading in a narrow range (less than +/- 0.3%).', action: 'A signal for range-trading strategies like selling straddles/strangles.', check: d => Math.abs(d.benchmarks?.['Nifty 50']?.changePercent) < 0.3, conditionString: "Math.abs(d.benchmarks?.['Nifty 50']?.changePercent) < 0.3" },
    { name: 'Nifty-Sensex Divergence', type: 'warning', region: 'India', desc: 'The Nifty 50 and Sensex are moving in opposite directions.', action: 'A sign of a confusing market. Wait for a clearer trend to emerge.', check: d => (d.benchmarks?.['Nifty 50']?.changePercent * d.benchmarks?.Sensex?.changePercent) < 0, conditionString: "(d.benchmarks?.['Nifty 50']?.changePercent * d.benchmarks?.Sensex?.changePercent) < 0" },
    { name: 'India VIX - High Fear Zone', type: 'critical', region: 'India', desc: 'The India VIX is above 20, indicating high fear and uncertainty.', action: 'A time for caution. Reduce position sizes. Good environment for option buyers.', check: d => d.volatility?.['India VIX']?.price > 20, conditionString: "d.volatility?.['India VIX']?.price > 20" },
    { name: 'Bearish Complacency (India)', type: 'warning', region: 'India', desc: 'The Nifty 50 is falling, but the India VIX is also falling.', action: 'A signal that the downtrend may continue. Opportunity to add to short positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent < -0.3 && d.volatility?.['India VIX']?.changePercent < 0, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent < -0.3 && d.volatility?.['India VIX']?.changePercent < 0" },
    { name: 'Bullish Confidence (India)', type: 'opportunity', region: 'India', desc: 'The Nifty 50 is rising, and the India VIX is falling.', action: 'Confirms a bullish trend. Supports holding or adding to long positions.', check: d => d.benchmarks?.['Nifty 50']?.changePercent > 0.3 && d.volatility?.['India VIX']?.changePercent < -1.0, conditionString: "d.benchmarks?.['Nifty 50']?.changePercent > 0.3 && d.volatility?.['India VIX']?.changePercent < -1.0" },
    { name: 'FII Outflow Warning', type: 'critical', region: 'India', desc: 'The Rupee is weakening and the Nifty 50 is falling.', action: 'A strong bearish signal. FII selling can lead to sustained downturns.', check: d => d.currencies?.['USD/INR']?.changePercent > 0.2 && d.benchmarks?.['Nifty 50']?.changePercent < -0.4, conditionString: "d.currencies?.['USD/INR']?.changePercent > 0.2 && d.benchmarks?.['Nifty 50']?.changePercent < -0.4" },
    { name: 'FII Inflow Signal', type: 'opportunity', region: 'India', desc: 'The Rupee is strengthening and the Nifty 50 is rising.', action: 'A strong bullish signal. FII buying can fuel powerful rallies.', check: d => d.currencies?.['USD/INR']?.changePercent < -0.2 && d.benchmarks?.['Nifty 50']?.changePercent > 0.4, conditionString: "d.currencies?.['USD/INR']?.changePercent < -0.2 && d.benchmarks?.['Nifty 50']?.changePercent > 0.4" }
];
      
  let currentView = 'all', autoRefresh = true, refreshInterval, priceChart, newsChart, newsData = [], liveMarketData = {};
  let selectedDate = null;
  let chartState = { symbol: '^GSPC', range: '1d', interval: '5m' };
  
  // --- NEW TOOLTIP HELPER FUNCTION ---
  function updateTooltip(signal) {
    const tooltip = document.getElementById('signal-tooltip');
    if (!signal) return;

    // Use the new, human-readable conditionString property directly
    const conditionString = signal.conditionString || 'Condition not available.';
    const actionText = signal.action || 'No specific action recommended.';
    const descText = typeof signal.desc === 'function' ? 'Dynamic description based on market data.' : signal.desc;

    tooltip.innerHTML = `
        <h4>${signal.name}</h4>
        <p>${descText}</p>
        <div class="tooltip-section-title">Action</div>
        <p>${actionText}</p>
        <div class="tooltip-section-title">Trigger Condition</div>
        <code>${conditionString}</code>
    `;
}
  
  // --- MODIFIED EVENT LISTENERS ---
  function initializeEventListeners() {
      // Control Buttons
      document.getElementById('btn-all').addEventListener('click', (e) => toggleView(e.currentTarget, 'all'));
      document.getElementById('btn-global').addEventListener('click', (e) => toggleView(e.currentTarget, 'global'));
      document.getElementById('btn-india').addEventListener('click', (e) => toggleView(e.currentTarget, 'india'));
      document.getElementById('btn-library').addEventListener('click', (e) => toggleView(e.currentTarget, 'library'));
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
  
      // --- NEW: Event delegation for signal library tooltips ---
      const libraryContainer = document.getElementById('signalsLibrary');
      const tooltip = document.getElementById('signal-tooltip');
  
      libraryContainer.addEventListener('mouseover', (event) => {
          const card = event.target.closest('.library-card');
          if (card && card.dataset.signalIndex) {
              const signalIndex = parseInt(card.dataset.signalIndex, 10);
              const signal = signalsConfig[signalIndex];
              updateTooltip(signal);
              tooltip.style.display = 'block';
          }
      });
  
      libraryContainer.addEventListener('mouseout', (event) => {
          const card = event.target.closest('.library-card');
          if (card) {
              tooltip.style.display = 'none';
          }
      });
  
      libraryContainer.addEventListener('mousemove', (event) => {
          // Position tooltip relative to the cursor
          tooltip.style.left = event.pageX + 20 + 'px';
          tooltip.style.top = event.pageY + 20 + 'px';
      });
  }
  
  function toggleView(btn, view) {
      currentView = view;
      document.querySelectorAll('.controls .control-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
  
      const signalsGrid = document.getElementById('signalsGrid');
      const signalsLibrary = document.getElementById('signalsLibrary');
      const matrixTitle = document.getElementById('matrix-title');
      const dashboardGrid = document.getElementById('dashboardGrid');
  
      if (view === 'library') {
          signalsGrid.style.display = 'none';
          signalsLibrary.style.display = 'grid';
          matrixTitle.style.display = 'none';
          dashboardGrid.style.display = 'none';
          renderSignalLibrary();
      } else {
          signalsGrid.style.display = 'grid';
          signalsLibrary.style.display = 'none';
          matrixTitle.style.display = 'block';
          dashboardGrid.style.display = 'grid';
          handleTimelineScrub(document.getElementById('timeline-scrubber').value);
      }
  }
  
  // --- MODIFIED: Renders library with data-attributes for tooltip ---
  function renderSignalLibrary() {
      const libraryContainer = document.getElementById('signalsLibrary');
      if (Object.keys(liveMarketData).length === 0) {
          libraryContainer.innerHTML = '<div class="loading">Loading market data to check signals...</div>';
          return;
      }
      
      const activeSignalChecks = signalsConfig.map(s => {
          try { return s.check(liveMarketData); } catch { return false; }
      });
  
      libraryContainer.innerHTML = signalsConfig.map((signal, index) => {
          const isActive = activeSignalChecks[index];
          const desc = typeof signal.desc === 'function' ? 'Dynamic description based on market data.' : signal.desc;
  
          return `
              <div class="library-card ${isActive ? 'active-card' : ''}" data-signal-index="${index}">
                  <span class="status-dot ${isActive ? 'active' : ''}" title="${isActive ? 'Active' : 'Inactive'}"></span>
                  <div class="signal-title">${signal.name}</div>
                  <div class="signal-desc">${desc}</div>
              </div>
          `;
      }).join('');
  }
  
  // --- PASTE ALL OTHER UNCHANGED JS FUNCTIONS HERE ---
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