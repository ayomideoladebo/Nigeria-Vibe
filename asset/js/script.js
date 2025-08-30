document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const POLYGON_API_KEY = "Up9w6HI3X2RzGKqdIdRLPZVKpPM3FzUE"; // From polygon.io/
  const NEWS_API_KEY = "5f7aa56236b04e03b7e4b3ede0435458"; // From newsapi.org

  // --- ELEMENT REFERENCES ---
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const overlay = document.getElementById("overlay");
  const predictBtn = document.getElementById("predict-btn");
  const loader = document.getElementById("loader");
  const notification = document.getElementById("notification");
  const currencyPairSelect = document.getElementById("currency-pair");
  const liveDataTitle = document.getElementById("live-data-title");
  const currentRateEl = document.getElementById("current-rate");
  const dayHighEl = document.getElementById("day-high");
  const dayLowEl = document.getElementById("day-low");
  const percentChangeEl = document.getElementById("percent-change");
  const predictionOutput = document.getElementById("prediction-output");
  const predictionTextEl = document.getElementById("prediction-text");
  const predictionConfidenceEl = document.getElementById("prediction-confidence");
  const newsFeed = document.getElementById("news-feed");
  const calculateRiskBtn = document.getElementById("calculate-risk-btn");
  const positionSizeResult = document.getElementById("position-size-result");

  // --- STATE MANAGEMENT ---
  let priceChart = null;

  // --- API & DATA FETCHING ---
  async function fetchForexData(pair) {
    const fromCurrency = pair.substring(0, 3);
    const toCurrency = pair.substring(3, 6);
    const url = `https://api.polygon.io/v2/aggs/ticker/C:${fromCurrency}${toCurrency}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      if (!data.results || data.results.length === 0)
        throw new Error("No data for this pair.");

      const prevDay = data.results[0];
      const currentRate = (
        prevDay.c *
        (1 + (Math.random() - 0.5) * 0.005)
      ).toFixed(5);
      const change = currentRate - prevDay.o;
      const percentChange = ((change / prevDay.o) * 100).toFixed(2);

      return {
        currentRate: parseFloat(currentRate),
        dayHigh: prevDay.h,
        dayLow: prevDay.l,
        percentChange: parseFloat(percentChange),
        historical: await fetchHistoricalData(pair),
      };
    } catch (error) {
      showNotification(`Error fetching data: ${error.message}`, true);
      return null;
    }
  }

  async function fetchHistoricalData(pair) {
    const fromCurrency = pair.substring(0, 3);
    const toCurrency = pair.substring(3, 6);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fromDate = twoWeeksAgo.toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];

    const url = `https://api.polygon.io/v2/aggs/ticker/C:${fromCurrency}${toCurrency}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=10&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.results
      ? data.results.map((d) => ({
          close: d.c,
          date: new Date(d.t).toLocaleDateString(),
        }))
      : [];
  }

  async function fetchNews() {
    if (!NEWS_API_KEY || NEWS_API_KEY === "NEWS_API_KEY") {
      newsFeed.innerHTML = "<p>News API Key not configured.</p>";
      return;
    }
    const url = `https://newsapi.org/v2/everything?q=forex&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== "ok") throw new Error(data.message);

      newsFeed.innerHTML = "";
      data.articles.forEach((article) => {
        const newsItem = document.createElement("div");
        newsItem.className = "news-item";
        newsItem.innerHTML = `
                            <a href="${article.url}" target="_blank">${article.title}</a>
                            <p>${article.source.name}</p>
                        `;
        newsFeed.appendChild(newsItem);
      });
    } catch (error) {
      newsFeed.innerHTML = `<p>Could not fetch news: ${error.message}</p>`;
    }
  }

  // --- AI & LOGIC ---
  function generateAIPrediction(historicalData) {
    if (!historicalData || historicalData.length < 5)
      return { prediction: "Hold", confidence: 30 };
    const shortTermPeriod = 3,
      longTermPeriod = 5;
    const recentData = historicalData
      .slice(-longTermPeriod)
      .map((d) => d.close);
    const shortTermSMA =
      recentData.slice(-shortTermPeriod).reduce((a, b) => a + b, 0) /
      shortTermPeriod;
    const longTermSMA = recentData.reduce((a, b) => a + b, 0) / longTermPeriod;
    const lastPrice = recentData[recentData.length - 1];
    const momentum = lastPrice - recentData[0];
    let prediction = "Hold",
      confidence = 50;
    if (shortTermSMA > longTermSMA && momentum > 0) {
      prediction = "Buy";
      confidence = 65 + Math.min(25, (momentum / lastPrice) * 10000);
    } else if (shortTermSMA < longTermSMA && momentum < 0) {
      prediction = "Sell";
      confidence = 65 + Math.min(25, Math.abs(momentum / lastPrice) * 10000);
    } else {
      confidence = 40 + Math.random() * 20;
    }
    return { prediction, confidence: Math.round(confidence) };
  }

  // --- UI UPDATES ---
  function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.backgroundColor = isError
      ? "var(--red)"
      : "var(--green)";
    notification.classList.add("show");
    setTimeout(() => notification.classList.remove("show"), 3000);
  }

  function updateDashboard(data, pair) {
    liveDataTitle.textContent = `Live Data: ${pair.substring(
      0,
      3
    )}/${pair.substring(3, 6)}`;
    currentRateEl.textContent = data.currentRate;
    dayHighEl.textContent = data.dayHigh.toFixed(5);
    dayLowEl.textContent = data.dayLow.toFixed(5);
    percentChangeEl.textContent = `${data.percentChange}%`;
    percentChangeEl.className = "value";
    if (data.percentChange > 0) percentChangeEl.classList.add("up");
    else if (data.percentChange < 0) percentChangeEl.classList.add("down");

    const currentPrediction = generateAIPrediction(data.historical);
    predictionTextEl.textContent = currentPrediction.prediction;
    predictionConfidenceEl.textContent = `Confidence: ${currentPrediction.confidence}%`;
    predictionTextEl.className = currentPrediction.prediction.toLowerCase();

    predictionOutput.classList.remove("visible");
    setTimeout(() => predictionOutput.classList.add("visible"), 100);

    updateChart(data.historical, pair);
  }

  function updateChart(historicalData, pair) {
    const chartCanvas = document.getElementById("price-chart").getContext("2d");
    const labels = historicalData.map((d) => d.date);
    const prices = historicalData.map((d) => d.close);
    const trendColor =
      prices[prices.length - 1] > prices[0]
        ? "rgba(46, 204, 113, 0.5)"
        : "rgba(231, 76, 60, 0.5)";

    if (priceChart) priceChart.destroy();
    priceChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Closing Price",
            data: prices,
            borderColor: trendColor.replace("0.5", "1"),
            backgroundColor: trendColor,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: { color: "white" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(220, 220, 220, 0.1)" },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // --- EVENT HANDLERS ---

  // Mobile menu toggle
  function toggleSidebar() {
    body.classList.toggle("sidebar-open");
  }
  menuToggle.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);

  predictBtn.addEventListener("click", async () => {
    if (!POLYGON_API_KEY || POLYGON_API_KEY === "YOUR_POLYGON_API_KEY") {
      showNotification("Error: Polygon.io API key is not set.", true);
      return;
    }
    const selectedPair = currencyPairSelect.value;
    loader.style.display = "block";
    predictBtn.disabled = true;
    predictionOutput.classList.remove("visible");

    const data = await fetchForexData(selectedPair);
    if (data) {
      updateDashboard(data, selectedPair);
      showNotification(`Prediction generated for ${selectedPair}!`);
    }

    loader.style.display = "none";
    predictBtn.disabled = false;

    // Close sidebar after prediction on mobile
    if (window.innerWidth <= 768) {
      body.classList.remove("sidebar-open");
    }
  });

  calculateRiskBtn.addEventListener("click", () => {
    const balance = parseFloat(
      document.getElementById("account-balance").value
    );
    const riskPercent = parseFloat(
      document.getElementById("risk-percent").value
    );
    const stopLossPips = parseFloat(document.getElementById("stop-loss").value);

    if (isNaN(balance) || isNaN(riskPercent) || isNaN(stopLossPips)) {
      positionSizeResult.textContent = "Invalid input.";
      return;
    }

    const riskAmount = balance * (riskPercent / 100);
    const pipValue = 10; // Assuming standard lot pip value for simplicity
    const positionSize = (riskAmount / (stopLossPips * pipValue)).toFixed(2);
    positionSizeResult.textContent = `Position Size: ${positionSize} lots`;
  });

  // --- INITIALIZATION ---
  function initialize() {
    predictBtn.click();
    fetchNews();
  }

  initialize();
});
