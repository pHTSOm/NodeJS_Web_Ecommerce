import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Shop from '../pages/Shop';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import ProductDetails from '../pages/ProductDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import AuthSuccess from '../pages/AuthSuccess';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

import OrderConfirmation from '../pages/OrderConfirmation';
import OrderHistory from '../pages/OrderHistory';
import OrderDetails from '../pages/OrderDetails';

import AdminLayout from '../admin/components/AdminLayout';
import AdminDashboard from '../admin/pages/AdminDashboard';
import AdminProducts from '../admin/pages/AdminProducts';
import AdminProductEdit from '../admin/pages/AdminProductEdit';
import AdminOrders from '../admin/pages/AdminOrders';
import AdminOrderDetails from '../admin/pages/AdminOrderDetails';
import AdminUsers from '../admin/pages/AdminUsers';

const Routers = () => {
  return <Routes>
    <Route path="/" element={<Navigate to="home"/>}/>
    <Route path='home' element={<Home/>}/>
    <Route path='shop' element={<Shop/>}/>
    <Route path='shop/:id' element={<ProductDetails/>}/>
    <Route path='cart' element={<Cart/>}/>
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
    <Route path="auth/success" element={<AuthSuccess />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="reset-password" element={<ResetPassword />} />
    
    <Route path="checkout" element={<Checkout />} />

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

    <Route path="profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />

    {/* Admin routes */}
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
      <Route path="users" element={<AdminUsers />} />
    </Route>
  </Routes>
}

export default Routers;