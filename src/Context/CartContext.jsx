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

  const submitOrder = async orderData => {
    try {
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const currentUserId = id;

      // Prepare sales_order_details array
      const sales_order_details = cartItems.map(item => ({
        stock_id: item.stockId,
        description: item.productName,
        box: item.boxes || 0,
        pec: item.pieces || 0,
        unit_price: item.price || 0,
      }));

      // Calculate total
      let total = 0;
      sales_order_details.forEach((item, index) => {
        const box = parseFloat(item.box) || 0;
        const pec = parseFloat(item.pec) || 0;
        const unit_price = parseFloat(item.unit_price) || 0;

        const pc_packing =
          parseFloat(cartItems[index]?.basicInfo?.packing) || 1;
        const sqr_m = box * pc_packing + pec * pc_packing;
        total += sqr_m * unit_price;
      });

      // Create FormData object
      const formData = new FormData();

      formData.append('party_name', orderData.customer_name || '');
      formData.append('function_date', new Date().toISOString().split('T')[0]);
      formData.append('contact_no', orderData.contact_number || '');
      formData.append('venue', '');
      formData.append('total', total.toFixed(2));
      formData.append('so_advance', '');
      formData.append('user_id', currentUserId.toString());
      formData.append(
        'sales_order_details',
        JSON.stringify(sales_order_details),
      );
      formData.append('bank_id', '');
      formData.append('update_id', '0');
      formData.append('comments', '');
      formData.append('discount1', '0');
      formData.append(
        'f_time',
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
      formData.append('order_type', '32');

      // Log what we're sending
      console.log('Sending FormData with fields:');
      console.log('party_name:', orderData.customer_name);
      console.log('contact_no:', orderData.contact_number);
      console.log('user_id:', currentUserId);
      console.log('total:', total.toFixed(2));
      console.log('sales_order_details:', JSON.stringify(sales_order_details));

      // Send as FormData
      const response = await fetch(
        'https://t.de2solutions.com/mobile_dash/post_event_quotation.php',
        {
          method: 'POST',
          // DO NOT set Content-Type header - let React Native set it automatically
          body: formData,
        },
      );

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      // Extract JSON from the response (remove the SQL insert statement)
      let jsonString = responseText;

      // Find the JSON part in the response
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}') + 1;

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonString = responseText.substring(jsonStartIndex, jsonEndIndex);
        console.log('Extracted JSON:', jsonString);
      }

      let result;
      try {
        result = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        console.error('Problematic JSON string:', jsonString);
        // If we can't parse it, check if it contains success keywords
        if (
          responseText.includes('"status":true') ||
          responseText.includes('status":true')
        ) {
          result = { status: true };
        } else if (
          responseText.includes('INSERT INTO') &&
          responseText.includes('"status":true')
        ) {
          // If it contains SQL and status true, consider it successful
          result = { status: true };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      console.log('Parsed API Response:', result);

      // Check if status is true
      if (result.status === true || result.status === 'true') {
        clearCart();
        return {
          success: true,
          orderId: result.order_id || result.order_no || `ORD-${Date.now()}`,
          apiResponse: result,
          message: result.message || 'Order submitted successfully',
        };
      } else {
        throw new Error(
          result.message || result.error || 'Order submission failed',
        );
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
