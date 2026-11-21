from flask import Flask, render_template
from services.data_service import load_samples
from services.water_quality import assess_water_quality
app = Flask(__name__)

@app.route("/")
def dashboard():
    df = load_samples()

    latest = None
    chart_data = []
    assessment = None  

    if not df.empty:
        df = df.sort_values("sample_timestamp")
        latest_row = df.iloc[-1]

        latest = {
            "sample_id": str(latest_row.get("sample_id", "N/A")),
            "sample_source": str(latest_row.get("sample_source", "Unknown")),
            "temperature": latest_row.get("temperature"),
            "humidity": latest_row.get("humidity"),
            "ph": latest_row.get("ph"),
            "tds": latest_row.get("tds"),
            "turbidity": latest_row.get("turbidity"),
            "dissolved_oxygen": latest_row.get("dissolved_oxygen"),
            "timestamp": str(latest_row.get("sample_timestamp", "N/A"))
        }

        
        assessment = assess_water_quality(latest)

        for _, row in df.tail(20).iterrows():
            chart_data.append({
                "time": str(row.get("sample_timestamp", "")),
                "ph": row.get("ph"),
                "tds": row.get("tds"),
                "turbidity": row.get("turbidity")
            })

    return render_template(
        "dashboard.html",
        latest=latest,
        total_samples=len(df),
        chart_data=chart_data,
        assessment=assessment
    )


@app.route("/monitoring")
def monitoring():
    return render_template("monitoring.html")


@app.route("/analysis")
def analysis():
    df = load_samples()

    samples = []

    if not df.empty:
        df = df.sort_values(
            "sample_timestamp",
            ascending=False
        )

        for _, row in df.iterrows():
            samples.append({
                "sample_id": str(row.get("sample_id", "N/A")),
                "sample_source": str(row.get("sample_source", "Unknown")),
                "timestamp": str(row.get("sample_timestamp", "N/A")),
                "temperature": row.get("temperature"),
                "humidity": row.get("humidity"),
                "ph": row.get("ph"),
                "tds": row.get("tds"),
                "turbidity": row.get("turbidity"),
                "dissolved_oxygen": row.get("dissolved_oxygen")
            })

    return render_template(
        "analysis.html",
        samples=samples
    )


@app.route("/classification")
def classification():
    return render_template("classification.html")

@app.route("/analytics")
def analytics():
    return render_template("analytics.html")

@app.route("/reports")
def reports():
    return render_template("reports.html")


if __name__ == "__main__":
    app.run(debug=True)