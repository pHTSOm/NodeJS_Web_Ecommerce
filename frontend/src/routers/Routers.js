import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Shop from '../pages/Shop';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import ProductDetails from '../pages/ProductDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AddProduct from '../pages/AddProduct';
import AdminProducts from '../pages/AdminProducts';

const Routers = () => {
  return <Routes>
    <Route path="/" element={<Navigate to="home"/>}/>
    <Route path='home' element={<Home/>}/>
    <Route path='shop' element={<Shop/>}/>
    <Route path='shop/:id' element={<ProductDetails/>}/>
    <Route path='cart' element={<Cart/>}/>
    <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
    
    <Route path="checkout" element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      } />

    <Route path="addproduct" element={
        <ProtectedRoute adminOnly={true}>
          <AddProduct />
        </ProtectedRoute>
      } />

      <Route path="admin/products" element={
        <ProtectedRoute adminOnly={true}>
          <AdminProducts />
        </ProtectedRoute>
      } />
      
      <Route path="admin/products/edit/:id" element={
        <ProtectedRoute adminOnly={true}>
          <AddProduct />
        </ProtectedRoute>
      } />
      
  </Routes>
}

export default Routers
