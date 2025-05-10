import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Shop from '../pages/Shop';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import ProductDetails from '../pages/ProductDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';

import OrderConfirmation from '../pages/OrderConfirmation';
import OrderHistory from '../pages/OrderHistory';
import OrderDetails from '../pages/OrderDetails';

import AdminLayout from '../admin/components/AdminLayout';
import AdminDashboard from '../admin/pages/AdminDashboard';
import AdminProducts from '../admin/pages/AdminProducts';
import AdminProductEdit from '../admin/pages/AdminProductEdit';
import AdminOrders from '../admin/pages/AdminOrders';
import AdminOrderDetails from '../admin/pages/AdminOrderDetails';

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

    <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
    <Route path="orders" element={
      <ProtectedRoute>
        <OrderHistory />
      </ProtectedRoute>
    } />
    <Route path="orders/:orderId" element={
      <ProtectedRoute>
        <OrderDetails />
      </ProtectedRoute>
    } />

    {/* Admin routes - nested under an admin layout */}
    <Route path="admin" element={
      <ProtectedRoute adminOnly={true}>
        <AdminLayout />
      </ProtectedRoute>
    }>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="products/add" element={<AdminProductEdit />} />
      <Route path="products/edit/:id" element={<AdminProductEdit />} />
      <Route path="orders" element={<AdminOrders />} /> 
      <Route path="orders/:orderId" element={<AdminOrderDetails />} />
    </Route>
      
    {/* Keep backwards compatibility for now */}
    <Route path="addproduct" element={
      <ProtectedRoute adminOnly={true}>
        <Navigate to="/admin/products/add" replace />
      </ProtectedRoute>
    } />
  </Routes>
}

export default Routers;