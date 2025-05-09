import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Spinner,
} from "reactstrap";
import { toast } from "react-toastify";
import { ProductService } from "../../services/api";
import ProductForm from "../components/Products/ProductForm";

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchProductDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProductById(id);

      if (response.success && response.product) {
        setProduct(response.product);
      } else {
        toast.error("Product not found");
        navigate("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product details");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);

    try {
      console.log("Submitting form data to API...");
      console.log("Form data entries:", Array.from(formData.entries()));
      let response;

      if (isEditMode) {
        console.log("Updating product with ID:", id);
        response = await ProductService.updateProduct(id, formData);
        console.log("Update response:", response);
        if (response.success) {
          toast.success("Product updated successfully");
        } else {
          toast.error(response.message || "Failed to update product");
          return;
        }
      } else {
        console.log("Creating new product");
        response = await ProductService.createProduct(formData);
        console.log("Create response:", response);
        if (response.success) {
          toast.success("Product created successfully");
        } else {
          toast.error(response.message || "Failed to create product");
          return;
        }
      }

      // Redirect to products list
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        isEditMode ? "Failed to update product" : "Failed to create product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-product-edit">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{isEditMode ? "Edit Product" : "Add Product"}</h2>
      </div>

      <Card>
        <CardHeader>
          <h5 className="mb-0">
            {isEditMode ? "Edit Product Details" : "New Product Details"}
          </h5>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="mt-2">Loading product details...</p>
            </div>
          ) : (
            <ProductForm
              product={product}
              onSubmit={handleSubmit}
              loading={submitting}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminProductEdit;
