import React from 'react';
import {motion} from 'framer-motion';
import "../../styles/product-card.css"
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../slices/cartSlice';

const ProductCard = ({item}) => {
  const dispatch = useDispatch();

  // Handle image URL - parse JSON if it's a string
  let imageUrl = 'placeholder.png'; // Default fallback image
  
  try {
    // Handle JSON string or array
    if (typeof item.imgUrl === 'string') {
      // Check if it's a JSON string array
      if (item.imgUrl.startsWith('[')) {
        try {
          const images = JSON.parse(item.imgUrl);
          if (images && images.length > 0) {
            imageUrl = images[0];
          }
        } catch (err) {
          // Not valid JSON, use as-is
          imageUrl = item.imgUrl;
        }
      } else {
        // It's a regular string URL
        imageUrl = item.imgUrl;
      }
    } else if (Array.isArray(item.imgUrl) && item.imgUrl.length > 0) {
      // It's already an array
      imageUrl = item.imgUrl[0];
    }
  } catch (error) {
    console.error("Error parsing product image URL:", error);
  }

  // Add server prefix if needed
  
if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/placeholder')) {
  // Check for duplicate uploads in path
  if (imageUrl.startsWith('/uploads/')) {
    // Already has uploads prefix, use as is
    imageUrl = imageUrl;
  } 
  // Handle path starting with /products
  else if (imageUrl.startsWith('/products/')) {
    imageUrl = `/uploads${imageUrl}`;
  } 
  // Handle other formats
  else {
    // Add appropriate prefix based on if it already has a leading slash
    imageUrl = imageUrl.startsWith('/') 
      ? `/uploads${imageUrl}` 
      : `/uploads/products/${imageUrl}`;
  }
}

// Debug log to check final URL
  console.log("Final image URL for", item.productName, ":", imageUrl);

  // Format price to display with 2 decimal places
  const formattedPrice = parseFloat(item.price).toFixed(2);

  // Determine if the product has variants
  const hasVariants = item.ProductVariants && item.ProductVariants.length > 0;

  const addToCart = () => {
    // If product has variants, redirect to product details instead of adding to cart directly
    if (hasVariants) {
      toast.error('Please select a variant before adding to cart');
      return;
    }

    dispatch(
      cartActions.addItem({
        id: item.id,
        productName: item.productName,
        price: item.price,
        imgUrl: imageUrl,
        quantity: 1,
      })
    );
    toast.success('Product added successfully')
  };

  return (
    <Col lg='3' md='4' className="mb-2">
      <div className="product__item">
        <div className="product__img">
          <Link to={`/shop/${item.id}`}>
            <motion.img 
              whileHover={{ scale: 0.9 }} 
              src={imageUrl} 
              alt={item.productName}
              style={{ width: '100%', height: '200px', objectFit: 'contain' }}
              onError={(e) => {
                console.error(`Failed to load image: ${imageUrl}`);
                e.target.src = '/placeholder.png'; 
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
                  <i className={`ri-star-${index < Math.round(item.avgRating) ? 'fill' : 'line'}`}></i>
                </span>
              ))}
              <span className="rating-count">({item.avgRating.toFixed(1)})</span>
            </div>
          )}
        </div>

        <div className="product__card-bottom d-flex align-items-center justify-content-between p-2">
          <span className="price">${formattedPrice}</span>
          
          {item.isNew && <span className="badge new-badge">New</span>}
          {item.isBestSeller && <span className="badge bestseller-badge">Bestseller</span>}
          
          <motion.span 
            whileTap={{ scale: 1.2 }} 
            className="add-to-cart"
            onClick={hasVariants ? () => {} : addToCart}
          >
            <Link to={hasVariants ? `/shop/${item.id}` : '#'}>
              <i className={hasVariants ? "ri-eye-line" : "ri-add-line"}></i>
            </Link>
          </motion.span>
        </div>
      </div>
    </Col>    
  );
}

export default ProductCard;