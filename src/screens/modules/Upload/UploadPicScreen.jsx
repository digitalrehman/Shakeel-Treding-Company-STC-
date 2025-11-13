import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../utils/color';
import CustomHeader from '../../../components/CustomHeader';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const UploadPicScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://t.de2solutions.com/mobile_dash/stock_master.php');
      const result = await response.json();
      
      if (result.status === "true" && result.data) {
        setProducts(result.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch products'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.stock_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadPress = (product) => {
    setSelectedProduct(product);
    setUploadModalVisible(true);
    setSelectedImage(null);
  };

  const handleImageSelect = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Toast.show({
          type: 'info',
          text1: 'Cancelled',
          text2: 'Image selection cancelled'
        });
      } else if (response.error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to select image'
        });
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        
        // File size validation (1MB = 1048576 bytes)
        if (asset.fileSize > 1048576) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Image size must be less than 1MB'
          });
          return;
        }

        // File type validation
        const fileType = asset.type?.toLowerCase();
        const fileName = asset.fileName?.toLowerCase();
        if (fileType && !fileType.includes('image/')) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Only JPG and PNG images are allowed'
          });
          return;
        }
        if (fileName && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Only JPG and PNG images are allowed'
          });
          return;
        }

        setSelectedImage(asset);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Image selected successfully'
        });
      }
    });
  };

  const handleUpload = async () => {
    if (!selectedImage || !selectedProduct) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an image first'
      });
      return;
    }

    try {
      setUploading(true);

      // Create form data
      const formData = new FormData();
      
      // Get file extension from original file name
      const originalFileName = selectedImage.fileName || 'image.jpg';
      const fileExtension = originalFileName.split('.').pop();
      
      // Create new file name with stock_id
      const newFileName = `${selectedProduct.stock_id}.${fileExtension}`;
      
      // Prepare file object
      const file = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: newFileName,
      };

      formData.append('stock_id', selectedProduct.stock_id);
      formData.append('image', file);

      const response = await fetch('https://t.de2solutions.com/company/48/images/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Image uploaded successfully'
        });
        
        setUploadModalVisible(false);
        setSelectedImage(null);
        setSelectedProduct(null);
        
        // Refresh products list
        fetchProducts();
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to upload image'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    return Number(number).toString().replace(/\.0+$/, '');
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredProducts.length} products found
            </Text>

            <View style={styles.productsGrid}>
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.stock_id || index}
                  product={product}
                  onUploadPress={handleUploadPress}
                  formatNumber={formatNumber}
                />
              ))}
            </View>
          </>
        )}
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
                disabled={uploading}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            {selectedProduct && (
              <View style={styles.modalProductInfo}>
                <Text style={styles.productName}>{selectedProduct.description}</Text>
                <Text style={styles.stockId}>{selectedProduct.stock_id}</Text>
              </View>
            )}

            {/* Image Preview */}
            <View style={styles.imageSection}>
              {selectedImage ? (
                <Image 
                  source={{ uri: selectedImage.uri }} 
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
                disabled={uploading}
              >
                <Ionicons name="images-outline" size={20} color={colors.text} />
                <Text style={styles.buttonText}>
                  {uploading ? 'Uploading...' : 'Select from Gallery'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.uploadButton, (!selectedImage || uploading) && styles.disabledButton]}
                onPress={handleUpload}
                disabled={!selectedImage || uploading}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
                <Text style={styles.buttonText}>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

// Product Card Component
const ProductCard = ({ product, onUploadPress, formatNumber }) => (
  <View style={styles.productCard}>
    {/* Card Header */}
    <View style={styles.cardHeader}>
      <View style={styles.cardProductInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.description || 'No Description'}
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
        <DetailItem label="Pieces" value={formatNumber(product.Pcs)} />
        <DetailItem label="Boxes" value={formatNumber(product.boxes)} />
        <DetailItem label="SQ Price" value={`Rs. ${formatNumber(product.sq_price)}`} />
      </View>
      {/* Second Row */}
      <View style={styles.detailRow}>
        <DetailItem label="Packing" value={formatNumber(product.packing)} />
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
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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