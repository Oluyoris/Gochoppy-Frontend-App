import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../api/api';

// ─── Design Tokens ────────────────────────────────────────────────
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const C = {
  bg:          '#EAF6F4',
  surface:     '#FFFFFF',
  tealDeep:    '#0D6E63',
  tealMid:     '#17A898',
  tealLight:   '#C8EDEA',
  tealGlow:    '#E2F7F5',
  ink:         '#0A2724',
  inkMid:      '#2D5550',
  inkLight:    '#7AA8A3',
  amber:       '#E8821A',
  amberLight:  '#FEF0E0',
  blue:        '#2672C8',
  blueLight:   '#E5F0FC',
  violet:      '#6B52D4',
  violetLight: '#EDE9FA',
  green:       '#1A9060',
  greenLight:  '#E2F5EC',
  red:         '#D93030',
  redLight:    '#FDECEC',
  border:      '#C8EDEA',
  borderLight: '#E5F5F3',
  white:       '#FFFFFF',
};

export default function VendorOrderDetails() {
  // ─── ALL LOGIC UNTOUCHED ──────────────────────────────────────
  const route = useRoute<any>();
  const { orderId } = route.params;
  const navigation = useNavigation();

  const [order, setOrder]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      Alert.alert('Error', 'No order ID provided');
      navigation.goBack();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vendor/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (error: any) {
      console.log('Order details error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    Alert.alert('Accept Order', `Accept Order #${order.order_number}?`, [
      { text: 'Cancel' },
      {
        text: 'Yes, Accept',
        onPress: async () => {
          try {
            setUpdating(true);
            await api.patch(`/vendor/orders/${order.id}/status`, { status: 'accepted' });
            setOrder((prev: any) => ({ ...prev, status: 'accepted' }));
            Alert.alert('Success', 'Order accepted!');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to accept');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handlePackageReady = async () => {
    Alert.alert('Package Ready', `Mark Order #${order.order_number} as packaged and ready?`, [
      { text: 'Cancel' },
      {
        text: 'Yes, Package Ready',
        onPress: async () => {
          try {
            setUpdating(true);
            await api.patch(`/vendor/orders/${order.id}/status`, { status: 'packaged' });
            setOrder((prev: any) => ({ ...prev, status: 'packaged' }));
            Alert.alert('Success', 'Order marked as Packaged Ready!');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  // ─── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={C.red} />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATUS META ──────────────────────────────────────────────
  const status = (order.status || '').toLowerCase();
  const isNew      = ['ordered', 'paid'].includes(status);
  const isReceived = status === 'accepted';
  const isPackaged = status === 'packaged';

  let statusColor   = C.inkLight;
  let statusBg      = C.tealGlow;
  let statusDisplay = order.status || 'Unknown';
  let statusIcon: any = 'help-circle-outline';

  if (isNew) {
    statusColor   = C.amber;   statusBg = C.amberLight;
    statusDisplay = status === 'paid' ? 'Paid – Accept Now' : 'New Order';
    statusIcon    = 'receipt-outline';
  } else if (isReceived) {
    statusColor   = C.blue;    statusBg = C.blueLight;
    statusDisplay = 'Vendor Received Order';
    statusIcon    = 'thumbs-up-outline';
  } else if (isPackaged) {
    statusColor   = C.violet;  statusBg = C.violetLight;
    statusDisplay = 'Packaged Ready';
    statusIcon    = 'cube-outline';
  } else if (['delivered', 'completed'].includes(status)) {
    statusColor   = C.green;   statusBg = C.greenLight;
    statusDisplay = 'Delivered';
    statusIcon    = 'checkmark-circle-outline';
  } else if (status.includes('cancel')) {
    statusColor   = C.red;     statusBg = C.redLight;
    statusDisplay = 'Cancelled';
    statusIcon    = 'close-circle-outline';
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── ORDER HERO STRIP ────────────────────────────────────── */}
      <View style={styles.heroStrip}>
        <View>
          <Text style={styles.heroLabel}>ORDER</Text>
          <Text style={styles.heroOrderNum}>#{order.order_number}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Ionicons name={statusIcon} size={13} color={statusColor} style={{ marginRight: 5 }} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusDisplay}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── CUSTOMER CARD ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="person-outline" size={14} color={C.tealDeep} />
            </View>
            <Text style={styles.cardTitle}>Customer</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{order.customer?.name || 'N/A'}</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{order.customer?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
              {order.delivery_address || 'N/A'}
            </Text>
          </View>
        </View>

        {/* ── ITEMS CARD ───────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="bag-outline" size={14} color={C.tealDeep} />
            </View>
            <Text style={styles.cardTitle}>Items Ordered</Text>
          </View>

          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemDetail}>
                  {item.quantity} × ₦{Number(item.price).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.itemPrice}>₦{Number(item.subtotal).toLocaleString()}</Text>
            </View>
          ))}

          {/* Earnings */}
          <View style={styles.earningsBox}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsValue}>
                ₦{Number(order.vendor_earnings || order.items_total || 0).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.earningsRow, { marginTop: 6 }]}>
              <Text style={styles.grandLabel}>Customer Paid (incl. fees)</Text>
              <Text style={styles.grandValue}>
                ₦{Number(order.grand_total || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── STATUS CARD ──────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="pulse-outline" size={14} color={C.tealDeep} />
            </View>
            <Text style={styles.cardTitle}>Order Status</Text>
          </View>
          <View style={[styles.statusFullRow, { backgroundColor: statusBg }]}>
            <Ionicons name={statusIcon} size={18} color={statusColor} />
            <Text style={[styles.statusFullText, { color: statusColor }]}>{statusDisplay}</Text>
          </View>
        </View>

        {/* ── ACTION BUTTONS ───────────────────────────────────── */}
        {isNew && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.green }]}
            onPress={handleAcceptOrder}
            disabled={updating}
            activeOpacity={0.85}
          >
            {updating ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
                <Text style={styles.actionText}>ACCEPT ORDER</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isReceived && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.violet }]}
            onPress={handlePackageReady}
            disabled={updating}
            activeOpacity={0.85}
          >
            {updating ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="cube-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
                <Text style={styles.actionText}>MARK PACKAGE READY</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: C.inkLight,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: C.red,
    fontWeight: '600',
    marginTop: 8,
  },

  // Header
  header: {
    backgroundColor: C.tealDeep,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },

  // Hero strip
  heroStrip: {
    backgroundColor: C.tealMid,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: C.tealLight,
    letterSpacing: 2,
    marginBottom: 1,
  },
  heroOrderNum: {
    fontSize: 18,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.tealDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: 0.1,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: C.inkLight,
    fontWeight: '600',
    minWidth: 60,
  },
  infoValue: {
    fontSize: 12,
    color: C.inkMid,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  dividerLine: {
    height: 1,
    backgroundColor: C.borderLight,
  },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.tealMid,
    marginTop: 5,
    flexShrink: 0,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 18,
  },
  itemDetail: {
    fontSize: 11,
    color: C.inkLight,
    marginTop: 2,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.tealDeep,
  },

  // Earnings box
  earningsBox: {
    backgroundColor: C.tealGlow,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.tealDeep,
  },
  earningsValue: {
    fontSize: 17,
    fontWeight: '900',
    color: C.tealDeep,
    letterSpacing: -0.3,
  },
  grandLabel: {
    fontSize: 11,
    color: C.inkLight,
    fontWeight: '500',
  },
  grandValue: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMid,
  },

  // Status full row
  statusFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusFullText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});