import React, { useState, useEffect } from 'react';
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

const { width } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productData, stockId } = route.params;
  const basicInfo = productData.data_basic || {};
  const locations = productData.data || [];
  const showroomData = productData.data_show || [];
  
  // Current date and time state
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Function to format date and time
  const getFormattedDateTime = () => {
    const now = new Date();
    
    // Format date as dd/mm/yyyy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    // Format time as 12-hour format
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    
    return `${formattedDate} ${formattedTime}`;
  };

  // Update date and time every second
  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());
    
    const interval = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Alternative static image URL
  const productImage =
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1st Section: Product Title with Date & Time */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {basicInfo.description || 'Product Name'}
          </Text>
          <Text style={styles.stockId}>Stock ID: {stockId}</Text>
          {/* Current Date and Time Display */}
          <View style={styles.dateTimeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateTimeText}>
              {currentDateTime}
            </Text>
          </View>
        </View>

        {/* 2nd Section: Stock Locations */}
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

        {/* 3rd Section: Showroom Display */}
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

        {/* 4th Section: Product Information */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.detailsGrid}>
            <DetailBox label="Pieces" value={basicInfo.Pcs} />
            <DetailBox label="Boxes" value={basicInfo.boxes} />
            <DetailBox label="SQ Price" value={`Rs. ${basicInfo.sq_price}`} />
            <DetailBox label="Packing" value={basicInfo.packing} />
            <DetailBox label="Units" value={basicInfo.units} />
            <DetailBox label="UOM" value={basicInfo.units} />
          </View>
        </View>

        {/* 5th Section: Product Image */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>
      </ScrollView>
    </View>
  );
};

// Detail Box Component - 3 per row (icons removed)
const DetailBox = ({ label, value }) => (
  <View style={styles.detailBox}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value || 'N/A'}
    </Text>
  </View>
);

// Function to remove trailing zeros after decimal point
const formatNumber = number => {
  if (number === null || number === undefined) return '0';
  // Convert to string and remove trailing zeros after decimal
  return Number(number).toString().replace(/\.0+$/, '');
};

// Location Card Component
const LocationCard = ({ location, index }) => (
  <View style={styles.locationCard}>
    <View style={styles.locationHeader}>
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
  const getConfig = type => {
    switch (type) {
      case 'available':
        return {
          icon: 'checkmark-circle',
          color: colors.success,
          label: 'Available',
        };
      case 'reserved':
        return { icon: 'time', color: colors.primaryLight, label: 'Reserved' };
      case 'physical':
        return { icon: 'cube', color: colors.primary, label: 'Physical' };
      default:
        return {
          icon: 'help-circle',
          color: colors.textSecondary,
          label: 'Unknown',
        };
    }
  };

  const config = getConfig(type);

  return (
    <View style={styles.stockInfo}>
      <View style={styles.stockHeader}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.stockLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
      <View style={styles.stockValues}>
        <Text style={styles.stockText}>
          B: {Number(formatNumber(boxes)).toFixed(0)}
        </Text>
        <Text style={styles.stockText}>
          P: {Number(formatNumber(pcs)).toFixed(0)}
        </Text>
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
      <Text style={styles.showroomText}>Display: {showroom.display_id}</Text>
      <Text style={styles.showroomText}>
        Boxes: {formatNumber(showroom.boxes)}
      </Text>
      <Text style={styles.showroomText}>
        Pieces: {formatNumber(showroom.Pcs)}
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
  // Image Section - Last section
  imageSection: {
    width: '100%',
    height: 200,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  // Title Section - 1st section
  titleSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  // Date Time Container
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  // Details Section - 4th section
  detailsSection: {
    paddingInline: 16,
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
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  // Locations Section - 2nd section
  locationsSection: {
    paddingInline: 16,
    marginTop: 16,
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
    padding: 6,
    borderRadius: 6,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  stockValues: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Showroom Section - 3rd section
  showroomSection: {
    paddingInline: 16,
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