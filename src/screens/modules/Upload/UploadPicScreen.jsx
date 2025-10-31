import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../utils/color';
import CustomHeader from '../../../components/CustomHeader';

const { width } = Dimensions.get('window');

// Mock data array
const mockProducts = [
  {
    id: 1,
    name: 'Premium Wooden Chair',
    pieces: 12,
    boxes: 2,
    sq_price: 'Rs. 4,500',
    packing: 'Carton Box',
    units: 'PCS',
    stock_id: 'STK-001',
  },
  {
    id: 2,
    name: 'Modern Office Desk',
    pieces: 8,
    boxes: 1,
    sq_price: 'Rs. 12,000',
    packing: 'Wooden Crate',
    units: 'PCS',
    stock_id: 'STK-002',
  },
  {
    id: 3,
    name: 'Luxury Sofa Set',
    pieces: 4,
    boxes: 3,
    sq_price: 'Rs. 25,000',
    packing: 'Plastic Wrap',
    units: 'SET',
    stock_id: 'STK-003',
  },
  {
    id: 4,
    name: 'Dining Table',
    pieces: 6,
    boxes: 2,
    sq_price: 'Rs. 18,500',
    packing: 'Bubble Wrap',
    units: 'PCS',
    stock_id: 'STK-004',
  },
  {
    id: 5,
    name: 'Bookshelf Unit',
    pieces: 10,
    boxes: 2,
    sq_price: 'Rs. 8,200',
    packing: 'Cardboard',
    units: 'PCS',
    stock_id: 'STK-005',
  },
];

const UploadPicScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Filter products based on search query
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.stock_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadPress = (product) => {
    setSelectedProduct(product);
    setUploadModalVisible(true);
  };

  const handleImageSelect = () => {
    // Simulate image selection from gallery
    const mockImageUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
    setSelectedImage(mockImageUrl);
    Alert.alert('Success', 'Image selected from gallery!');
  };

  const handleUpload = () => {
    if (selectedImage) {
      // Simulate upload process
      Alert.alert(
        'Upload Successful',
        `Image uploaded for ${selectedProduct.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setUploadModalVisible(false);
              setSelectedImage(null);
              setSelectedProduct(null);
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'Please select an image first');
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <CustomHeader
        title="Upload Pictures"
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products Grid */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.resultsText}>
          {filteredProducts.length} products found
        </Text>

        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onUploadPress={handleUploadPress}
            />
          ))}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Image</Text>
              <TouchableOpacity 
                onPress={() => setUploadModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            {selectedProduct && (
              <View style={styles.modalProductInfo}>
                <Text style={styles.productName}>{selectedProduct.name}</Text>
                <Text style={styles.stockId}>{selectedProduct.stock_id}</Text>
              </View>
            )}

            {/* Image Preview */}
            <View style={styles.imageSection}>
              {selectedImage ? (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
                  <Text style={styles.placeholderText}>No image selected</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.selectButton]}
                onPress={handleImageSelect}
              >
                <Ionicons name="images-outline" size={20} color={colors.text} />
                <Text style={styles.buttonText}>Select from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.uploadButton, !selectedImage && styles.disabledButton]}
                onPress={handleUpload}
                disabled={!selectedImage}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
                <Text style={styles.buttonText}>Upload Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Product Card Component
const ProductCard = ({ product, onUploadPress }) => (
  <View style={styles.productCard}>
    {/* Card Header */}
    <View style={styles.cardHeader}>
      <View style={styles.cardProductInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.stockId}>{product.stock_id}</Text>
      </View>
      <TouchableOpacity 
        style={styles.uploadIcon}
        onPress={() => onUploadPress(product)}
      >
        <Ionicons name="camera" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>

    {/* Separator */}
    <View style={styles.separator} />

    {/* Product Details Grid - 3 columns, 2 rows */}
    <View style={styles.detailsGrid}>
      {/* First Row */}
      <View style={styles.detailRow}>
        <DetailItem label="Pieces" value={product.pieces} />
        <DetailItem label="Boxes" value={product.boxes} />
        <DetailItem label="SQ Price" value={product.sq_price} />
      </View>
      {/* Second Row */}
      <View style={styles.detailRow}>
        <DetailItem label="Packing" value={product.packing} />
        <DetailItem label="Units" value={product.units} />
        <View style={styles.emptyItem} />
      </View>
    </View>

    {/* Upload Status */}
    <View style={styles.uploadStatus}>
      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
      <Text style={styles.statusText}>Awaiting upload</Text>
    </View>
  </View>
);

// Detail Item Component
const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Search Section
  searchSection: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 8,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    marginLeft: 4,
  },
  // Products Grid
  productsGrid: {
    gap: 16,
  },
  // Product Card
  productCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardProductInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  stockId: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Separator
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  // Details Grid - 3 columns, 2 rows layout
  detailsGrid: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  emptyItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  // Upload Status
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProductInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  // Image Section
  imageSection: {
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  // Action Buttons
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  selectButton: {
    backgroundColor: colors.primary,
  },
  uploadButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default UploadPicScreen;