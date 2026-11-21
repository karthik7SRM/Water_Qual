
const samples = JSON.parse(
    document.getElementById("sample-data").textContent
);

const sampleSelect = document.getElementById("sampleSelect");

const referenceLimits = {
    ph: { min: 6.5, max: 8.5, unit: "" },
    tds: { preferred: 500, permissible: 2000, unit: "mg/L" },
    turbidity: { preferred: 1, permissible: 5, unit: "NTU" }
};

function getStatus(parameter, value) {
    if (value === null || value === undefined || value === "") {
        return { label: "Unavailable", className: "unavailable" };
    }

    value = Number(value);

    if (!Number.isFinite(value)) {
        return { label: "Invalid reading", className: "unavailable" };
    }

    if (parameter === "ph") {
        return value >= 6.5 && value <= 8.5
            ? { label: "Within reference", className: "normal" }
            : { label: "Outside reference", className: "danger" };
    }

    if (parameter === "tds" || parameter === "turbidity") {
        const limits = referenceLimits[parameter];

        if (value <= limits.preferred) {
            return { label: "Preferred", className: "normal" };
        }

        if (value <= limits.permissible) {
            return { label: "Permissible", className: "warning" };
        }

        return { label: "Exceeds permissible", className: "danger" };
    }

    return { label: "Informational", className: "info" };
}

function renderParameter(name, value, parameter) {
    const status = getStatus(parameter, value);

    const displayValue =
        value === null || value === undefined || value === ""
            ? "Unavailable"
            : `${value} ${parameter === "ph" ? "" :
                parameter === "temperature" ? "°C" :
                parameter === "dissolved_oxygen" ? "mg/L" :
                parameter === "tds" ? "mg/L" :
                parameter === "turbidity" ? "NTU" : ""}`;

    return `
        <div class="parameter-card">
            <div class="parameter-card-header">
                <span>${name}</span>
                <span class="status ${status.className}">
                    ${status.label}
                </span>
            </div>

            <h3>${displayValue}</h3>
        </div>
    `;
}

function updateAnalysis() {
    const sample = samples[Number(sampleSelect.value)];

    document.getElementById("selectedSource").textContent =
        `Source: ${sample.sample_source}`;

    document.getElementById("selectedTimestamp").textContent =
        `Timestamp: ${sample.timestamp}`;

    document.getElementById("phValue").textContent =
        sample.ph ?? "--";

    document.getElementById("tdsValue").textContent =
        sample.tds ?? "--";

    document.getElementById("turbidityValue").textContent =
        sample.turbidity ?? "--";

    document.getElementById("temperatureValue").textContent =
        sample.temperature ?? "--";

    const parameters = [
        ["pH Level", sample.ph, "ph"],
        ["Total Dissolved Solids", sample.tds, "tds"],
        ["Turbidity", sample.turbidity, "turbidity"],
        ["Temperature", sample.temperature, "temperature"],
        ["Environmental Humidity", sample.humidity, "humidity"],
        ["Dissolved Oxygen", sample.dissolved_oxygen, "dissolved_oxygen"]
    ];

    document.getElementById("parameterGrid").innerHTML =
        parameters.map(item =>
            renderParameter(item[0], item[1], item[2])
        ).join("");
}

sampleSelect.addEventListener("change", updateAnalysis);

updateAnalysis();
