# ParfumPremium — ML Module

Recommendation system pipeline for perfumes and skincare products.

---

## Setup

### 1. Create a virtual environment (recommended)

```bash
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

## Data

Place your product dataset at:

```
ml/data/raw/products.json
```

Expected format — array of product objects:

```json
[
  {
    "name": "Oud Noir",
    "type": "perfume",
    "perfumeProfile": {
      "woody": 0.9,
      "oriental": 0.8,
      "sweet": 0.3,
      "citrus": 0.1,
      "floral": 0.2,
      "spicy": 0.6,
      "powdery": 0.1,
      "fresh": 0.0
    }
  },
  {
    "name": "Rose Face Cream",
    "type": "skincare"
  }
]
```

---

## Running

### Verify data loading

```bash
python train.py
```

Expected output:

```
Loading data...
Perfumes loaded:          42
Skincare products loaded: 18
Done.
```

---

## Project Structure

```
ml/
├── data/
│   ├── raw/            # Source data (products.json goes here)
│   └── processed/      # Transformed datasets (generated)
├── models/             # Saved model weights (generated)
├── src/
│   ├── data_loader.py        # Load and validate products.json
│   ├── feature_engineering.py # Vectorise perfumes, build pair features
│   └── utils.py              # Shared helpers (cosine similarity)
├── train.py            # Entry point
├── requirements.txt
└── README.md
```
