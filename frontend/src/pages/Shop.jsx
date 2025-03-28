import React, { useState, useEffect } from "react";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import "../styles/shop.css";
import useGetData from "../custom-hooks/useGetData";
import ProductsList from "../components/UI/ProductsList";

const Shop = () => {
  const { data: products } = useGetData("products");
  const [productsData, setProductsData] = useState([]);

  useEffect(() => {
    setProductsData(products || []);
  }, [products]); 

  const filterProductsByCategory = (category) => {
    return products.filter((item) => item.category === category);
  };

  const handleFilter = (e) => {
    const filterValue = e.target.value;
    if (filterValue === "") {
      setProductsData(products);
      return;
    }
    if (filterValue === "game") {
      setProductsData(filterProductsByCategory("game"));
      return;
    }
    if (filterValue === "console") {
      setProductsData(filterProductsByCategory("console"));
      return;
    }
    if (filterValue === "watch") {
      setProductsData(filterProductsByCategory("watch"));
      return;
    }
    if (filterValue === "wireless") {
      setProductsData(filterProductsByCategory("wireless"));
      return;
    }
    if (filterValue === "mobile") {
      setProductsData(filterProductsByCategory("mobile"));
      return;
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    const searchedProducts = products.filter((item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProductsData(searchedProducts);
  };

  return (
    <Helmet title="Shop">
      <CommonSection title="Products" />
      <section>
        <Container>
          <Row>
            <Col lg="3" md="6">
              <div className="filter__widget">
                <select onChange={handleFilter}>
                  <option value="">All Category</option>
                  <option value="game">Game</option>
                  <option value="mobile">Mobile</option>
                  <option value="console">Console</option>
                  <option value="watch">Watch</option>
                  <option value="wireless">Wireless</option>
                </select>
              </div>
            </Col>
            <Col lg="3" md="6" className="text-end">
              <div className="filter__widget">
                <select>
                  <option>Sort By</option>
                  <option value="ascending">Ascending</option>
                  <option value="descending">Descending</option>
                </select>
              </div>
            </Col>
            <Col lg="6" md="12">
              <div className="search__box">
                <input
                  type="text"
                  placeholder="Search......"
                  onChange={handleSearch}
                />
                <span>
                  <i className="ri-search-line"></i>
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <section className="pt-0">
        <Container>
          <Row>
            {productsData.length === 0 ? (
              <h1 className="text-center fs-4">No products are found</h1>
            ) : (
              <ProductsList data={productsData} />
            )}
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};
export default Shop;
