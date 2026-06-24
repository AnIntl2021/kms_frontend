import React from 'react';

interface Product {
  id: number;
  name: string;
  name_ar?: string;
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
          className="pos-product-card"
          onClick={() => onAddToCart(product)}
        >
          {/* Image */}
          <div className="pos-product-image-wrap">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="pos-product-placeholder">
                {product.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pos-product-info">
            <h3 className="pos-product-title">{product.name}</h3>
            <p className="pos-product-desc">
              {product.name_ar || 'Fresh and delicious, made to order.'}
            </p>
            <div className="pos-product-footer">
              <span className="pos-product-price">
                {Number(product.price || 0).toFixed(3)} KWD
              </span>
              <button
                className="pos-product-add-btn"
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                aria-label={`Add ${product.name} to cart`}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductGrid;
