import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../utils/color';
import CustomHeader from '../../components/CustomHeader';

const { width } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productData, stockId } = route.params;
  const basicInfo = productData.data_basic?.[0] || {};
  const locations = productData.data || [];
  const showroomData = productData.data_show || [];
  
// Alternative static image URL
const productImage = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <CustomHeader
        title="Product Details"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image - Full Width */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: productImage }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Product Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {basicInfo.description || 'Product Name'}
          </Text>
          <Text style={styles.stockId}>Stock ID: {stockId}</Text>
        </View>

        {/* Product Details Grid - 3x2 Layout */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.detailsGrid}>
            <DetailBox icon="cube" label="Pieces" value={basicInfo.Pcs} />
            <DetailBox icon="archive" label="Boxes" value={basicInfo.boxes} />
            <DetailBox icon="pricetag" label="SQ Price" value={`Rs. ${basicInfo.sq_price}`} />
            <DetailBox icon="layers" label="Packing" value={basicInfo.packing} />
            <DetailBox icon="business" label="Units" value={basicInfo.units} />
            <DetailBox icon="scale" label="UOM" value={basicInfo.units} />
          </View>
        </View>

        {/* Stock Locations Section */}
        {locations.length > 0 && (
          <View style={styles.locationsSection}>
            <Text style={styles.sectionTitle}>
              Stock Locations ({locations.length})
            </Text>
            
            <View style={styles.locationsGrid}>
              {locations.map((location, index) => (
                <LocationCard key={index} location={location} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Showroom Display Section */}
        {showroomData.length > 0 && (
          <View style={styles.showroomSection}>
            <Text style={styles.sectionTitle}>
              Showroom Display ({showroomData.length})
            </Text>
            
            <View style={styles.showroomGrid}>
              {showroomData.map((showroom, index) => (
                <ShowroomCard key={index} showroom={showroom} index={index} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Detail Box Component - 3 per row
const DetailBox = ({ icon, label, value }) => (
  <View style={styles.detailBox}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value || 'N/A'}
    </Text>
  </View>
);

// Location Card Component
const LocationCard = ({ location, index }) => (
  <View style={styles.locationCard}>
    <View style={styles.locationHeader}>
      <View style={styles.locationBadge}>
        <Ionicons name="location" size={14} color={colors.text} />
        <Text style={styles.locationCode}>{location.loc_code}</Text>
      </View>
      <Text style={styles.locationName} numberOfLines={2}>
        {location.location_name}
      </Text>
    </View>

    <View style={styles.stockContainer}>
      <StockInfo 
        type="available" 
        boxes={location.a_boxes} 
        pcs={location.a_pcs} 
      />
      <StockInfo 
        type="reserved" 
        boxes={location.r_boxes} 
        pcs={location.r_pcs} 
      />
      <StockInfo 
        type="physical" 
        boxes={location.p_boxes} 
        pcs={location.p_pcs} 
      />
    </View>
  </View>
);

// Stock Info Component
const StockInfo = ({ type, boxes, pcs }) => {
  const getConfig = (type) => {
    switch (type) {
      case 'available':
        return { icon: 'checkmark-circle', color: colors.success, label: 'Available' };
      case 'reserved':
        return { icon: 'time', color: colors.primaryLight, label: 'Reserved' };
      case 'physical':
        return { icon: 'cube', color: colors.primary, label: 'Physical' };
      default:
        return { icon: 'help-circle', color: colors.textSecondary, label: 'Unknown' };
    }
  };

  const config = getConfig(type);

  return (
    <View style={styles.stockInfo}>
      <View style={styles.stockHeader}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.stockLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
      <View style={styles.stockValues}>
        <Text style={styles.stockText}>Box: {boxes || 0}</Text>
        <Text style={styles.stockText}>Pcs: {pcs || 0}</Text>
      </View>
    </View>
  );
};

// Showroom Card Component
const ShowroomCard = ({ showroom, index }) => (
  <View style={styles.showroomCard}>
    <View style={styles.showroomHeader}>
      <Ionicons name="business" size={16} color={colors.primary} />
      <Text style={styles.showroomTitle}>Showroom {showroom.showroom_id}</Text>
    </View>
    
    <View style={styles.showroomDetails}>
      <Text style={styles.showroomText}>
        Display: {showroom.display_id}
      </Text>
      <Text style={styles.showroomText}>
        Boxes: {showroom.boxes || 0}
      </Text>
      <Text style={styles.showroomText}>
        Pieces: {showroom.Pcs || 0}
      </Text>
    </View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  // Image Section
  imageSection: {
    width: '100%',
    height: 250,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.card,
  },
  // Title Section
  titleSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 30,
  },
  stockId: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  // Details Section
  detailsSection: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: (width - 48) / 3, // 3 boxes per row with padding
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  // Locations Section
  locationsSection: {
    padding: 16,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  locationCard: {
    width: (width - 48) / 2, // 2 cards per row
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
  locationHeader: {
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  locationCode: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  stockContainer: {
    gap: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 6,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  stockValues: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Showroom Section
  showroomSection: {
    padding: 16,
  },
  showroomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  showroomCard: {
    width: (width - 48) / 2, // 2 cards per row
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
  showroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  showroomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  showroomDetails: {
    gap: 4,
  },
  showroomText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ProductDetailsScreen;