import { useEffect, useState } from "react";
import API from "../api";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get("/products");
        console.log("API response:", data);
        setProducts(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-gold p-6">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-gold">Parfum Premium</h1>
        <p className="mt-4 text-gray-300 max-w-xl mx-auto">
          At Parfum Premium, we bring you luxury fragrances that embody sophistication and elegance.
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
          >
            <img
              src={product.imageUrl || "https://via.placeholder.com/150"}
              alt={product.name}
              className="w-32 h-32 object-cover mb-4 rounded"
            />
            <h2 className="text-lg font-semibold text-black">{product.name}</h2>
            <p className="text-sm text-gray-500">{product.brand}</p>
            <p className="mt-2 text-xl font-bold text-gold">${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
