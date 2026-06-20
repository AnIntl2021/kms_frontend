import React from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <>
      {products.map(product => (
        <div 
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="pos-product-card"
        >
          <div className="pos-product-image-wrap">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="pos-product-placeholder">
                {product.name.charAt(0)}
              </div>
            )}
            <div className="pos-product-price-tag">
              {Number(product.price || 0).toFixed(3)} KWD
            </div>
          </div>
          <div className="pos-product-info">
            <h3 className="pos-product-title">{product.name}</h3>
            <p className="pos-product-category">{product.category}</p>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductGrid;
