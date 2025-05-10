export const processImageUrl = (imgUrl) => {
    if (!imgUrl || imgUrl === "null") return "/placeholder.png";
    
    // Full URLs
    if (imgUrl.startsWith("http")) return imgUrl;
    
    if (imgUrl.startsWith("/uploads/")) return imgUrl;
    
    if (imgUrl.startsWith("/products/")) {
      // Fix double path issue by normalizing the path
      return `/uploads${imgUrl}`.replace(/\/+/g, '/');
    }
    
    // Other relative paths - assume products folder
    return `/uploads/products/${imgUrl.replace(/^\//, '')}`;
  };
  
  export const getImageUrl = (imgUrl) => {
    // Default fallback image
    if (!imgUrl) return '/placeholder.png';
    
    try {
      // Parse JSON string if needed
      let imageSource = imgUrl;
      
      if (typeof imgUrl === 'string' && imgUrl.startsWith('[')) {
        try {
          const parsed = JSON.parse(imgUrl);
          // Use first image from array if available
          imageSource = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
        } catch (e) {
          console.error('Failed to parse image JSON:', e);
          imageSource = imgUrl; // Keep as is if parsing fails
        }
      } else if (Array.isArray(imgUrl) && imgUrl.length > 0) {
        imageSource = imgUrl[0]; // Use first image from array
      }
      
      // Handle null or empty string
      if (!imageSource) return '/placeholder.png';
      
      return processImageUrl(imageSource);
    } catch (error) {
      console.error('Error processing image URL:', error);
      return '/placeholder.png';
    }
  };