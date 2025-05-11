import React, { useState, useEffect, useCallback } from "react";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Input, Label, Button } from "reactstrap";
import "../styles/shop.css";
import ProductsList from "../components/UI/ProductsList";
import { useLocation } from "react-router-dom";
import { ProductService  } from "../services/api";


const API_URL = process.env.REACT_APP_API_URL || '/api';

const Shop = () => {
  const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Update filter form values
    const category = params.get('category') || "";
    const brand = params.get('brand') || "";
    const search = params.get('search') || "";
    const min = params.get('minPrice') || "";
    const max = params.get('maxPrice') || "";
    const sort = params.get('sort') || "";
    const page = params.has('page') ? parseInt(params.get('page')) : 1;
    
    setSelectedCategory(category);
    setSelectedBrand(brand);
    setSearchTerm(search);
    setMinPrice(min);
    setMaxPrice(max);
    setSortOption(sort);
    setCurrentPage(page);
    
    // Build filter parameters object from URL params
    const filterParams = {
      category: category,
      brand: brand,
      search: search,
      minPrice: min,
      maxPrice: max,
      sort: sort,
      page: page
    };
    
    // Add special filters
    if (params.has('isNew')) filterParams.isNew = params.get('isNew');
    if (params.has('isBestSeller')) filterParams.isBestSeller = params.get('isBestSeller');
    
    // Remove empty values
    const cleanParams = Object.fromEntries(
      Object.entries(filterParams).filter(([_, v]) => v !== "")
    );
    
    // Always fetch products with the URL parameters
    fetchProducts(page, cleanParams);
  }, [location.search]);

  
  // Function to fetch available categories
  const fetchCategories = async () => {
    try {
      const response = await ProductService.getAllProducts();
      const products = response.products || [];
      
      // Extract unique categories
      const uniqueCategories = [...new Set(products.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Function to fetch available brands
  const fetchBrands = async () => {
    try {
      const response = await ProductService.getBrands();
      setBrands(response.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  // Main function to fetch products with filters
  const fetchProducts = async (page = 1, filterParams = {}) => {
    setLoading(true);
    try {
      // Build query parameters
      const searchParams = new URLSearchParams();
      searchParams.append('page', page);
      searchParams.append('limit', 12);
      
      // Add filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== '') {
          searchParams.append(key, value);
        }
      });
      
      console.log("Fetching products with params:", searchParams.toString());
      
      const response = await ProductService.getAllProducts(Object.fromEntries(searchParams));
      
      if (response && (response.success || (response.data && response.data.success))) {
        const productData = response.success ? response : response.data;
        setProducts(productData.products || []);
        setTotalPages(productData.pagination?.totalPages || 1);
        setCurrentPage(page);
      } else {
        console.error('Invalid product response format:', response);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const debouncedSearch = useCallback(
    debounce((value) => {
      const filterParams = {
        category: selectedCategory,
        brand: selectedBrand,
        search: value,
        minPrice: minPrice,
        maxPrice: maxPrice,
        sort: sortOption
      };
      const cleanParams = Object.fromEntries(
        Object.entries(filterParams).filter(([_, v]) => v !== "")
      );
      fetchProducts(1, cleanParams);
    }, 500),
    [selectedCategory, selectedBrand, minPrice, maxPrice, sortOption]
  );
  

  // Handler for filter form submission
  const handleFilter = (e) => {
    e.preventDefault();
    const filterParams = {
      category: selectedCategory,
      brand: selectedBrand,
      search: searchTerm,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sort: sortOption
    };
    // Remove empty values
    const cleanParams = Object.fromEntries(
      Object.entries(filterParams).filter(([_, v]) => v !== "")
    );
    fetchProducts(1, cleanParams);
  };

  // Handler for clearing all filters
  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSortOption("");
    fetchProducts(1, {});
  };

  // Handler for pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchProducts(page);
    
    // Scroll to top when changing page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Helmet title="Shop">
      <CommonSection title="Computer Components" />
      <section>
        <Container>
          <Row>
            {/* Filters Sidebar */}
            <Col lg="3" md="4" className="mb-4">
            <div className="filter__widget">
                <h4 className="filter__title">Filter Products</h4>
                
                <Form onSubmit={handleFilter}>
                  {/* Category Filter */}
                  <FormGroup className="mb-3">
                    <Label for="category">Category</Label>
                    <Input
                      type="select"
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                  
                  {/* Brand Filter */}
                  <FormGroup className="mb-3">
                    <Label for="brand">Brand</Label>
                    <Input
                      type="select"
                      id="brand"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <option value="">All Brands</option>
                      {brands.map((brand, index) => (
                        <option key={index} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                  
                  {/* Price Range Filter */}
                  <div className="price-range mb-3">
                    <Label>Price Range</Label>
                    <div className="d-flex">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="me-2"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="filter__buttons d-flex justify-content-between">
                    <Button color="primary" type="submit">
                      Apply Filters
                    </Button>
                    <Button color="secondary" type="button" onClick={handleClearFilters}>
                      Clear
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>

            {/* Main Content Area */}
            <Col lg="9" md="8">
            <div className="shop__toolbar d-flex align-items-center justify-content-between mb-4">
                {/* Search Bar */}
                <div className="search__box">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      debouncedSearch(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProducts(1)}
                  />
                  <span onClick={() => fetchProducts(1)}>
                    <i className="ri-search-line"></i>
                  </span>
                </div>
                
                {/* Sort Options */}
                <div className="sort__widget">
                  <select 
                    value={sortOption} 
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      const sortValue = e.target.value;
                      const filterParams = {
                        category: selectedCategory,
                        brand: selectedBrand,
                        search: searchTerm,
                        minPrice: minPrice,
                        maxPrice: maxPrice,
                        sort: sortValue
                      };
                      const cleanParams = Object.fromEntries(
                        Object.entries(filterParams).filter(([_, v]) => v !== "")
                      );
                      // Fetch products with the current filters and the new sort option
                      fetchProducts(1, cleanParams);
                    }}
                  >
                    <option value="">Default Sorting</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="name_desc">Name: Z-A</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="bestselling">Best Selling</option>
                  </select>
                </div>
              </div>
              
              {/* Product Display */}
              <div className="product__display">
                {loading ? (
                  <div className="text-center py-5">
                    <h5>Loading products...</h5>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-5">
                    <h4>No products found</h4>
                    <p>Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <Row>
                    <ProductsList data={products} />
                  </Row>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination__container d-flex justify-content-center mt-5">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(page => (
                      <li 
                        key={page + 1} 
                        className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page + 1)}
                        >
                          {page + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </Col>          
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};
export default Shop;
