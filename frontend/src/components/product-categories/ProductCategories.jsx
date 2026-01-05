export function ProductCategories() {
  const categories = ["Perfumes", "Cosmetics"]

  return (
    <section className="py-10 px-6">
      <h3 className="text-2xl font-semibold mb-6">Shop by Category</h3>
      <div className="grid grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div
            key={cat}
            className="p-6 bg-gray-100 rounded-xl text-center hover:shadow-md cursor-pointer"
          >
            {cat}
          </div>
        ))}
      </div>
    </section>
  )
}
