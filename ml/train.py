import sys
import os
import random
import json

import pandas as pd
from sklearn.linear_model import LinearRegression

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from data_loader import load_data
from feature_engineering import build_perfume_pair_features, build_label

OUTPUT_PATH  = os.path.join(os.path.dirname(__file__), "data", "processed", "perfume_training.csv")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "models", "perfume_model.json")
N_PAIRS      = 3000
RANDOM_SEED  = 42


def generate_pairs(perfumes, n_pairs, seed):
    """
    Randomly sample n_pairs ordered pairs from perfumes.
    A product is never paired with itself.
    """
    random.seed(seed)
    n = len(perfumes)
    if n < 2:
        raise ValueError(f"Need at least 2 perfumes to generate pairs, got {n}.")

    pairs = []
    while len(pairs) < n_pairs:
        i, j = random.sample(range(n), 2)
        pairs.append((perfumes[i], perfumes[j]))

    return pairs


def main():
    # Step 1 — Load data
    print("Loading data...")
    perfumes, skincare = load_data()
    print(f"  Perfumes loaded:          {len(perfumes)}")
    print(f"  Skincare products loaded: {len(skincare)}")

    # Step 2 — Generate pairs
    print(f"\nGenerating {N_PAIRS} pairs...")
    pairs = generate_pairs(perfumes, n_pairs=N_PAIRS, seed=RANDOM_SEED)

    # Step 3 — Build dataset
    print("Building feature vectors and labels...")
    rows = []
    for p1, p2 in pairs:
        features = build_perfume_pair_features(p1, p2)
        label = build_label(p1, p2)
        rows.append(features + [label])

    # Step 4 — Save to CSV
    n_features = len(rows[0]) - 1
    feature_cols = [f"feature_{i}" for i in range(n_features)]
    columns = feature_cols + ["label"]

    df = pd.DataFrame(rows, columns=columns)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"  Dataset saved to: {OUTPUT_PATH}")

    # Step 5 — Summary
    print(f"\n--- Summary ---")
    print(f"  Total pairs generated:  {len(df)}")
    print(f"  Feature vector length:  {n_features}")
    print(f"  Label range:            [{df['label'].min():.4f}, {df['label'].max():.4f}]")

    # Step 6 — Load dataset for training
    print("\nLoading dataset...")
    df_train = pd.read_csv(OUTPUT_PATH)
    X = df_train.iloc[:, :-1].values
    y = df_train.iloc[:, -1].values
    print(f"  Rows: {len(df_train)}  |  Features: {X.shape[1]}")

    # Step 7 — Train model
    print("\nTraining Linear Regression model...")
    model = LinearRegression()
    model.fit(X, y)

    weights = model.coef_.tolist()
    bias    = float(model.intercept_)

    # Step 8 — Save model
    model_data = {"weights": weights, "bias": bias}
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "w") as f:
        json.dump(model_data, f, indent=2)
    print(f"  Model saved to: {MODEL_PATH}")

    # Step 9 — Debug info
    print(f"\n--- Model ---")
    print(f"  Features:       {len(weights)}")
    print(f"  First 5 weights: {[round(w, 6) for w in weights[:5]]}")
    print(f"  Bias:            {round(bias, 6)}")


if __name__ == "__main__":
    main()
