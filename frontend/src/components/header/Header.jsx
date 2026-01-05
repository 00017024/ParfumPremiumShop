export function Header() {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Perfume Shop</h1>
      <nav>
        <ul className="flex gap-6">
          <li><a href="/" className="hover:text-blue-500">Home</a></li>
          <li><a href="/products" className="hover:text-blue-500">Shop</a></li>
          <li><a href="/cart" className="hover:text-blue-500">Cart</a></li>
          <li><a href="/profile" className="hover:text-blue-500">Profile</a></li>
        </ul>
      </nav>
    </header>
  )
}
