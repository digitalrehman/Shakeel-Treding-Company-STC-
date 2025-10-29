import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { colors } from '../utils/color';

const ScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('Requesting permission...');
  const [scannedData, setScannedData] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(true);

  const device = useCameraDevice('back');

  /** ✅ Step 1: Request camera permission */
  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      console.log('Camera Permission:', permission);

      if (permission === 'granted') {
        setHasPermission(true);
        setCameraStatus('Camera ready - Point at QR code');
      } else {
        setHasPermission(false);
        setCameraStatus('Permission denied');
        Alert.alert(
          'Permission Required',
          'Please enable camera permission from settings to scan QR codes.',
        );
      }
    };
    requestPermission();
  }, []);

  /** ✅ Step 2: QR scanner with better handling */
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes[0]?.value && isScanning) {
        const scannedValue = codes[0].value;
        console.log('📱 Scanned QR Code:', scannedValue);
        
        setIsScanning(false);
        setScannedData(scannedValue);
        setScanHistory(prev => [
          {
            id: Date.now().toString(),
            data: scannedValue,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9)
        ]);
        setShowDataModal(true);
        
        setTimeout(() => {
          setIsScanning(true);
        }, 2000);
      }
    },
  });

  const formatScannedData = (data) => {
    try {
      const productCodes = [
        '803-1333', '803-1323', '803-0127', '830-0011', '803-0121',
        '830-0009', '830-0010', '815-0180', '815-0177', '815-0127',
        '815-0141', '815-0152', '815-0116', '815-0143', '815-0033',
        '815-0157', '815-0160', '815-0119', '815-0154', '815-0158',
        '815-0145', '815-0042', '815-0159', '815-0099', '815-0083',
        '815-0077'
      ];
      
      const foundCode = productCodes.find(code => data.includes(code));
      
      if (foundCode) {
        return {
          type: 'PRODUCT_CODE',
          code: foundCode,
          rawData: data,
          message: '✅ Product Code Identified'
        };
      }
      
      if (data.startsWith('http')) {
        return {
          type: 'URL',
          code: data,
          rawData: data,
          message: '🌐 Website Link'
        };
      }
      
      // Default text
      return {
        type: 'TEXT',
        code: data,
        rawData: data,
        message: '📄 Scanned Text'
      };
    } catch (error) {
      return {
        type: 'UNKNOWN',
        code: data,
        rawData: data,
        message: '❓ Unknown Format'
      };
    }
  };

  /** ✅ Handle modal close */
  const handleCloseModal = () => {
    setShowDataModal(false);
    setIsScanning(true);
  };

  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <Ionicons name="qr-code-outline" size={72} color={colors.primary} />
        <Text style={styles.loadingText}>{cameraStatus}</Text>
        <ActivityIndicator
          style={{ marginTop: 15 }}
          size="large"
          color={colors.primary}
        />
        {!device && hasPermission && (
          <Text style={styles.errorText}>
            Camera device not found. Trying to access back camera...
          </Text>
        )}
        
        {/* Scan History Preview */}
        {scanHistory.length > 0 && (
          <View style={styles.historyPreview}>
            <Text style={styles.historyTitle}>Recent Scans:</Text>
            <ScrollView style={styles.historyList}>
              {scanHistory.map((item) => (
                <Text key={item.id} style={styles.historyItem}>
                  {item.timestamp}: {item.data.substring(0, 30)}...
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="scan" size={28} color={colors.primary} />
        <Text style={styles.title}>QR Code Scanner</Text>
      </View>

      {/* Scanner Status */}
      <Text style={styles.statusText}>{cameraStatus}</Text>

      {/* Camera Container */}
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
          zoom={0}
          enableZoomGesture={true}
        />
        
        {/* Scanner Frame with Animation */}
        <View style={styles.scannerFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          
          {/* Scanning Animation Line */}
          {isScanning && <View style={styles.scanLine} />}
        </View>
        
        {/* Scanner Icon in Center */}
        <View style={styles.scannerIcon}>
          <Ionicons name="scan-outline" size={50} color="white" />
        </View>
      </View>

      {/* Instructions */}
      <Text style={styles.footer}>
        Point camera at QR code to scan automatically
      </Text>

      {/* Scan History Button */}
      {scanHistory.length > 0 && (
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setShowDataModal(true)}
        >
          <Ionicons name="list" size={20} color="white" />
          <Text style={styles.historyButtonText}>
            View Scans ({scanHistory.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Scanned Data Modal */}
      <Modal
        visible={showDataModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scanned Data</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {scannedData && (
              <View style={styles.dataContainer}>
                <View style={styles.dataType}>
                  <Ionicons 
                    name={formatScannedData(scannedData).type === 'PRODUCT_CODE' ? 'cube' : 'document'} 
                    size={24} 
                    color={colors.primary} 
                  />
                  <Text style={styles.dataTypeText}>
                    {formatScannedData(scannedData).message}
                  </Text>
                </View>
                
                <Text style={styles.dataLabel}>Scanned Code:</Text>
                <Text style={styles.dataValue}>
                  {formatScannedData(scannedData).code}
                </Text>
                
                <Text style={styles.dataLabel}>Full Data:</Text>
                <ScrollView style={styles.dataScroll}>
                  <Text style={styles.dataFullValue}>{scannedData}</Text>
                </ScrollView>
              </View>
            )}

            {/* Scan History in Modal */}
            {scanHistory.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Scan History:</Text>
                <ScrollView style={styles.historyList}>
                  {scanHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyTime}>{item.timestamp}</Text>
                      <Text style={styles.historyData}>{item.data}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>Continue Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 10,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    overflow: 'hidden',
    borderRadius: 18,
    marginVertical: 20,
    position: 'relative',
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
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
    borderRadius: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
    borderRadius: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
    borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
    borderRadius: 2,
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
    shadowRadius: 10,
    elevation: 5,
  },
  scannerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    opacity: 0.3,
  },
  footer: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 20,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  historyPreview: {
    marginTop: 30,
    width: '100%',
    maxHeight: 150,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  historyList: {
    maxHeight: 120,
  },
  historyItem: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyData: {
    fontSize: 14,
    color: colors.text,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dataContainer: {
    marginBottom: 20,
  },
  dataType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dataTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 10,
  },
  dataLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  dataScroll: {
    maxHeight: 100,
  },
  dataFullValue: {
    fontSize: 12,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  historySection: {
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});