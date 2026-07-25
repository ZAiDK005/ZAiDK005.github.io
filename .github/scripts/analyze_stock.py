import json
import sys
import yfinance as yf

def fetch_stock_fundamentals(ticker_symbol):
    formatted_ticker = ticker_symbol.upper().strip()
    
    # List of ticker variations to try if the first one fails
    tickers_to_try = [formatted_ticker]
    if not formatted_ticker.endswith(('.NS', '.BO', '.US')):
        tickers_to_try.insert(0, formatted_ticker + ".NS")
        tickers_to_try.append(formatted_ticker + ".BO")

    info = {}
    successful_ticker = formatted_ticker

    for t in tickers_to_try:
        try:
            stock = yf.Ticker(t)
            temp_info = stock.info
            # Check if we got valid price data back
            if temp_info.get("currentPrice", temp_info.get("regularMarketPrice", 0)) > 0:
                info = temp_info
                successful_ticker = t
                break
        except Exception:
            continue

    # Fallback if no smart lookup worked, just use the raw ticker
    if not info:
        try:
            stock = yf.Ticker(formatted_ticker)
            info = stock.info
        except Exception as e:
            print(f"Error fetching data for {ticker_symbol}: {e}")
            return None

    analysis_data = {
        "ticker": successful_ticker,
        "company_name": info.get("longName", ticker_symbol),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "market_cap": info.get("marketCap", 0),
        "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
        "pe_ratio": info.get("trailingPE", "N/A"),
        "pb_ratio": info.get("priceToBook", "N/A"),
        "dividend_yield": info.get("dividendYield", 0),
        "roce": info.get("returnOnCapitalEmployed", "N/A"),
        "roe": info.get("returnOnEquity", "N/A"),
        "debt_to_equity": info.get("debtToEquity", "N/A"),
        "book_value": info.get("bookValue", "N/A"),
        "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
        "52_week_low": info.get("fiftyTwoWeekLow", "N/A")
    }

    return analysis_data

def main():
    ticker = sys.argv[1] if len(sys.argv) > 1 else "ITC"
    print(f"Analyzing fundamental metrics for {ticker}...")
    
    data = fetch_stock_fundamentals(ticker)
    if data:
        output_file = "stock_fundamental.json"
        with open(output_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Analysis complete. Saved to {output_file}")
        print(json.dumps(data, indent=2))
    else:
        print("Failed to retrieve stock fundamentals.")

if __name__ == "__main__":
    main()