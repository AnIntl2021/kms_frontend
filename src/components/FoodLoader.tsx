import React, { useState, useEffect } from 'react';

interface FoodLoaderProps {
  text?: string;
}

const foods = ['🍔', '🍕', '🥪', '🍟', '🥤', '🍩'];

const FoodLoader: React.FC<FoodLoaderProps> = ({ text = 'Loading...' }) => {
  const [foodIndex, setFoodIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFoodIndex((prev) => (prev + 1) % foods.length);
    }, 600); // Change food every 600ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '50vh',
      width: '100%',
      gap: '1rem',
      color: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        fontSize: '4rem',
        animation: 'bounce 0.6s infinite alternate',
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
      }}>
        {foods[foodIndex]}
      </div>
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        animation: 'pulse 1.5s infinite'
      }}>
        {text}
      </div>

      <style>
        {`
          @keyframes bounce {
            0% { transform: translateY(0) scale(1); }
            100% { transform: translateY(-20px) scale(1.1); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default FoodLoader;
