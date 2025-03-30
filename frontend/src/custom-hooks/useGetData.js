import { useState, useEffect } from "react";
import { ProductService } from "../services/api";

const useGetData = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching data from:", collectionName);
        
        let responseData;
        
        // Use the ProductService instead of direct fetch
        if (collectionName === 'products') {
          responseData = await ProductService.getAllProducts();
        } else if (collectionName.startsWith('products/category/')) {
          const category = collectionName.split('/').pop();
          responseData = await ProductService.getProductsByCategory(category);
        } else if (collectionName.startsWith('products/')) {
          const productId = collectionName.split('/').pop();
          responseData = await ProductService.getProductById(productId);
        } else {
          console.error("Unsupported collection name:", collectionName);
          setData([]);
          setLoading(false);
          return;
        }
        
        console.log("Fetched data:", responseData);
        
        if (responseData.success) {
          setData(responseData.products || []);
        } else {
          console.error("API error:", responseData.message);
          setData([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName]);

  return { data, loading };
};

export default useGetData;