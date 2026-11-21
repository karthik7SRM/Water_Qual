
import math


REFERENCE_LIMITS = {
    "ph": {
        "minimum": 6.5,
        "maximum": 8.5,
        "unit": "pH",
        "name": "pH"
    },
    "tds": {
        "preferred_maximum": 500,
        "permissible_maximum": 2000,
        "unit": "mg/L",
        "name": "Total Dissolved Solids"
    },
    "turbidity": {
        "preferred_maximum": 1,
        "permissible_maximum": 5,
        "unit": "NTU",
        "name": "Turbidity"
    }
}

VALID_INPUT_RANGES = {
    "ph": (0, 14),
    "temperature": (-5, 100),
    "humidity": (0, 100),
    "tds": (0, 100000),
    "turbidity": (0, 10000),
    "dissolved_oxygen": (0, 30)
}



def validate_reading(reading):
    """Validate incoming sensor readings."""

    errors = []
    cleaned = {}

    for parameter, limits in VALID_INPUT_RANGES.items():
        value = reading.get(parameter)

        if value is None or (
            isinstance(value, str) and not value.strip()
        ):
            cleaned[parameter] = None
            continue

        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            errors.append(f"{parameter} must be numeric.")
            cleaned[parameter] = None
            continue

        if not math.isfinite(numeric_value):
            cleaned[parameter] = None
            if parameter in ("ph", "tds", "turbidity"):
                errors.append(f"{parameter} must be a finite number.")
            continue

        minimum, maximum = limits

        if not minimum <= numeric_value <= maximum:
            errors.append(
                f"{parameter} must be between {minimum} and {maximum}."
            )
            cleaned[parameter] = None
            continue

        cleaned[parameter] = numeric_value

    for required in ("ph", "tds", "turbidity"):
        if cleaned.get(required) is None:
            if not any(
                f"Missing required parameter: {required}." == error
                for error in errors
            ):
                errors.append(f"Missing required parameter: {required}.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "values": cleaned
    }


def assess_parameter(parameter, value):
    """Assess one parameter against its configured reference values."""

    if value is None:
        return {
            "name": REFERENCE_LIMITS.get(
                parameter, {}
            ).get("name", parameter),
            "value": None,
            "unit": REFERENCE_LIMITS.get(
                parameter, {}
            ).get("unit", ""),
            "status": "unavailable",
            "message": "No reading available."
        }

    if parameter == "ph":
        limits = REFERENCE_LIMITS["ph"]

        if limits["minimum"] <= value <= limits["maximum"]:
            status = "within_reference"
            message = "Within the configured pH reference range."
        else:
            status = "outside_reference"
            message = "Outside the configured pH reference range."

    elif parameter in ("tds", "turbidity"):
        limits = REFERENCE_LIMITS[parameter]

        if value <= limits["preferred_maximum"]:
            status = "preferred"
            message = "Within the preferred reference level."
        elif value <= limits["permissible_maximum"]:
            status = "permissible"
            message = "Above the preferred level but within the configured permissible limit."
        else:
            status = "exceeds_permissible"
            message = "Exceeds the configured permissible limit."

    else:
        return {
            "name": parameter.replace("_", " ").title(),
            "value": value,
            "unit": "mg/L" if parameter == "dissolved_oxygen" else "°C",
            "status": "informational",
            "message": "Informational reading; not used in this screening result."
        }

    return {
        "name": REFERENCE_LIMITS[parameter]["name"],
        "value": value,
        "unit": REFERENCE_LIMITS[parameter]["unit"],
        "status": status,
        "message": message
    }


def assess_water_quality(reading):
    """Validate and produce a transparent parameter-level screening result."""

    validation = validate_reading(reading)

    if not validation["valid"]:
        return {
            "valid": False,
            "screening_status": "invalid_input",
            "summary": "Reading could not be assessed.",
            "errors": validation["errors"],
            "parameters": {}
        }

    values = validation["values"]

    parameters = {
        "ph": assess_parameter("ph", values["ph"]),
        "tds": assess_parameter("tds", values["tds"]),
        "turbidity": assess_parameter("turbidity", values["turbidity"]),
        "temperature": assess_parameter("temperature", values["temperature"]),
        "dissolved_oxygen": assess_parameter(
            "dissolved_oxygen", values["dissolved_oxygen"]
        )
    }

    statuses = [
        parameters[key]["status"]
        for key in ("ph", "tds", "turbidity")
    ]

    if "exceeds_permissible" in statuses:
        screening_status = "action_required"
        summary = "One or more parameters exceed configured permissible limits."
    elif "outside_reference" in statuses:
        screening_status = "outside_reference_range"
        summary = "One or more parameters are outside configured reference ranges."
    elif "permissible" in statuses:
        screening_status = "within_relaxed_limits"
        summary = "Some parameters exceed preferred levels but remain within configured permissible limits."
    else:
        screening_status = "within_preferred_limits"
        summary = "All assessed parameters are within configured preferred limits."

    return {
        "valid": True,
        "screening_status": screening_status,
        "summary": summary,
        "errors": [],
        "parameters": parameters,
        "disclaimer": (
            "This is a sensor-based screening result, not a laboratory "
            "test or drinking-water safety certification."
        )
    }
