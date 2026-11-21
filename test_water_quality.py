
from services.water_quality import assess_water_quality

sample = {
    "ph": 7.2,
    "tds": 320,
    "turbidity": 1.8,
    "temperature": 27.5,
    "humidity": 65,
    "dissolved_oxygen": 6.8
}

result = assess_water_quality(sample)

print("Screening Status:", result["screening_status"])
print("Summary:", result["summary"])

for key, parameter in result["parameters"].items():
    print(
        key,
        "| Value:", parameter["value"],
        "| Status:", parameter["status"],
        "| Message:", parameter["message"]
    )

print("\nDisclaimer:", result["disclaimer"])
