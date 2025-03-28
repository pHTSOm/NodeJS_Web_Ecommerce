
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
        const response = await fetch(`http://localhost:5000/api/${collectionName}`);
        console.log("Response status:", response.status);
        const jsonData = await response.json();
        console.log("Fetched data:", jsonData);
        
        if (jsonData.success) {
          setData(jsonData.products || []);
        } else {
          console.error("API error:", jsonData.message);
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