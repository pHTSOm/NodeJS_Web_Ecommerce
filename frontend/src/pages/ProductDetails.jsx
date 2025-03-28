import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { useParams } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import "../styles/product-details.css";
import { motion } from "framer-motion";
import ProductsList from "../components/UI/ProductsList";
import { useDispatch } from "react-redux";
import { cartActions } from "../slices/cartSlice";
import { toast } from "react-toastify";
import { ProductService } from "../services/api";

const ProductDetails = () => {
  const [product, setProduct] = useState({});
  const [tab, setTab] = useState("desc");
  const reviewUser = useRef("");
  const reviewMsg = useRef("");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null);
  const { id } = useParams();
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await ProductService.getProductById(id);
        if (response.success && response.product) {
          setProduct(response.product);
          
          // Fetch related products after getting the product category
          if (response.product.category) {
            const allProductsResponse = await ProductService.getAllProducts();
            const related = allProductsResponse.products.filter(
              item => item.category === response.product.category && item.id !== response.product.id
            ).slice(0, 4); // Just get up to 4 related products
            setRelatedProducts(related);
          }
        } else {
          toast.error("Product not found");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const submitHandler = (e) => {
    e.preventDefault();

    const reviewUserName = reviewUser.current.value;
    const reviewUserMsg = reviewMsg.current.value;

    const reviewObj = {
      userName: reviewUserName,
      text: reviewUserMsg,
      rating,
    };

    console.log(reviewObj);
    toast.success("Review submitted");
    // Note: You would need to implement a backend endpoint to save reviews
  };

  const addToCart = () => {
    dispatch(
      cartActions.addItem({
        id: product.id,
        imgUrl: product.imgUrl,
        productName: product.productName,
        price: product.price,
      })
    );
    toast.success("Product added successfully");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // Handle image URL correctly
  const imageUrl = product.imgUrl ? 
    (product.imgUrl.startsWith('http') ? product.imgUrl : `http://localhost:5000${product.imgUrl}`) 
    : '/placeholder.png';

  return (
    <Helmet title={product.productName || "Product Details"}>
      <CommonSection title={product.productName || "Product Details"} />

      <section className="pt-0">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <h5 className="fw-bold">Loading product details...</h5>
            </div>
          ) : (
            <Row>
              <Col lg="6">
                <img 
                  src={imageUrl} 
                  alt={product.productName} 
                  className="product-detail-img"
                  onError={(e) => { e.target.src = '/placeholder.png'; }}
                />
              </Col>

              <Col lg="6">
                <div className="product__details">
                  <h2>{product.productName}</h2>
                  <div className="product__rating d-flex align-items-center gap-5 mb-3">
                    <div>
                      <span><i className="ri-star-fill"></i></span>
                      <span><i className="ri-star-fill"></i></span>
                      <span><i className="ri-star-fill"></i></span>
                      <span><i className="ri-star-fill"></i></span>
                      <span><i className="ri-star-half-fill"></i></span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-5">
                    <span className="product__price">${product.price}</span>
                    <span>Category: {product.category?.toUpperCase()} </span>
                  </div>
                  <p className="mt-3">{product.shortDesc}</p>

                  <motion.button
                    whileTap={{ scale: 1.2 }}
                    className="buy__btn"
                    onClick={addToCart}
                  >
                    Add to cart
                  </motion.button>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      {!loading && (
        <>
          <section>
            <Container>
              <Row>
                <Col lg="12">
                  <div className="tab__wrapper d-flex align-items-center gap-5">
                    <h6
                      className={`${tab === "desc" ? "active__tab" : ""}`}
                      onClick={() => setTab("desc")}
                    >
                      Description
                    </h6>
                    <h6
                      className={`${tab === "rev" ? "active__tab" : ""}`}
                      onClick={() => setTab("rev")}
                    >
                      Reviews
                    </h6>
                  </div>

                  {tab === "desc" ? (
                    <div className="tab__content mt-5">
                      <p>{product.description}</p>
                    </div>
                  ) : (
                    <div className="product__review mt-5">
                      <div className="review__wrapper">
                        <ul>
                          {/* Reviews would be displayed here */}
                          <li className="mb-4">
                            <h6>No reviews yet</h6>
                            <p>Be the first to leave a review!</p>
                          </li>
                        </ul>

                        <div className="review__form">
                          <h4>Leave your experience</h4>
                          <form action="" onSubmit={submitHandler}>
                            <div className="form__group">
                              <input
                                type="text"
                                placeholder="Enter name"
                                ref={reviewUser}
                                required
                              />
                            </div>

                            <div className="form__group d-flex align-items-center gap-5 rating__group">
                              <motion.span
                                whileTap={{ scale: 1.2 }}
                                onClick={() => setRating(1)}
                              >
                                1<i className="ri-star-fill"></i>
                              </motion.span>
                              <motion.span
                                whileTap={{ scale: 1.2 }}
                                onClick={() => setRating(2)}
                              >
                                2<i className="ri-star-fill"></i>
                              </motion.span>
                              <motion.span
                                whileTap={{ scale: 1.2 }}
                                onClick={() => setRating(3)}
                              >
                                3<i className="ri-star-fill"></i>
                              </motion.span>
                              <motion.span
                                whileTap={{ scale: 1.2 }}
                                onClick={() => setRating(4)}
                              >
                                4<i className="ri-star-fill"></i>
                              </motion.span>
                              <motion.span
                                whileTap={{ scale: 1.2 }}
                                onClick={() => setRating(5)}
                              >
                                5<i className="ri-star-fill"></i>
                              </motion.span>
                            </div>

                            <div className="form__group">
                              <textarea
                                ref={reviewMsg} // Fixed: using the correct ref
                                rows={4}
                                type="text"
                                placeholder="Review Message..."
                                required
                              />
                            </div>

                            <motion.button
                              whileTap={{ scale: 1.2 }}
                              type="submit"
                              className="buy__btn"
                            >
                              Submit
                            </motion.button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </Col>

                {relatedProducts.length > 0 && (
                  <>
                    <Col lg="12" className="mt-5">
                      <h2 className="related__title">You might also like</h2>
                    </Col>
                    <ProductsList data={relatedProducts} />
                  </>
                )}
              </Row>
            </Container>
          </section>
        </>
      )}
    </Helmet>
  );
};

export default ProductDetails;