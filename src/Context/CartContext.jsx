import React, { createContext, useState, useContext } from 'react';
import { useSelector } from 'react-redux';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const { id } = useSelector(state => state.Data.currentData);

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

  const submitOrder = async customerInfo => {
    try {
      if (!customerInfo || cartItems.length === 0) {
        throw new Error('Cart is empty or customer info missing');
      }

      const currentUserId = id;

      const sales_order_details = cartItems.map(item => ({
        stock_id: item.stockId,
        description: item.productName,
        box: item.boxes || 0,
        pec: item.pieces || 0,
        unit_price: item.price || 0,
      }));

      let total = 0;
      sales_order_details.forEach(item => {
        const box = parseFloat(item.box) || 0;
        const pec = parseFloat(item.pec) || 0;
        const unit_price = parseFloat(item.unit_price) || 0;

        const pc_packing = parseFloat(item.basicInfo?.packing) || 1;

        const sqr_m = box * pc_packing + pec * pc_packing;
        total += sqr_m * unit_price;
      });

      const orderData = {
        party_name: customerInfo.name,
        function_date: new Date().toISOString().split('T')[0],
        contact_no: customerInfo.contactNo,
        venue: '',
        total: total.toString(),
        so_advance: '',
        user_id: currentUserId.toString(),
        sales_order_details: JSON.stringify(sales_order_details),
        bank_id: '',
        update_id: '0',
        comments: '',
        discount1: '0',
        f_time: new Date().toLocaleTimeString('en-US', { hour12: true }),
        order_type: '32',
      };

      console.log('Sending order data:', orderData);

      const response = await fetch(
        'https://t.de2solutions.com/mobile_dash/post_event_quotation.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        },
      );

      const result = await response.json();

      if (result.status) {
        clearCart();
        return {
          success: true,
          orderId: `ORD-${Date.now()}`,
          apiResponse: result,
        };
      } else {
        throw new Error('API returned false status');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      throw error;
    }
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
