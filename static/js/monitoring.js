
const MAX_POINTS = 20;

let updateCount = 0;
let readingHistory = [];
let liveChart = null;

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setBar(id, value, maximum) {
    const element = document.getElementById(id);
    if (!element) return;

    const percentage = Math.max(
        0,
        Math.min(100, (Number(value) / maximum) * 100)
    );

    element.style.width = percentage + "%";
}

function formatValue(value, decimals = 2) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(decimals) : "--";
}

function updateSensorDisplay(reading) {
    setText("phValue", formatValue(reading.ph));
    setText("temperatureValue", formatValue(reading.temperature, 1));
    setText("tdsValue", formatValue(reading.tds, 1));
    setText("turbidityValue", formatValue(reading.turbidity));
    setText("humidityValue", formatValue(reading.humidity, 1));

    setBar("phBar", reading.ph, 14);
    setBar("temperatureBar", reading.temperature, 50);
    setBar("tdsBar", reading.tds, 1000);
    setBar("turbidityBar", reading.turbidity, 20);
    setBar("humidityBar", reading.humidity, 100);

    [
        "phStatus",
        "temperatureStatus",
        "tdsStatus",
        "turbidityStatus",
        "humidityStatus"
    ].forEach(id => setText(id, "RECEIVED"));
}

function initializeChart() {
    const canvas = document.getElementById("liveSensorChart");
    if (!canvas) return;

    liveChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "pH",
                    data: [],
                    borderColor: "#42d3c0",
                    backgroundColor: "rgba(66,211,192,0.08)",
                    yAxisID: "y",
                    tension: 0.35,
                    pointRadius: 2
                },
                {
                    label: "TDS (ppm)",
                    data: [],
                    borderColor: "#729cff",
                    yAxisID: "y1",
                    tension: 0.35,
                    pointRadius: 2
                },
                {
                    label: "Turbidity (NTU)",
                    data: [],
                    borderColor: "#f5ad67",
                    yAxisID: "y2",
                    tension: 0.35,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#a0aec0",
                        usePointStyle: true,
                        boxWidth: 7,
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#8995aa" },
                    grid: { color: "rgba(255,255,255,0.04)" }
                },
                y: {
                    position: "left",
                    title: {
                        display: true,
                        text: "pH",
                        color: "#42d3c0"
                    },
                    ticks: { color: "#8995aa" },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y1: {
                    position: "right",
                    title: {
                        display: true,
                        text: "TDS (ppm)",
                        color: "#729cff"
                    },
                    ticks: { color: "#8995aa" },
                    grid: { drawOnChartArea: false }
                },
                y2: {
                    display: false,
                    position: "right",
                    min: 0
                }
            }
        }
    });
}

function updateChart(reading) {
    if (!liveChart) return;

    const time = new Date().toLocaleTimeString();

    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(Number(reading.ph));
    liveChart.data.datasets[1].data.push(Number(reading.tds));
    liveChart.data.datasets[2].data.push(Number(reading.turbidity));

    while (liveChart.data.labels.length > MAX_POINTS) {
        liveChart.data.labels.shift();

        liveChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    liveChart.update();
}

function updateReadingLog(reading) {
    const time = new Date().toLocaleTimeString();

    readingHistory.unshift({
        time: time,
        ph: formatValue(reading.ph),
        temperature: formatValue(reading.temperature, 1),
        tds: formatValue(reading.tds, 1),
        turbidity: formatValue(reading.turbidity),
        mode: reading.mode || "simulation"
    });

    readingHistory = readingHistory.slice(0, 10);

    const tableBody = document.getElementById("readingTableBody");

    tableBody.innerHTML = readingHistory.map(item => `
        <tr>
            <td>${item.time}</td>
            <td>${item.ph}</td>
            <td>${item.temperature} °C</td>
            <td>${item.tds} ppm</td>
            <td>${item.turbidity} NTU</td>
            <td>SIMULATED</td>
        </tr>
    `).join("");

    setText("logCount", readingHistory.length + " RECORDS");
}

async function fetchLiveReading() {
    try {
        const response = await fetch("/api/live-reading", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server returned " + response.status);
        }

        const reading = await response.json();

        const required = [
            "ph",
            "temperature",
            "tds",
            "turbidity",
            "humidity"
        ];

        const valid = required.every(key =>
            Number.isFinite(Number(reading[key]))
        );

        if (!valid) {
            throw new Error("Invalid sensor data received");
        }

        updateSensorDisplay(reading);
        updateChart(reading);
        updateReadingLog(reading);

        updateCount++;

        setText("updateCount", updateCount);
        setText("lastUpdate", new Date().toLocaleTimeString());
        setText("streamStatus", "ACTIVE");
        setText("connectionMessage", "Receiving simulated readings");

    } catch (error) {
        console.error("Monitoring error:", error);

        setText("streamStatus", "CONNECTION ERROR");
        setText("connectionMessage", "Unable to receive sensor data");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    initializeChart();

    fetchLiveReading();

    // Fetch a new simulated reading every 3 seconds.
    setInterval(fetchLiveReading, 3000);
});
