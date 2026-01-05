export function FeaturedProducts() {
  // Temporary placeholder data
  const products = [
    { id: 1, name: "Chanel No. 5", price: 120 },
    { id: 2, name: "Dior Sauvage", price: 95 },
    { id: 3, name: "Armani Si", price: 110 },
  ]

  return (
    <section className="py-10 px-6">
      <h3 className="text-2xl font-semibold mb-6">Featured Products</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="p-4 border rounded-lg shadow-sm">
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
            <h4 className="text-lg font-bold">{p.name}</h4>
            <p className="text-gray-600">${p.price}</p>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
