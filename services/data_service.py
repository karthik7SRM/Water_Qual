
import pandas as pd

CSV_PATH = "data/water_samples.csv"

def load_samples():
    try:
        df = pd.read_csv(CSV_PATH)

        df["sample_timestamp"] = pd.to_datetime(
            df["sample_timestamp"],
            errors="coerce"
        )

        return df

    except FileNotFoundError:
        return pd.DataFrame()

def get_latest_sample():
    df = load_samples()

    if df.empty:
        return None

    return df.sort_values(
        "sample_timestamp"
    ).iloc[-1].to_dict()

def get_sample_statistics():
    df = load_samples()

    if df.empty:
        return {}

    columns = [
        "temperature",
        "ph",
        "tds",
        "turbidity",
        "dissolved_oxygen"
    ]

    return df[columns].describe().to_dict()
