from utils import cosine_similarity


SCENT_NOTES = ["woody", "oriental", "sweet", "citrus", "floral", "spicy", "powdery", "fresh"]

# Accord values >= this threshold count as "strong" for label bonuses (scale: 0–9)
STRONG_ACCORD_THRESHOLD = 7


def perfume_to_vector(product):
    """
    Convert a perfume product dict to a fixed-length feature vector.

    Reads values from product['perfumeProfile'] for each scent note.
    Missing notes default to 0.0.

    Returns:
      list of 8 floats in the order defined by SCENT_NOTES.
    """
    profile = product.get("perfumeProfile", {})
    return [float(profile.get(note, 0.0)) for note in SCENT_NOTES]


def build_perfume_pair_features(p1, p2):
    """
    Build a combined feature vector for a pair of perfumes.

    Computes:
      - Element-wise product of their vectors
      - Absolute element-wise difference
      - Cosine similarity (scalar, appended as last element)

    Returns:
      Combined feature vector of length 2 * len(SCENT_NOTES) + 1
    """
    v1 = perfume_to_vector(p1)
    v2 = perfume_to_vector(p2)

    elementwise_product = [a * b for a, b in zip(v1, v2)]
    absolute_difference = [abs(a - b) for a, b in zip(v1, v2)]
    similarity = cosine_similarity(v1, v2)

    return elementwise_product + absolute_difference + [similarity]


def build_label(p1, p2):
    """
    Compute a similarity label for a pair of perfumes.

    Scoring:
      base score  = cosine similarity of their scent vectors
      +0.1        if both products share the same category
      +0.1        per accord where both have a value >= STRONG_ACCORD_THRESHOLD
                  (capped at +0.2 from accords)

    Result is clamped to [0.0, 1.0].

    Returns:
      float label in [0.0, 1.0]
    """
    v1 = perfume_to_vector(p1)
    v2 = perfume_to_vector(p2)

    score = cosine_similarity(v1, v2)

    # Category bonus
    if p1.get("category") and p1.get("category") == p2.get("category"):
        score += 0.1

    # Shared strong-accord bonus (max +0.2)
    profile1 = p1.get("perfumeProfile", {})
    profile2 = p2.get("perfumeProfile", {})
    accord_bonus = 0.0
    for note in SCENT_NOTES:
        if (
            float(profile1.get(note, 0.0)) >= STRONG_ACCORD_THRESHOLD
            and float(profile2.get(note, 0.0)) >= STRONG_ACCORD_THRESHOLD
        ):
            accord_bonus += 0.1
            if accord_bonus >= 0.2:
                break
    score += accord_bonus

    return min(score, 1.0)
