import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  Vibration,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { colors } from '../utils/color';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const ScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraStatus, setCameraStatus] = useState(
    'Requesting camera permission...',
  );
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const device = useCameraDevice('back');
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const textInputRef = useRef(null);

  // ✅ Simple and reliable vibration feedback
  const playBeepSound = () => {
    try {
      const vibrationPattern = Platform.OS === 'ios' ? 100 : 200;
      Vibration.vibrate(vibrationPattern);
    } catch (error) {
      console.log('Vibration not available, continuing silently');
    }
  };

  // ✅ Custom Alert Modal
  const showCustomAlertModal = (title, message, onConfirm) => {
    setAlertConfig({
      title,
      message,
      onConfirm: onConfirm || (() => setShowCustomAlert(false))
    });
    setShowCustomAlert(true);
  };

  // ✅ Camera lifecycle management
  useFocusEffect(
    React.useCallback(() => {
      setIsCameraActive(true);
      setIsScanning(true);
      return () => {
        setIsCameraActive(false);
      };
    }, []),
  );

  // ✅ Auto focus input when modal opens
  useEffect(() => {
    if (showManualInput && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    }
  }, [showManualInput]);

  // ✅ Back button handle karein
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (loading || searchLoading) return true;
        if (showManualInput) {
          setShowManualInput(false);
          setManualInput('');
          return true;
        }
        if (showCustomAlert) {
          setShowCustomAlert(false);
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [loading, showManualInput, searchLoading, showCustomAlert]);

  /** ✅ Request camera permission */
  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'granted') {
        setHasPermission(true);
        setCameraStatus('Align QR code within frame');
      } else {
        setHasPermission(false);
        setCameraStatus('Camera permission required');
        showCustomAlertModal(
          'Camera Access Required',
          'Please enable camera permission to scan QR codes'
        );
      }
    };
    requestPermission();
  }, []);

  /** ✅ Flash Toggle Function */
  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };

  /** ✅ API Call Function with Better Error Handling */
  const fetchProductData = async (stockId, source = 'scan') => {
    try {
      if (source === 'manual') {
        setSearchLoading(true);
        Keyboard.dismiss();
      } else {
        setLoading(true);
      }
      setIsScanning(false);

      const formData = new FormData();
      formData.append('stock_id', stockId);

      const response = await fetch(
        'https://t.de2solutions.com/mobile_dash/stc_locations.php',
        {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        },
      );

      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      // ✅ Extract JSON from response
      let jsonString = responseText;
      if (responseText.includes('/') && responseText.includes('{')) {
        const jsonStartIndex = responseText.indexOf('{');
        jsonString = responseText.substring(jsonStartIndex);
      }

      // ✅ Try to parse JSON
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (parseError) {
        try {
          const lastBraceIndex = jsonString.lastIndexOf('}');
          if (lastBraceIndex !== -1) {
            const fixedJsonString = jsonString.substring(0, lastBraceIndex + 1);
            data = JSON.parse(fixedJsonString);
          } else {
            throw new Error('No valid JSON object found');
          }
        } catch {
          throw new Error('Invalid JSON response from server');
        }
      }

      // ✅ Response structure check karein
      if (data && (data.status === 'true' || data.status_basic === 'true')) {
        setTimeout(() => {
          setShowManualInput(false);
          setManualInput('');
          navigation.navigate('ProductDetails', {
            productData: data,
            stockId: stockId,
          });
        }, 1000);
      } else {
        // ✅ Data nahi mila - navigate nahi karenge
        showCustomAlertModal(
          'Product Not Found',
          `No product found with Stock ID: "${stockId}"`,
          () => {
            setIsScanning(true);
            if (source === 'manual') {
              setTimeout(() => textInputRef.current?.focus(), 500);
            }
          }
        );
      }
    } catch (error) {
      showCustomAlertModal(
        'Request Failed',
        error.message ||
          'Failed to fetch product data. Please check your connection and try again.',
        () => {
          setIsScanning(true);
          if (source === 'manual') {
            setTimeout(() => textInputRef.current?.focus(), 500);
          }
        }
      );
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  /** ✅ Extract stock_id from scanned data */
  const extractStockId = scannedData => {
    const stockIdPattern = /\b\d{3}-\d{4}\b/;
    const match = scannedData.match(stockIdPattern);
    if (match) return match[0];
    if (scannedData.length === 8 && scannedData.includes('-'))
      return scannedData;
    return null;
  };

  /** ✅ Smart Manual Input Handler */
  const handleManualInputChange = text => {
    const numbersOnly = text.replace(/[^\d]/g, '');
    if (numbersOnly.length > 7) return;

    if (numbersOnly.length > 3) {
      setManualInput(numbersOnly.slice(0, 3) + '-' + numbersOnly.slice(3));
    } else {
      setManualInput(numbersOnly);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.match(/^\d{3}-\d{4}$/)) {
      fetchProductData(manualInput, 'manual');
    } else {
      showCustomAlertModal(
        'Invalid Format',
        'Please enter exactly 7 digits in format: 803-1333\n\nFirst 3 digits + hyphen + last 4 digits'
      );
    }
  };

  /** ✅ QR scanner with Beep Sound */
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128', 'ean-13'],
    onCodeScanned: codes => {
      if (codes[0]?.value && isScanning && !loading) {
        const scannedValue = codes[0].value;

        // ✅ Beep sound play karo
        playBeepSound();

        setIsScanning(false);

        const stockId = extractStockId(scannedValue);
        if (stockId) {
          fetchProductData(stockId, 'scan');
        } else {
          showCustomAlertModal(
            'Invalid QR Code',
            'Scanned QR code does not contain a valid product ID format.',
            () => setTimeout(() => setIsScanning(true), 1500)
          );
        }
      }
    },
  });

  /** ✅ Close Manual Input */
  const closeManualInput = () => {
    setShowManualInput(false);
    setManualInput('');
    Keyboard.dismiss();
  };

  /** ✅ Custom Alert Modal Component */
  const CustomAlertModal = () => (
    <Modal
      visible={showCustomAlert}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowCustomAlert(false)}
    >
      <View style={styles.alertModalContainer}>
        <View style={styles.alertModalContent}>
          <Ionicons name="warning" size={48} color={colors.primary} style={styles.alertIcon} />
          <Text style={styles.alertTitle}>{alertConfig.title}</Text>
          <Text style={styles.alertMessage}>{alertConfig.message}</Text>
          <TouchableOpacity
            style={styles.alertButton}
            onPress={alertConfig.onConfirm}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  /** ✅ Camera not available UI */
  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <Ionicons name="qr-code-outline" size={80} color={colors.primary} />
        <Text style={styles.loadingText}>{cameraStatus}</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginVertical: 20 }}
        />

        {!device && hasPermission && (
          <Text style={styles.errorText}>
            Camera not available on this device
          </Text>
        )}

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Ionicons name="keypad" size={22} color={colors.primary} />
          <Text style={styles.manualButtonText}>Enter Stock ID Manually</Text>
        </TouchableOpacity>

        <CustomAlertModal />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="scan" size={26} color={colors.primary} />
          <Text style={styles.title}>QR Scanner</Text>
        </View>
      </View>

      {/* Scanner Status */}
      <Text style={styles.statusText}>
        {loading ? 'Fetching product details...' : cameraStatus}
      </Text>

      {/* Camera Container */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraActive && !loading && !showManualInput}
          codeScanner={codeScanner}
          zoom={0}
          audio={false}
          torch={isFlashOn ? 'on' : 'off'}
        />

        {/* Scanner Frame with Gradient Border */}
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scanning Animation Line */}
          {isScanning && !loading && <View style={styles.scanLine} />}
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Processing QR Code...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          Position the QR code within the frame to scan automatically
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowManualInput(true)}
          disabled={loading}
        >
          <Ionicons name="keypad" size={22} color={colors.primary} />
          <Text style={styles.actionButtonText}>Manual Input</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isFlashOn && styles.flashActive]}
          onPress={toggleFlash}
          disabled={loading}
        >
          <Ionicons
            name={isFlashOn ? 'flashlight' : 'flashlight-outline'}
            size={22}
            color={isFlashOn ? colors.text : colors.primary}
          />
          <Text
            style={[
              styles.actionButtonText,
              isFlashOn && styles.flashActiveText,
            ]}
          >
            {isFlashOn ? 'Flash On' : 'Flash'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeManualInput}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeManualInput}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Enter 7-digit Stock ID</Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                ref={textInputRef}
                style={styles.searchInput}
                placeholder="Enter stock ID..."
                placeholderTextColor={colors.textSecondary}
                value={manualInput}
                onChangeText={handleManualInputChange}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus={true}
                returnKeyType="search"
                onSubmitEditing={handleManualSubmit}
              />
              {manualInput.length > 0 && (
                <TouchableOpacity onPress={() => setManualInput('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                (!manualInput.match(/^\d{3}-\d{4}$/) || searchLoading) &&
                  styles.searchButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!manualInput.match(/^\d{3}-\d{4}$/) || searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="search" size={18} color={colors.text} />
                  <Text style={styles.searchButtonText}>Search Product</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlertModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 12,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    overflow: 'hidden',
    borderRadius: 20,
    position: 'relative',
    marginBottom: 30,
  },
  scannerFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingOverlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  flashActive: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  flashActiveText: {
    color: colors.text,
  },
  // Manual Input Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 8,
    marginBottom: 16,
  },
  searchButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom Alert Modal
  alertModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  alertButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  manualButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScannerScreen;