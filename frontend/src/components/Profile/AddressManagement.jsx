// frontend/src/components/Profile/AddressManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, CardBody, CardHeader, 
  Button, Form, FormGroup, Input, Label, 
  Modal, ModalHeader, ModalBody, ModalFooter,
  Badge, Alert, Spinner
} from 'reactstrap';
import { toast } from 'react-toastify';
import { AuthService } from '../../services/api';

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  
  // Address form state
  const [formData, setFormData] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Vietnam',
    phone: '',
    isDefault: false
  });
  
  // Toggle modal
  const toggle = () => {
    setModal(!modal);
    // Clear errors when closing the modal
    if (modal) {
      setFormErrors({});
      setApiError(null);
    }
  };
  
  // Load addresses
  useEffect(() => {
    fetchAddresses();
  }, []);
  
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getAddresses();
      if (response.success) {
        setAddresses(response.addresses || []);
      } else {
        toast.error('Failed to load addresses');
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State/Province is required';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    
    // Phone validation - accepts formats like: +84 123456789, 0123456789, etc.
    if (formData.phone && !/^\+?[0-9\s-()]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Open modal to add new address
  const handleAddAddress = () => {
    setCurrentAddress(null);
    setFormData({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Vietnam',
      phone: '',
      isDefault: false
    });
    setFormErrors({});
    setApiError(null);
    toggle();
  };
  
  // Open modal to edit address
  const handleEditAddress = (address) => {
    setCurrentAddress(address);
    setFormData({
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'Vietnam',
      phone: address.phone,
      isDefault: address.isDefault
    });
    setFormErrors({});
    setApiError(null);
    toggle();
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setApiError(null);
    
    try {
      if (currentAddress) {
        // Update existing address
        await AuthService.updateAddress(currentAddress.id, formData);
        toast.success('Address updated successfully');
      } else {
        // Add new address
        await AuthService.addAddress(formData);
        toast.success('Address added successfully');
      }
      
      // Refresh addresses
      await fetchAddresses();
      toggle();
    } catch (error) {
      console.error('Error saving address:', error);
      setApiError(error.response?.data?.message || 'Failed to save address');
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete address
  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await AuthService.deleteAddress(id);
        toast.success('Address deleted successfully');
        await fetchAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error(error.response?.data?.message || 'Failed to delete address');
      }
    }
  };
  
  // Set as default address
  const handleSetDefault = async (id) => {
    try {
      const address = addresses.find(addr => addr.id === id);
      if (address && !address.isDefault) {
        await AuthService.updateAddress(id, { ...address, isDefault: true });
        toast.success('Default address updated');
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Error updating default address:', error);
      toast.error(error.response?.data?.message || 'Failed to update default address');
    }
  };
  
  return (
    <div className="address-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>My Addresses</h4>
        <Button color="primary" onClick={handleAddAddress}>
          <i className="ri-add-line me-1"></i> Add New Address
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
          <p className="mt-3">Loading your addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-4 bg-light rounded">
          <i className="ri-map-pin-line fs-3 mb-2"></i>
          <p className="mb-0">You don't have any saved addresses yet.</p>
          <p className="text-muted small">Add an address to speed up your checkout process.</p>
          <Button color="primary" size="sm" className="mt-2" onClick={handleAddAddress}>
            Add Your First Address
          </Button>
        </div>
      ) : (
        <Row>
          {addresses.map(address => (
            <Col md="6" lg="4" className="mb-4" key={address.id}>
              <Card className="h-100 shadow-sm address-card">
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold">{address.name}</span>
                    {address.isDefault && (
                      <Badge color="primary" className="ms-2">Default</Badge>
                    )}
                  </div>
                  <div>
                    <Button color="link" size="sm" className="p-0 me-2" onClick={() => handleEditAddress(address)}>
                      <i className="ri-pencil-line"></i>
                    </Button>
                    <Button color="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteAddress(address.id)}>
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="mb-1">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="mb-1">{address.addressLine2}</p>}
                  <p className="mb-1">{address.city}, {address.state} {address.postalCode}</p>
                  <p className="mb-1">{address.country}</p>
                  <p className="mb-3">{address.phone}</p>
                  
                  {!address.isDefault && (
                    <Button color="outline-primary" size="sm" onClick={() => handleSetDefault(address.id)}>
                      Set as default
                    </Button>
                  )}
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Add/Edit Address Modal */}
      <Modal isOpen={modal} toggle={toggle} size="lg">
        <ModalHeader toggle={toggle}>
          {currentAddress ? 'Edit Address' : 'Add New Address'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            {apiError && (
              <Alert color="danger" className="mb-4">
                {apiError}
              </Alert>
            )}
            
            <FormGroup>
              <Label for="name">Full Name*</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                invalid={!!formErrors.name}
                required
              />
              {formErrors.name && <div className="text-danger small mt-1">{formErrors.name}</div>}
            </FormGroup>
            
            <FormGroup>
              <Label for="addressLine1">Address Line 1*</Label>
              <Input
                type="text"
                name="addressLine1"
                id="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                invalid={!!formErrors.addressLine1}
                required
              />
              {formErrors.addressLine1 && <div className="text-danger small mt-1">{formErrors.addressLine1}</div>}
            </FormGroup>
            
            <FormGroup>
              <Label for="addressLine2">Address Line 2</Label>
              <Input
                type="text"
                name="addressLine2"
                id="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
              />
            </FormGroup>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="city">City*</Label>
                  <Input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    invalid={!!formErrors.city}
                    required
                  />
                  {formErrors.city && <div className="text-danger small mt-1">{formErrors.city}</div>}
                </FormGroup>
              </Col>
              
              <Col md={6}>
                <FormGroup>
                  <Label for="state">State/Province*</Label>
                  <Input
                    type="text"
                    name="state"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    invalid={!!formErrors.state}
                    required
                  />
                  {formErrors.state && <div className="text-danger small mt-1">{formErrors.state}</div>}
                </FormGroup>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="postalCode">Postal Code*</Label>
                  <Input
                    type="text"
                    name="postalCode"
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    invalid={!!formErrors.postalCode}
                    required
                  />
                  {formErrors.postalCode && <div className="text-danger small mt-1">{formErrors.postalCode}</div>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="country">Country*</Label>
                  <Input
                    type="text"
                    name="country"
                    id="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            
            <FormGroup>
              <Label for="phone">Phone Number*</Label>
              <Input
                type="text"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                invalid={!!formErrors.phone}
                placeholder="e.g., +84 123456789"
                required
              />
              {formErrors.phone && <div className="text-danger small mt-1">{formErrors.phone}</div>}
            </FormGroup>
            
            <FormGroup check className="mb-0">
              <Label check>
                <Input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                {' '}
                Set as default address
              </Label>
              <div className="text-muted small mt-1">
                Default address will be automatically selected during checkout.
              </div>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggle} disabled={submitting}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-1" /> 
                  {currentAddress ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                currentAddress ? 'Update Address' : 'Save Address'
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressManagement;