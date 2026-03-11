import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Products from './pages/Products';
import ProductPage from './pages/ProductPage';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/products/:id" element={<ProductPage />} />
      </Routes>
    </Router>
  );
}

export default App;