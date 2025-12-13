import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/color';
import { API_URL } from '@env';
import { useCart } from '../Context/CartContext';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { decode } from 'base-64';

if (typeof atob === 'undefined') {
  global.atob = decode;
}

const InquiryScreen = ({ navigation }) => {
  const { loadCartFromOrder } = useCart();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `${API_URL}pending_quotation.php?_=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      if (
        jsonData.status === 'true' &&
        jsonData.data &&
        Array.isArray(jsonData.data)
      ) {
        setData(jsonData.data);
      } else if (Array.isArray(jsonData)) {
        setData(jsonData);
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        setData(jsonData.data);
      } else {
        setData([]);
        if (!jsonData.data) {
          throw new Error('No data found in response');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    if (!amount && amount !== 0) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return 'Invalid amount';

    return `Rs ${numAmount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleEditOrder = async orderNo => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('order_no', orderNo);

      const response = await fetch(`${API_URL}pending_quotation_item.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log(result);

      if (result.status === 'true' && result.data) {
        loadCartFromOrder(result.data, result.header_data?.[0]);
        Toast.show({
          type: 'success',
          text1: 'Order Loaded',
          text2: 'Order items have been loaded into cart',
        });
        navigation.navigate('CartScreen');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load order items',
        });
      }
    } catch (error) {
      console.error('Edit order error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while loading order',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (header, items) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 50;
      const fontSize = 10;
      const titleSize = 14;
      const smallSize = 8;

      // Helper to draw text
      const drawText = (
        text,
        x,
        y,
        size = fontSize,
        fontToUse = font,
        color = rgb(0, 0, 0),
      ) => {
        page.drawText(String(text), { x, y, size, font: fontToUse, color });
      };

      // Helper to draw line
      const drawLine = (x1, y1, x2, y2, thickness = 1) => {
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness,
          color: rgb(0, 0, 0),
        });
      };

      // --- Helper Functions ---
      const numberToWords = num => {
        if (!num) return '';
        const a = [
          '',
          'One ',
          'Two ',
          'Three ',
          'Four ',
          'Five ',
          'Six ',
          'Seven ',
          'Eight ',
          'Nine ',
          'Ten ',
          'Eleven ',
          'Twelve ',
          'Thirteen ',
          'Fourteen ',
          'Fifteen ',
          'Sixteen ',
          'Seventeen ',
          'Eighteen ',
          'Nineteen ',
        ];
        const b = [
          '',
          '',
          'Twenty',
          'Thirty',
          'Forty',
          'Fifty',
          'Sixty',
          'Seventy',
          'Eighty',
          'Ninety',
        ];

        const n = ('000000000' + num)
          .slice(-9)
          .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str +=
          n[1] != 0
            ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore '
            : '';
        str +=
          n[2] != 0
            ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh '
            : '';
        str +=
          n[3] != 0
            ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand '
            : '';
        str +=
          n[4] != 0
            ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred '
            : '';
        str +=
          n[5] != 0
            ? (str != '' ? 'and ' : '') +
              (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])
            : '';
        return str + 'Only';
      };

      // --- Header ---
      // "SALES QUOTATION" Title
      drawText(
        'SALES QUOTATION',
        width - 250,
        y,
        20,
        boldFont,
        rgb(0.6, 0.6, 0.6),
      );

      // Warehouse Info
      drawText('WAREHOUSE I-9:', 50, y, 10, boldFont);
      y -= 12;
      drawText('PLOT NO 231-232, ST NO. 7, I-9/2, ISLAMABAD.', 50, y, 8);
      y -= 10;
      drawText('(7) 051-6133238, (8) 051-6130686, (9) 051-2751461', 50, y, 8);
      y -= 20;

      // Second Address
      drawText('T.CHOWK: 1 KM-TCHOWK, NEAR NOOR MAHAL MARQUEE, GT', 50, y, 8);
      y -= 10;
      drawText('ROAD, RAWALPINDI. 051-3757525', 50, y, 8);

      // Date and Quote No (Right side)
      const dateStr =
        header.trans_date || new Date().toLocaleDateString('en-GB');
      const quoteNo = header.trans_no || header.reference || '';

      const rightColLabel = width - 200;
      const rightColValue = width - 100;
      const headerY = y + 30; // Align with address roughly

      drawText('Date', rightColLabel, headerY, 9);
      drawText(dateStr, rightColValue, headerY, 9);
      drawText('Quotation No', rightColLabel, headerY - 12, 9);
      drawText(quoteNo, rightColValue, headerY - 12, 9);

      y -= 20;
      drawLine(50, y, width - 50, y, 1.5); // Thick line
      y -= 15;

      // --- Customer Section ---
      drawText('Customer', 50, y, 10, boldFont);
      y -= 15;
      drawText(header.name || 'N/A', 50, y, 10, boldFont);
      y -= 12;
      drawText(header.phone || '', 50, y, 10);
      y -= 25;

      // --- Sales Person Box ---
      const boxTop = y;
      const boxWidth = width - 100;

      // Draw box background for header
      page.drawRectangle({
        x: 50,
        y: y - 12,
        width: boxWidth,
        height: 12,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Draw box outline
      page.drawRectangle({
        x: 50,
        y: y - 25,
        width: boxWidth,
        height: 25,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Vertical divider
      drawLine(width / 2, y, width / 2, y - 25);
      // Horizontal divider
      drawLine(50, y - 12, width - 50, y - 12);

      // Text
      drawText('Sales Person', 50 + boxWidth / 4 - 25, y - 9, 9, boldFont);
      drawText('Contact No', width / 2 + boxWidth / 4 - 25, y - 9, 9, boldFont);

      drawText(header.salesman || 'N/A', 50 + boxWidth / 4 - 30, y - 22, 9);
      drawText(
        header.salesman_contact || '-',
        width / 2 + boxWidth / 4 - 30,
        y - 22,
        9,
      );

      y -= 40;

      // --- Items Table ---
      const tableTop = y;
      const colX = [50, 75, 240, 280, 310, 340, 380, 410, 450, 490];
      // Sr, Product, Packing, Box, Pc, Qty, Uom, Rate, Disc, Amount
      const colWidths = [25, 165, 40, 30, 30, 40, 30, 40, 40, 55]; // Approximate widths

      // Table Header Background
      page.drawRectangle({
        x: 50,
        y: y - 15,
        width: width - 100,
        height: 15,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Table Header Text
      const headers = [
        'Sr.',
        'Product',
        'Packing',
        'Box',
        'Pc',
        'Qty',
        'Uom',
        'Rate',
        'Disc',
        'Amount',
      ];
      headers.forEach((h, i) => {
        // Center align headers roughly
        let xPos = colX[i];
        if (i > 1) xPos += 2; // Adjust for center
        if (i === 9) xPos += 10; // Adjust Amount
        drawText(h, xPos, y - 11, 8, boldFont);
      });

      // Header Border
      page.drawRectangle({
        x: 50,
        y: y - 15,
        width: width - 100,
        height: 15,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      y -= 25;

      // Items Loop
      let totalAmount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        drawText((i + 1).toString(), colX[0] + 2, y, 8);

        // Product Description
        let desc = item.description || '';
        if (desc.length > 35) desc = desc.substring(0, 32) + '...';
        drawText(desc, colX[1], y, 8);

        drawText(item.packing || '-', colX[2] + 5, y, 8);
        drawText(item.box || '-', colX[3] + 5, y, 8);
        drawText(item.pc || '-', colX[4] + 5, y, 8);
        drawText(item.qty || '-', colX[5] + 5, y, 8);
        drawText(item.uom || '-', colX[6] + 5, y, 8);

        const rate = item.rate || item.unit_price || '-';
        drawText(rate.toString(), colX[7], y, 8);

        const disc = item.disc || '0.00';
        drawText(disc.toString(), colX[8] + 5, y, 8);

        const amount = item.amount || item.total || '0';
        // Right align amount
        const amountWidth = font.widthOfTextAtSize(amount.toString(), 8);
        drawText(
          amount.toString(),
          colX[9] + colWidths[9] - amountWidth - 5,
          y,
          8,
        );

        // Long description
        if (item.long_description) {
          y -= 10;
          drawText(
            item.long_description,
            colX[1],
            y,
            7,
            font,
            rgb(0.4, 0.4, 0.4),
          );
        }

        y -= 12;

        // Calculate total
        const val = parseFloat(amount.toString().replace(/,/g, ''));
        if (!isNaN(val)) totalAmount += val;
      }

      // --- Totals Section (Inside Table Box) ---
      y -= 20; // Space before totals

      const discount = parseFloat(header.discount || 0);
      const finalTotal = totalAmount - discount;
      const formatNum = n =>
        n.toLocaleString('en-PK', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      const labelX = 400;
      const valueX = 490;

      drawText('Sub-total', labelX, y, 8, boldFont);
      let valWidth = font.widthOfTextAtSize(formatNum(totalAmount), 8);
      drawText(
        formatNum(totalAmount),
        valueX + colWidths[9] - valWidth - 5,
        y,
        8,
      );
      y -= 12;

      drawText('Discount', labelX, y, 8, boldFont);
      valWidth = font.widthOfTextAtSize(formatNum(discount), 8);
      drawText(formatNum(discount), valueX + colWidths[9] - valWidth - 5, y, 8);
      y -= 12;

      drawText('QUOTATION TOTAL', labelX - 20, y, 9, boldFont);
      valWidth = boldFont.widthOfTextAtSize(formatNum(finalTotal), 9);
      drawText(
        formatNum(finalTotal),
        valueX + colWidths[9] - valWidth - 5,
        y,
        9,
        boldFont,
      );

      y -= 10; // Bottom padding

      // Draw Main Table Border (from header bottom to current y)
      const tableBottom = y;
      const tableHeight = tableTop - 15 - tableBottom;

      page.drawRectangle({
        x: 50,
        y: tableBottom,
        width: width - 100,
        height: tableHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Vertical Lines for Columns (Full Height)
      const drawVert = x => drawLine(x, tableTop - 15, x, tableBottom);

      drawVert(colX[1] - 2); // After Sr
      drawVert(colX[2] - 2); // After Product
      drawVert(colX[3] - 2); // After Packing
      drawVert(colX[4] - 2); // After Box
      drawVert(colX[5] - 2); // After Pc
      drawVert(colX[6] - 2); // After Qty
      drawVert(colX[7] - 2); // After Uom
      drawVert(colX[8] - 2); // After Rate
      drawVert(colX[9] - 2); // After Disc

      y -= 20;

      // Amount in Words
      drawText(`Amount in words: ${numberToWords(finalTotal)}`, 50, y, 8);
      y -= 40;

      // --- Signatures ---
      const sigY = y;
      drawText('FAIZAN', 100, sigY);
      drawLine(80, sigY - 5, 180, sigY - 5);
      drawText('Prepared By', 100, sigY - 15, 8);

      drawLine(width - 180, sigY - 5, width - 80, sigY - 5);
      drawText('Approved By', width - 160, sigY - 15, 8);

      // Save PDF
      const pdfBase64 = await pdfDoc.saveAsBase64();

      // Save to CacheDir (better for sharing)
      const fileName = `Quotation_${quoteNo}.pdf`;
      const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(path, pdfBase64, 'base64');

      console.log('PDF saved to:', path);
      return path;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  };

  const handleShare = async item => {
    try {
      const id = item.order_no || item.trans_no;
      setSharingId(id);

      const formData = new FormData();
      formData.append('trans_no', id);
      formData.append('type', item.type);

      const response = await fetch(`${API_URL}view_data.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      let headerData = null;
      let detailsData = [];

      if (result.status_header === 'true' && result.data_header?.length > 0) {
        headerData = result.data_header[0];
      }

      if (result.status_detail === 'true' && result.data_detail?.length > 0) {
        detailsData = result.data_detail;
      }

      if (!headerData) {
        throw new Error('Could not fetch order details');
      }

      // Generate PDF
      const filePath = await generatePDF(headerData, detailsData);

      const shareUrl = `file://${filePath}`;
      console.log('Sharing URL:', shareUrl);

      const shareOptions = {
        url: shareUrl,
        type: 'application/pdf',
        title: `Quotation ${headerData.trans_no}`,
        message: `Quotation ${headerData.trans_no} - ${headerData.name}`,
        subject: `Quotation ${headerData.trans_no}`,
        failOnCancel: false,
      };

      await Share.open(shareOptions);

      Toast.show({
        type: 'success',
        text1: 'Shared Successfully',
        text2: 'PDF has been generated and shared',
      });
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: error.message || 'Could not share inquiry',
      });
    } finally {
      setSharingId(null);
    }
  };

  const CardItem = ({ item, index }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.referenceContainer}>
            <Ionicons
              name="document-text"
              size={16}
              color={colors.primaryLight}
            />
            <Text style={styles.referenceLabel}>Reference:</Text>
            <Text style={styles.referenceValue} numberOfLines={1}>
              {item.reference || item.order_no || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: colors.success },
            ]}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.name || 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.label}>Order Date:</Text>
          <Text style={styles.value}>{formatDate(item.ord_date)}</Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Ionicons name="cash" size={18} color={colors.primary} />
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate('InquiryDetailsScreen', {
                order_no: item.order_no || item.trans_no,
                type: item.type,
              })
            }
          >
            <Text style={styles.detailsButtonText}>Details</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailsButton, { marginLeft: 8 }]}
            onPress={() => handleEditOrder(item.order_no || item.trans_no)}
          >
            <Text style={styles.detailsButtonText}>Edit</Text>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailsButton, { marginLeft: 8 }]}
            onPress={() => handleShare(item)}
            disabled={sharingId === (item.order_no || item.trans_no)}
          >
            {sharingId === (item.order_no || item.trans_no) ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.detailsButtonText}>Share</Text>
                <Ionicons
                  name="share-social-outline"
                  size={16}
                  color={colors.primary}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="document" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) =>
          `${item.reference || item.order_no || 'item'}-${index}`
        }
        renderItem={({ item, index }) => <CardItem item={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Inquiries"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(42, 36, 31, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referenceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalRow: {
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 155, 67, 0.2)',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
    marginRight: 8,
    width: 100,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 6,
  },
});

export default InquiryScreen;
