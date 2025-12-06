import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useCart } from '../../Context/CartContext';
import { colors } from '../../utils/color';

const CartScreen = ({ navigation }) => {
  const {
    cartItems,
    removeFromCart,
    submitOrder,
    updateCustomerInfo,
    clearCart,
  } = useCart();
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');

  const calculateTotals = () => {
    let total = 0;

    cartItems.forEach(item => {
      const box = parseFloat(item.boxes) || 0;
      const pec = parseFloat(item.pieces) || 0;
      const unit_price = parseFloat(item.price) || 0;
      const pc_packing = parseFloat(item.basicInfo?.packing) || 1;

      const sqr_m = box * pc_packing + pec * pc_packing;
      total += sqr_m * unit_price;
    });

    return {
      totalBoxes: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.boxes) || 0),
        0,
      ),
      totalPieces: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.pieces) || 0),
        0,
      ),
      totalAmount: total,
    };
  };

  const handleProcessOrder = () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart Khali Hai',
        text2: 'Order process karnay se pehlay cart mein items add karein',
        position: 'bottom',
      });
      return;
    }
    setCustomerModalVisible(true);
  };

  const handleSubmitCustomerInfo = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Information Missing',
        text2: 'Customer ka naam enter karein',
        position: 'bottom',
      });
      return;
    }

    if (!contactNo.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Information Missing',
        text2: 'Contact number enter karein',
        position: 'bottom',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Loading toast show karein
      Toast.show({
        type: 'info',
        text1: 'Processing...',
        text2: 'Apki order submit ki ja rahi hai',
        visibilityTime: 2000,
      });

      // Submit order with customer info
      const result = await submitOrder({ name, contactNo });

      // Success toast
      Toast.show({
        type: 'success',
        text1: 'Order Successful! ✅',
        text2: `Order ID: ${
          result.orderId
        }\nTotal: Rs. ${calculateTotals().totalAmount.toLocaleString()}`,
        position: 'bottom',
        visibilityTime: 4000,
      });

      setCustomerModalVisible(false);
      setTimeout(() => {
        navigation.navigate('Dashboard');
      }, 2000);
    } catch (error) {
      // Error toast
      Toast.show({
        type: 'error',
        text1: 'Order Failed ❌',
        text2: error.message || 'Order submit nahi ho saki. Dobara try karein.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = (itemId, itemName) => {
    removeFromCart(itemId);
    Toast.show({
      type: 'success',
      text1: 'Item Remove Ho Gaya',
      text2: `${itemName} cart se remove kar diya gaya`,
      position: 'bottom',
    });
  };

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Aapka Cart Khali Hai</Text>
        <Text style={styles.emptySubText}>
          Products add karne ke liye product details se jayein
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Products Par Wapas Jayein</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.itemsContainer}>
          {cartItems.map((item, index) => {
            const box = parseFloat(item.boxes) || 0;
            const pec = parseFloat(item.pieces) || 0;
            const unit_price = parseFloat(item.price) || 0;
            const pc_packing = parseFloat(item.basicInfo?.packing) || 1;
            const sqr_m = box * pc_packing + pec * pc_packing;
            const itemTotal = sqr_m * unit_price;

            return (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id, item.productName)}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.stockId}>Stock ID: {item.stockId}</Text>

                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <DetailItem
                      label="Boxes"
                      value={item.boxes}
                      suffix="boxes"
                    />
                    <DetailItem
                      label="Pieces"
                      value={item.pieces}
                      suffix="pcs"
                    />
                    <DetailItem
                      label="Price"
                      value={`Rs. ${parseFloat(
                        item.price || 0,
                      ).toLocaleString()}`}
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <DetailItem
                      label="Packing"
                      value={item.basicInfo?.packing || '1'}
                    />
                    <DetailItem
                      label="Total"
                      value={`Rs. ${itemTotal.toLocaleString()}`}
                    />
                  </View>
                </View>

                <Text style={styles.addedTime}>
                  Added: {new Date(item.addedAt).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{cartItems.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Boxes:</Text>
            <Text style={styles.summaryValue}>{totals.totalBoxes}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pieces:</Text>
            <Text style={styles.summaryValue}>{totals.totalPieces}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>
              Rs. {totals.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.processButton}
          onPress={handleProcessOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Ionicons
                name="arrow-forward"
                size={24}
                color={colors.background}
              />
              <Text style={styles.processButtonText}>Order Process Karein</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer Info Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSubmitting && setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModal}>
            <Text style={styles.modalTitle}>Customer Information</Text>
            <Text style={styles.modalSubtitle}>
              Order complete karne ke liye apni details enter karein
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Ka Naam *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Customer ka naam enter karein"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                placeholder="Contact number enter karein"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={() => {
                  setCustomerModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: 'Order Cancel',
                    text2: 'Order process cancel kar diya gaya',
                    position: 'bottom',
                  });
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmitCustomerInfo}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator color={colors.background} size="small" />
                    <Text style={[styles.modalSubmitText, { marginLeft: 8 }]}>
                      Processing...
                    </Text>
                  </>
                ) : (
                  <Text style={styles.modalSubmitText}>
                    Order Submit Karein
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailItem = ({ label, value, suffix }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>
      {value} {suffix || ''}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cartItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNumberText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: 4,
  },
  stockId: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addedTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  processButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerModal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CartScreen;
