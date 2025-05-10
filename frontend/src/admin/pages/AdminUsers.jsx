import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Table, Button, Input, Spinner, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label
} from 'reactstrap';
import { toast } from 'react-toastify';
import { AdminService } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllUsers();
      if (response.success) {
        setUsers(response.users || []);
        setFilteredUsers(response.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await AdminService.updateUser(selectedUser.id, formData);
      if (response.success) {
        toast.success("User updated successfully");
        fetchUsers();
        setModal(false);
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await AdminService.deleteUser(userId);
        if (response.success) {
          toast.success("User deleted successfully");
          fetchUsers();
        } else {
          toast.error(response.message || "Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const toggle = () => setModal(!modal);

  return (
    <div className="admin-users">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">User Management</h2>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Users</h5>
            <div className="search-box" style={{ width: '300px' }}>
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="table-responsive">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No users found</h5>
                </div>
              ) : (
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <Button 
                            color="primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditUser(user)}
                          >
                            <i className="ri-pencil-line"></i> Edit
                          </Button>
                          <Button 
                            color="danger" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <i className="ri-delete-bin-line"></i> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit User Modal */}
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Edit User</ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="role">Role</Label>
              <Input
                type="select"
                name="role"
                id="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggle}>Cancel</Button>
            <Button color="primary" type="submit">Save Changes</Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;