import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Routers from '../../routers/Routers';
// import AdminNav from '../AdminNav.jsx';
import { AuthService } from '../../services/api';

const Layout = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(AuthService.isAdmin());
    };
    
    checkAdmin();
    
    // Check for changes to auth state
    window.addEventListener('storage', checkAdmin);
    
    // Re-check periodically
    const interval = setInterval(checkAdmin, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAdmin);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <>
      <Header/>
      {/* {isAdmin && <AdminNav />} */}
      {isAdmin}
      <div className="main-content">
        <Routers/>
      </div>
      <Footer/>
    </>
  );
};

export default Layout;