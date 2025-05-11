import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Input,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Badge,
} from "reactstrap";
import { toast } from "react-toastify";
import { AdminService } from "../../services/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply both search and role filters
    let filtered = users;

    // Apply role filter if selected
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllUsers();
      if (response.success) {
        console.log("Raw users response:", response);
        console.log("First user details:", response.users[0]);
        console.log("Users data:", response.users); // Log the users dat
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

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // Get proper badge color for role
  const getRoleBadge = (role) => {
    if (!role)
      return (
        <span
          style={{
            display: "inline-block",
            padding: "0.25em 0.4em",
            fontSize: "75%",
            fontWeight: "700",
            lineHeight: "1",
            textAlign: "center",
            whiteSpace: "nowrap",
            verticalAlign: "baseline",
            borderRadius: "0.25rem",
            backgroundColor: "#6c757d",
            color: "white",
          }}
        >
          UNKNOWN
        </span>
      );

    // Determine badge color based on role
    const bgColor = role.toLowerCase() === "admin" ? "#dc3545" : "#0d6efd"; // danger : primary

    return (
      <span
        style={{
          display: "inline-block",
          padding: "0.25em 0.4em",
          fontSize: "75%",
          fontWeight: "700",
          lineHeight: "1",
          textAlign: "center",
          whiteSpace: "nowrap",
          verticalAlign: "baseline",
          borderRadius: "0.25rem",
          backgroundColor: bgColor,
          color: "white",
          position: "relative",
          zIndex: "1",
        }}
      >
        {role.toUpperCase()}
      </span>
    );
  };

  const toggle = () => setModal(!modal);

  return (
    <div className="admin-users">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">User Management</h2>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0">Users</h5>
            <div className="d-flex align-items-center gap-3">
              {/* Role filter */}
              <FormGroup className="mb-0">
                <Input
                  type="select"
                  name="roleFilter"
                  id="roleFilter"
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  style={{ minWidth: "120px" }}
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Input>
              </FormGroup>

              {/* Search */}
              <div className="search-box" style={{ width: "300px" }}>
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
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
                  {(searchTerm || roleFilter) && (
                    <p>Try adjusting your filters</p>
                  )}
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
                        <td>{user.name || "N/A"}</td>
                        <td>{user.email || "N/A"}</td>
                        <td style={{ position: "relative" }}>
                          {user.role
                            ? getRoleBadge(user.role)
                            : getRoleBadge("unknown")}
                        </td>
                        <td>
                          {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                        </td>
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
            <Button color="secondary" onClick={toggle}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Save Changes
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
