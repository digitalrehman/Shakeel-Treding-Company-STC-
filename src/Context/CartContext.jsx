import React, { createContext, useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import { API_URL } from '@env';

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
      productData: productData,
      addedAt: new Date().toISOString(),
    };

    setCartItems(prev => [...prev, cartItem]);
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

      const sales_order_details = cartItems.map(item => {
        const box = parseFloat(item.boxes) || 0;
        const pec = parseFloat(item.pieces) || 0;
        const pc_packing = parseFloat(item.basicInfo?.packing) || 1;

        const api_box = parseFloat(item.basicInfo?.boxes);
        const api_pec = parseFloat(item.basicInfo?.Pcs);
        const quantity = (api_box / api_pec) * pec + box;
        const amount6 = parseFloat(item.price) || 0;
        const unit_price = amount6 * pc_packing;
        const text1 = parseFloat(item.discount) || 0;

        const new_discount = quantity * text1;
        const gross = amount6 * quantity;

        let discount_percent = 0;
        if (gross > 0) {
          discount_percent = (new_discount / gross) * 100;
          if (discount_percent > 100) discount_percent = 100;
        }

        return {
          stock_id: item.stockId || '',
          description: item.productName || '',
          box: box,
          pec: pec,
          amount6: amount6,
          quantity: quantity,
          unit_price: unit_price,
          text1: text1,
          discount_percent: discount_percent.toFixed(2) / 100,
        };
      });
      let total = 0;
      sales_order_details.forEach(i => {
        total +=
          parseFloat(i.quantity) *
          parseFloat(i.unit_price) *
          (1 - parseFloat(i.discount_percent) / 100);
      });

      const trans_type = orderData.document_type === 'Quotation' ? 32 : 30;

      const formattedTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const formData = new FormData();

      formData.append('party_name', orderData.customer_name || '');
      formData.append('function_date', new Date().toISOString().split('T')[0]);
      formData.append('contact_no', orderData.contact_number || '');
      formData.append('venue', orderData.venue || '');
      formData.append('total', total.toFixed(2));

      formData.append('so_advance', orderData.so_advance || '0');

      formData.append('user_id', currentUserId.toString());
      formData.append(
        'sales_order_details',
        JSON.stringify(sales_order_details),
      );

      formData.append('bank_id', '');

      formData.append('update_id', '0');
      formData.append('comments', '');
      formData.append('discount1', '0');

      formData.append('f_time', formattedTime);
      formData.append('order_type', '1');
      formData.append('trans_type', trans_type.toString());

      formData.append('func_type', '0');
      formData.append('so_ref', '');
      formData.append('created_by', currentUserId.toString());

      console.log('Sending FormData...', formData);
      const response = await fetch(`${API_URL}post_event_quotation.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Raw API Response:', result);

      if (result.status === true) {
        clearCart();
        return {
          success: true,
          orderId: result.order_no || result.order_id || `ORD-${Date.now()}`,
          apiResponse: result,
          message: result.message || 'Order submitted successfully',
        };
      } else {
        throw new Error(result.message || 'Order submission failed');
      }
    } catch (e) {
      console.error('Order submission error:', e);
      throw e;
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
