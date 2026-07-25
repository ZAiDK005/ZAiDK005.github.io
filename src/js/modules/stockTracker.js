export async function handleStockSearch(tickerSymbol) {
    try {
        console.log(`Fetching fundamental analysis for ${tickerSymbol}...`);
        
        // Fetch the generated fundamental analysis JSON from your local backend pipeline
        const response = await fetch('./stock_fundamental.json');
        if (!response.ok) throw new Error('Failed to load fundamental metrics.');
        
        const stockData = await response.json();
        
        // Render the data dynamically into your UI container
        renderStockAnalysisCard(stockData);
    } catch (error) {
        console.error('Error rendering stock analysis:', error);
    }
}

function renderStockAnalysisCard(data) {
    const container = document.getElementById('stock-analysis-results') || createAnalysisContainer();
    
    // Safely extract properties that start with numbers
    const high52 = data["52_week_high"] ?? 'N/A';
    const low52 = data["52_week_low"] ?? 'N/A';
    
    container.innerHTML = `
        <div class="stock-card-header mb-4 flex justify-between items-center border-b border-slate-700 pb-3">
            <div>
                <h3 class="text-lg font-bold text-teal-400">${data.company_name} (${data.ticker})</h3>
                <span class="text-xs text-slate-400">${data.sector} | ${data.industry}</span>
            </div>
            <a href="https://www.topstockresearch.com/rt/Stock/${data.ticker.replace('.NS', '').replace('.BO', '')}/FundamentalAnalysis" target="_blank" class="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-all">View TopStockResearch <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i></a>
        </div>
        <div class="stock-metrics-grid grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>Current Price</span><strong class="block text-white text-sm mt-1">₹${data.current_price}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>Market Cap</span><strong class="block text-white text-sm mt-1">₹${data.market_cap.toLocaleString()}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>P/E Ratio</span><strong class="block text-white text-sm mt-1">${data.pe_ratio}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>P/B Ratio</span><strong class="block text-white text-sm mt-1">${data.pb_ratio}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>Dividend Yield</span><strong class="block text-emerald-400 text-sm mt-1">${data.dividend_yield}%</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>ROE</span><strong class="block text-white text-sm mt-1">${data.roe}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>Debt to Equity</span><strong class="block text-white text-sm mt-1">${data.debt_to_equity}</strong></div>
            <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50"><span>52W High / Low</span><strong class="block text-white text-xs mt-1">₹${high52} / ₹${low52}</strong></div>
        </div>
    `;
}

function createAnalysisContainer() {
    const div = document.createElement('div');
    div.id = 'stock-analysis-results';
    div.className = 'analysis-results-wrapper mt-6 bg-slate-900/90 p-5 rounded-xl border border-slate-700 shadow-xl';
    
    // Append it right below the stock tracker search box section
    const trackerSection = document.getElementById('stock-tracker');
    trackerSection.appendChild(div);
    return div;
}