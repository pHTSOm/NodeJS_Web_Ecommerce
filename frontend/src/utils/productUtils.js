
export const hasProductVariants = (product) => {
    if (!product) return false;
    return (
      (product.ProductVariants && product.ProductVariants.length > 0) ||
      (product.variants && product.variants.length > 0)
    );
  };