import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Alert,
  Spinner,
} from "reactstrap";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthService } from "../services/api";
import AddressManagement from "../components/Profile/AddressManagement";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    loyaltyPoints: 0,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user profile data
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.getUserProfile();

      if (response.success && response.user) {
        setProfileData({
          name: response.user.name || "",
          email: response.user.email || "",
          loyaltyPoints: response.user.loyaltyPoints || 0,
        });
      } else {
        setError("Failed to load profile data");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile info update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!profileData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (
      !profileData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)
    ) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await AuthService.updateUserProfile(profileData);

      if (response.success) {
        toast.success("Profile updated successfully");

        // Update localStorage user data to keep it in sync
        const user = AuthService.getCurrentUser();
        if (user) {
          user.name = profileData.name;
          user.email = profileData.email;
          localStorage.setItem("user", JSON.stringify(user));

          // Dispatch an event to notify other components about the update
          window.dispatchEvent(new Event("storage"));
        }
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile");
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Toggle between tabs
  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(response.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setError(error.response?.data?.message || "Failed to update password");
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Helmet title="My Profile">
      <CommonSection title="My Profile" />

      <section className="profile-section py-5">
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
                      {profileData.name
                        ? profileData.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <h5 className="mt-3">{profileData.name || "Loading..."}</h5>
                    <p className="text-muted">
                      {profileData.email || "Loading..."}
                    </p>
                  </div>

                  <Nav vertical pills className="profile-nav">
                    <NavItem>
                      <NavLink
                        className={activeTab === "profile" ? "active" : ""}
                        onClick={() => toggleTab("profile")}
                      >
                        <i className="ri-user-line me-2"></i>
                        Profile Information
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === "addresses" ? "active" : ""}
                        onClick={() => toggleTab("addresses")}
                      >
                        <i className="ri-map-pin-line me-2"></i>
                        My Addresses
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === "password" ? "active" : ""}
                        onClick={() => toggleTab("password")}
                      >
                        <i className="ri-lock-line me-2"></i>
                        Change Password
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === "orders" ? "active" : ""}
                        onClick={() => toggleTab("orders")}
                      >
                        <i className="ri-file-list-line me-2"></i>
                        Order History
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === "loyalty" ? "active" : ""}
                        onClick={() => toggleTab("loyalty")}
                      >
                        <i className="ri-coin-line me-2"></i>
                        Loyalty Points
                      </NavLink>
                    </NavItem>
                  </Nav>
                </CardBody>
              </Card>

              <div className="d-grid gap-2 mt-3">
                <Button
                  color="outline-danger"
                  onClick={() => navigate("/shop")}
                >
                  Back to Shop
                </Button>
              </div>
            </Col>

            <Col lg="9" md="8">
              <Card className="profile-content h-100">
                <CardBody>
                  <TabContent activeTab={activeTab}>
                    {/* Profile Information Tab */}
                    <TabPane tabId="profile">
                      <h4 className="mb-4">Profile Information</h4>

                      {loading ? (
                        <div className="text-center py-4">
                          <Spinner color="primary" />
                          <p className="mt-3">Loading your profile...</p>
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
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  name: e.target.value,
                                })
                              }
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
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  email: e.target.value,
                                })
                              }
                              required
                            />
                          </FormGroup>

                          <Button
                            color="primary"
                            type="submit"
                            disabled={saving}
                            className="mt-3"
                          >
                            {saving ? (
                              <>
                                <Spinner size="sm" /> Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
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
                          <Label for="confirmPassword">
                            Confirm New Password
                          </Label>
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
                          disabled={saving}
                          className="mt-3"
                        >
                          {saving ? (
                            <>
                              <Spinner size="sm" /> Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </Form>
                    </TabPane>

                    {/* Orders Tab */}
                    <TabPane tabId="orders">
                      <h4 className="mb-4">Order History</h4>
                      <div className="text-center py-4">
                        <Button
                          color="primary"
                          onClick={() => navigate("/orders")}
                        >
                          View Order History
                        </Button>
                      </div>
                    </TabPane>

                    <TabPane tabId="loyalty">
                      <h4 className="mb-4">Loyalty Points</h4>
                      {loading ? (
                        <div className="text-center py-4">
                          <Spinner color="primary" />
                          <p className="mt-3">Loading loyalty points...</p>
                        </div>
                      ) : (
                        <div>
                          <h5 className="text-success">
                            You currently have{" "}
                            <strong>{profileData.loyaltyPoints}</strong> points
                          </h5>
                          <p className="text-muted">
                            Every 100 points = $1 discount. You can redeem
                            points at checkout if you have at least 100.
                          </p>
                        </div>
                      )}
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
