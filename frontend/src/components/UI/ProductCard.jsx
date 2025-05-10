import React from "react";
import { motion } from "framer-motion";
import "../../styles/product-card.css";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../slices/cartSlice";
import { hasProductVariants } from '../../utils/productUtils';
import { getImageUrl } from '../../utils/imageUtils';

const ProductCard = ({ item }) => {
  const dispatch = useDispatch();

  const imageUrl = getImageUrl(item.imgUrl);
  console.log(
    `Product ${item.id}: ${item.productName} - Image URL: ${imageUrl}`
  );

  // Format price to display with 2 decimal places
  const formattedPrice = parseFloat(item.price).toFixed(2);

  // Determine if the product has variants
  const hasVariants = hasProductVariants(item);

  const addToCart = () => {
    // If product has variants, redirect to product details instead of adding to cart directly
    if (hasVariants) {
      toast.warning("Please select a variant before adding to cart");
      return;
    }

    dispatch(
      addItemToCart({
        productId: item.id,
        variantId: null,
        quantity: 1,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Product added to cart");
      })
      .catch((error) => {
        toast.error(error.message || "Failed to add product to cart");
      });
  };

  return (
    <Col lg="3" md="4" className="mb-2">
      <div className="product__item">
        <div className="product__img">
          <Link to={`/shop/${item.id}`}>
            <motion.img
              whileHover={{ scale: 0.9 }}
              src={imageUrl}
              alt={item.productName}
              style={{ width: "100%", height: "200px", objectFit: "contain" }}
              onError={(e) => {
                console.error(`Failed to load image: ${imageUrl}`);
                e.target.src = "/placeholder.png";
              }}
            />
          </Link>
        </div>

        <div className="p-2 product__info">
          <h3 className="product__name">
            <Link to={`/shop/${item.id}`}>{item.productName}</Link>
          </h3>
          <div className="d-flex justify-content-between align-items-center">
            <span className="product__category">{item.category}</span>
            {item.brand && <span className="product__brand">{item.brand}</span>}
          </div>
          {item.avgRating > 0 && (
            <div className="product__rating">
              {[...Array(5)].map((_, index) => (
                <span key={index}>
                  <i
                    className={`ri-star-${
                      index < Math.round(item.avgRating) ? "fill" : "line"
                    }`}
                  ></i>
                </span>
              ))}
              <span className="rating-count">
                ({item.avgRating.toFixed(1)})
              </span>
            </div>
          )}
        </div>

        <div className="product__card-bottom d-flex align-items-center justify-content-between p-2">
          <span className="price">${formattedPrice}</span>

          {item.isNew && <span className="badge new-badge">New</span>}
          {item.isBestSeller && (
            <span className="badge bestseller-badge">Bestseller</span>
          )}

          <motion.span
            whileTap={{ scale: 1.2 }}
            className="add-to-cart"
            onClick={hasVariants ? () => {} : addToCart}
          >
            <Link to={hasVariants ? `/shop/${item.id}` : "#"}>
              <i className={hasVariants ? "ri-eye-line" : "ri-add-line"}></i>
            </Link>
          </motion.span>
        </div>
      </div>
    </Col>
  );
};

export default ProductCard;
