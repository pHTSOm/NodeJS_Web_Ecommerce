// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, CardBody, Nav, NavItem, NavLink, 
  TabContent, TabPane, Button, Form, FormGroup, Input, Label,
  Alert
} from 'reactstrap';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthService } from '../services/api';
import Helmet from '../components/Helmet/Helmet';
import CommonSection from '../components/UI/CommonSection';
import AddressManagement from '../components/Profile/AddressManagement';
import '../styles/profile.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // User profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Check if user is logged in
  const isLoggedIn = AuthService.isLoggedIn();
  
  // Load user profile
  useEffect(() => {
    if (isLoggedIn) {
      loadUserProfile();
    }
  }, [isLoggedIn]);
  
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getUserProfile();
      if (response.success && response.user) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
        });
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };
  
  // Handle profile input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  // Save profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await AuthService.updateUserProfile(profileData);
      if (response.success) {
        toast.success('Profile updated successfully');
        
        // Update local storage user data
        const user = AuthService.getCurrentUser();
        if (user) {
          user.name = profileData.name;
          user.email = profileData.email;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setChangePasswordLoading(true);
    
    try {
      const response = await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        toast.success('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };
  
  // If user is not logged in, redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Helmet title="My Profile">
      <CommonSection title="My Profile" />
      
      <section className="profile-section">
        <Container>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <Row>
            <Col lg="3" md="4">
              <Card className="profile-sidebar mb-4">
                <CardBody>
                  <div className="profile-avatar text-center mb-4">
                    <div className="avatar-placeholder">
                      {profileData.name.charAt(0).toUpperCase()}
                    </div>
                    <h5 className="mt-3">{profileData.name}</h5>
                    <p className="text-muted">{profileData.email}</p>
                  </div>
                  
                  <Nav vertical pills className="profile-nav">
                    <NavItem>
                      <NavLink
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => toggleTab('profile')}
                      >
                        <i className="ri-user-line me-2"></i>
                        Profile Information
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === 'addresses' ? 'active' : ''}
                        onClick={() => toggleTab('addresses')}
                      >
                        <i className="ri-map-pin-line me-2"></i>
                        My Addresses
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === 'password' ? 'active' : ''}
                        onClick={() => toggleTab('password')}
                      >
                        <i className="ri-lock-line me-2"></i>
                        Change Password
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        onClick={() => {
                          AuthService.logout();
                          window.location.href = '/login';
                        }}
                      >
                        <i className="ri-logout-box-line me-2"></i>
                        Logout
                      </NavLink>
                    </NavItem>
                  </Nav>
                </CardBody>
              </Card>
            </Col>
            
            <Col lg="9" md="8">
              <Card className="profile-content">
                <CardBody>
                  <TabContent activeTab={activeTab}>
                    {/* Profile Information Tab */}
                    <TabPane tabId="profile">
                      <h4 className="mb-4">Profile Information</h4>
                      
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <Form onSubmit={handleProfileSubmit}>
                          <FormGroup>
                            <Label for="name">Full Name</Label>
                            <Input
                              type="text"
                              name="name"
                              id="name"
                              value={profileData.name}
                              onChange={handleProfileChange}
                              required
                            />
                          </FormGroup>
                          
                          <FormGroup>
                            <Label for="email">Email Address</Label>
                            <Input
                              type="email"
                              name="email"
                              id="email"
                              value={profileData.email}
                              onChange={handleProfileChange}
                              required
                            />
                          </FormGroup>
                          
                          <Button 
                            color="primary" 
                            type="submit" 
                            disabled={saving}
                            className="mt-3"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Form>
                      )}
                    </TabPane>
                    
                    {/* Addresses Tab */}
                    <TabPane tabId="addresses">
                      <AddressManagement />
                    </TabPane>
                    
                    {/* Change Password Tab */}
                    <TabPane tabId="password">
                      <h4 className="mb-4">Change Password</h4>
                      
                      <Form onSubmit={handlePasswordSubmit}>
                        <FormGroup>
                          <Label for="currentPassword">Current Password</Label>
                          <Input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label for="newPassword">New Password</Label>
                          <Input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={6}
                          />
                          <small className="text-muted">
                            Password must be at least 6 characters
                          </small>
                        </FormGroup>
                        
                        <FormGroup>
                          <Label for="confirmPassword">Confirm New Password</Label>
                          <Input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </FormGroup>
                        
                        <Button 
                          color="primary" 
                          type="submit" 
                          disabled={changePasswordLoading}
                          className="mt-3"
                        >
                          {changePasswordLoading ? 'Changing...' : 'Change Password'}
                        </Button>
                      </Form>
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default Profile;