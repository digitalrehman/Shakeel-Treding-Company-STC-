import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);

  const addToCart = (productData, quantityInfo) => {
    const cartItem = {
      id: Date.now().toString(),
      productId: productData.stockId || productData.id,
      productName: productData.basicInfo?.description || 'Product',
      stockId: productData.stockId,
      basicInfo: productData.basicInfo,
      uom: quantityInfo.uom || productData.basicInfo?.units || '',
      ...quantityInfo,
      addedAt: new Date().toISOString(),
    };

    setCartItems(prev => [...prev, cartItem]);
    console.log('Item added to cart. UOM:', cartItem.uom);
  };

  const removeFromCart = id => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerInfo(null);
  };

  const updateCustomerInfo = info => {
    setCustomerInfo(info);
  };

  const submitOrder = async () => {
    if (!customerInfo || cartItems.length === 0) {
      throw new Error('Cart is empty or customer info missing');
    }

    const orderData = {
      customerInfo,
      cartItems,
      orderDate: new Date().toISOString(),
      totalItems: cartItems.length,
      totalBoxes: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.boxes) || 0),
        0,
      ),
      totalPieces: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.pieces) || 0),
        0,
      ),
      totalAmount: cartItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0),
        0,
      ),
    };

    return new Promise(resolve => {
      setTimeout(() => {
        clearCart();
        resolve({ success: true, orderId: `ORD-${Date.now()}` });
      }, 1500);
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customerInfo,
        addToCart,
        removeFromCart,
        clearCart,
        updateCustomerInfo,
        submitOrder,
        cartCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
