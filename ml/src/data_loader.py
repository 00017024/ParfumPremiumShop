import json
import os


DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "products.json")


def load_data(path=DATA_PATH):
    """
    Load and validate product data from a JSON file.

    Validates:
      - Each product has a 'type' field.
      - Products of type 'perfume' have a 'perfumeProfile' field.

    Returns:
      perfumes (list), skincare (list)
    """
    with open(path, "r", encoding="utf-8") as f:
        products = json.load(f)

    perfumes = []
    skincare = []

    for i, product in enumerate(products):
        if "type" not in product:
            raise ValueError(f"Product at index {i} is missing required field: 'type'")

        product_type = product["type"].lower()

        if product_type == "perfume":
            if "perfumeProfile" not in product:
                name = product.get("name", f"index {i}")
                raise ValueError(
                    f"Perfume '{name}' is missing required field: 'perfumeProfile'"
                )
            perfumes.append(product)

        elif product_type == "skincare":
            skincare.append(product)

    return perfumes, skincare
