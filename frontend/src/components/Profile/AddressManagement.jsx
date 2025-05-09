// frontend/src/components/Profile/AddressManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, CardBody, CardHeader, 
  Button, Form, FormGroup, Input, Label, 
  Modal, ModalHeader, ModalBody, ModalFooter,
  Badge
} from 'reactstrap';
import { toast } from 'react-toastify';
import { AuthService } from '../../services/api';

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  
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
  const toggle = () => setModal(!modal);
  
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
      }
    } catch (error) {
      toast.error('Failed to load addresses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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
    toggle();
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      fetchAddresses();
      toggle();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };
  
  // Delete address
  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await AuthService.deleteAddress(id);
        toast.success('Address deleted successfully');
        fetchAddresses();
      } catch (error) {
        toast.error('Failed to delete address');
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
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };
  
  return (
    <div className="address-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>My Addresses</h4>
        <Button color="primary" onClick={handleAddAddress}>
          Add New Address
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-4 bg-light rounded">
          <p className="mb-0">You don't have any saved addresses yet.</p>
        </div>
      ) : (
        <Row>
          {addresses.map(address => (
            <Col md="6" lg="4" className="mb-4" key={address.id}>
              <Card className="h-100 shadow-sm">
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
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          {currentAddress ? 'Edit Address' : 'Add New Address'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label for="name">Full Name*</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="addressLine1">Address Line 1*</Label>
              <Input
                type="text"
                name="addressLine1"
                id="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="addressLine2">Address Line 2</Label>
              <Input
                type="text"
                name="addressLine2"
                id="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
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
                    required
                  />
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
                    required
                  />
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
                    required
                  />
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
                required
              />
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
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggle}>Cancel</Button>
            <Button color="primary" type="submit">Save</Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressManagement;