import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../Context/CartContext';
import { colors } from '../../utils/color';

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, submitOrder, updateCustomerInfo } =
    useCart();
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');

  const calculateTotals = () => {
    return cartItems.reduce(
      (acc, item) => {
        acc.totalBoxes += parseInt(item.boxes) || 0;
        acc.totalPieces += parseInt(item.pieces) || 0;
        acc.totalPrice += parseFloat(item.price) || 0;
        return acc;
      },
      { totalBoxes: 0, totalPieces: 0, totalPrice: 0 },
    );
  };

  const handleProcessOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart before processing');
      return;
    }
    setCustomerModalVisible(true);
  };

  const handleSubmitCustomerInfo = async () => {
    if (!name.trim() || !contactNo.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter both name and contact number',
      );
      return;
    }

    updateCustomerInfo({ name, contactNo });

    try {
      Alert.alert(
        'Confirm Order',
        `Are you sure you want to place order for ${cartItems.length} items?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              setCustomerModalVisible(false);

              Alert.alert(
                'Processing Order',
                'Your order is being processed...',
                [],
                { cancelable: false },
              );

              try {
                const result = await submitOrder();
                Alert.alert(
                  'Order Successful',
                  `Your order has been placed successfully!\nOrder ID: ${result.orderId}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('Home'),
                    },
                  ],
                );
              } catch (error) {
                Alert.alert(
                  'Order Failed',
                  'Failed to process order. Please try again.',
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit order');
    }
  };

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySubText}>
          Add products to cart from product details
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Products</Text>
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
          {cartItems.map((item, index) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNumber}>
                  <Text style={styles.itemNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.productName}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.id)}
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
                  <DetailItem label="Boxes" value={item.boxes} suffix="boxes" />
                  <DetailItem label="Pieces" value={item.pieces} suffix="pcs" />
                  <DetailItem
                    label="Price"
                    value={`Rs. ${parseFloat(
                      item.price || 0,
                    ).toLocaleString()}`}
                  />
                </View>
              </View>

              <Text style={styles.addedTime}>
                Added: {new Date(item.addedAt).toLocaleString()}
              </Text>
            </View>
          ))}
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
              Rs. {totals.totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.processButton}
          onPress={handleProcessOrder}
        >
          <Ionicons name="arrow-forward" size={24} color={colors.background} />
          <Text style={styles.processButtonText}>Process Order</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Info Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModal}>
            <Text style={styles.modalTitle}>Customer Information</Text>
            <Text style={styles.modalSubtitle}>
              Please provide your details to complete the order
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                placeholder="Enter your contact number"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCustomerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmitCustomerInfo}
              >
                <Text style={styles.modalSubmitText}>Submit Order</Text>
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
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

export default CartScreen;
