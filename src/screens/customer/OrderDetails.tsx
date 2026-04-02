import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const { width } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE      = '#FF6200';
const ORANGE_SOFT = '#FFF3EC';
const TEAL        = '#00897B';
const TEAL_DARK   = '#00695C';
const TEAL_BG     = '#E0F2F1';
const TEAL_BORDER = '#B2DFDB';
const WHITE       = '#FFFFFF';
const BG          = '#F7F9F8';
const TEXT_DARK   = '#1A2E2B';
const TEXT_MID    = '#4A6360';
const TEXT_SOFT   = '#8AA09E';
const BORDER      = '#EEF3F2';

// ── Status config ─────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ordered:   { label: 'Order Placed',    color: '#1E88E5', bg: '#E3F2FD', icon: 'receipt-outline'         },
  paid:      { label: 'Payment Done',    color: TEAL,      bg: TEAL_BG,   icon: 'card-outline'            },
  accepted:  { label: 'Vendor Accepted', color: TEAL,      bg: TEAL_BG,   icon: 'storefront-outline'      },
  received:  { label: 'Vendor Received', color: TEAL,      bg: TEAL_BG,   icon: 'storefront-outline'      },
  packaged:  { label: 'Packaged',        color: '#7B1FA2', bg: '#F3E5F5', icon: 'cube-outline'            },
  picked_up: { label: 'Picked Up',       color: ORANGE,    bg: ORANGE_SOFT, icon: 'bicycle-outline'       },
  enroute:   { label: 'On the Way',      color: ORANGE,    bg: ORANGE_SOFT, icon: 'navigate-outline'      },
  delivered: { label: 'Delivered',       color: '#2E7D32', bg: '#E8F5E9', icon: 'checkmark-done-outline'  },
  cancelled: { label: 'Cancelled',       color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline'    },
};

// ── Trackable statuses ────────────────────────────────
const TRACKABLE = ['ordered', 'paid', 'accepted', 'received', 'packaged', 'picked_up', 'enroute'];

export default function OrderDetail({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    fetchSettings();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (e) {
      console.log('OrderDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch settings just like Checkout does ────────
  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings || {});
    } catch (error) {
      console.log('Settings fetch error:', error);
      // Fallback defaults matching Checkout
      setSettings({
        delivery_fee: 500,
        service_charge_amount: 200,
      });
    }
  };

  // ── Loading ───────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading order details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not Found ─────────────────────────────────────
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={ORANGE} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorSub}>We couldn't load this order.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Data helpers ──────────────────────────────────
  const status    = order.status || 'ordered';
  const cfg       = statusConfig[status] || statusConfig.ordered;
  const items     = order.items || order.order_items || [];
  const canTrack  = TRACKABLE.includes(status);

  // ── Price breakdown ───────────────────────────────
  // Subtotal: sum item line totals (same approach as Checkout's totalPrice)
  const subtotal = items.length > 0
    ? items.reduce((sum: number, item: any) => {
        const unitPrice = parseFloat(item.price ?? item.unit_price ?? 0);
        const qty       = item.quantity ?? 1;
        return sum + unitPrice * qty;
      }, 0)
    : parseFloat(order.subtotal ?? order.total_amount ?? 0);

  // Delivery fee & service charge — prefer order fields, fall back to fetched settings
  const deliveryFee  = parseFloat(
    order.delivery_fee   ?? settings.delivery_fee          ?? 500
  );
  const serviceFee   = parseFloat(
    order.service_charge ?? settings.service_charge_amount ?? 200
  );
  const discount     = parseFloat(order.discount ?? 0);

  // Grand total — prefer backend value, otherwise compute
  const grandTotal   = parseFloat(
    order.grand_total ?? order.total_amount ?? (subtotal + deliveryFee + serviceFee - discount)
  );

  // Vendor name
  const vendorName =
    order.vendor?.name ??
    order.kitchen?.name ??
    items[0]?.vendor?.name ??
    'Vendor';

  // Order date
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-NG', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  // ── Render ────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          {order.order_number && (
            <Text style={styles.headerSub}>#{order.order_number}</Text>
          )}
        </View>
        {/* Status badge top-right */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Vendor / Kitchen info ─────────────────── */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorIconWrap}>
            <Ionicons name="storefront-outline" size={22} color={TEAL_DARK} />
          </View>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorLabel}>Ordered from</Text>
            <Text style={styles.vendorName}>{vendorName}</Text>
          </View>
          {orderDate && (
            <Text style={styles.orderDate}>{orderDate}</Text>
          )}
        </View>

        {/* ── Items list ─────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="bag-outline" size={14} color={ORANGE} />
            </View>
            <Text style={styles.sectionTitle}>Items Ordered</Text>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyItems}>No items found for this order.</Text>
          ) : (
            items.map((item: any, index: number) => {
              const itemName  = item.name ?? item.item_name ?? item.product_name ?? 'Item';
              const qty       = item.quantity ?? 1;
              const unitPrice = parseFloat(item.price ?? item.unit_price ?? 0);
              const lineTotal = unitPrice * qty;

              return (
                <View
                  key={item.id ?? index}
                  style={[styles.itemRow, index < items.length - 1 && styles.itemRowBorder]}
                >
                  <View style={styles.itemDot} />
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemQty}>x{qty}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {qty > 1 && (
                      <Text style={styles.itemUnitPrice}>₦{unitPrice.toLocaleString()} each</Text>
                    )}
                    <Text style={styles.itemLineTotal}>₦{lineTotal.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Price Breakdown ───────────────────────────
             Subtotal, delivery fee, service charge, discount, grand total
        ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="receipt-outline" size={14} color={ORANGE} />
            </View>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
          </View>

          {/* Subtotal */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₦{subtotal.toLocaleString()}</Text>
          </View>

          {/* Delivery fee — always shown, never free */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>₦{deliveryFee.toLocaleString()}</Text>
          </View>

          {/* Service Charge — always shown */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Charge</Text>
            <Text style={styles.priceValue}>₦{serviceFee.toLocaleString()}</Text>
          </View>

          {/* Discount – only show if present */}
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={[styles.priceValue, styles.priceDiscount]}>
                -₦{discount.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.priceDivider} />

          {/* Grand Total */}
          <View style={styles.priceRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>₦{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Delivery address (if available) ─────────── */}
        {order.delivery_address && (
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={16} color={TEAL_DARK} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Delivery Address</Text>
              <Text style={styles.addressValue}>{order.delivery_address}</Text>
            </View>
          </View>
        )}

        {/* ── Delivery code ─────────────────────────────
             Same card style as before — show to dispatcher on arrival
        ──────────────────────────────────────────────── */}
        {order.delivery_code && (
          <View style={styles.codeCard}>
            <View style={styles.codeLeft}>
              <Ionicons name="shield-checkmark" size={18} color={TEAL_DARK} />
              <View>
                <Text style={styles.codeLabel}>Delivery Code</Text>
                <Text style={styles.codeNote}>Show to dispatcher on arrival</Text>
              </View>
            </View>
            <Text style={styles.codeValue}>{order.delivery_code}</Text>
          </View>
        )}

        {/* ── TRACK ORDER BUTTON ──────────────────────── */}
        {canTrack && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate-outline" size={18} color={WHITE} />
            <Text style={styles.trackBtnText}>Track Order</Text>
            <Ionicons name="arrow-forward" size={16} color={WHITE} />
          </TouchableOpacity>
        )}

        {/* Delivered state */}
        {status === 'delivered' && (
          <View style={styles.deliveredBadge}>
            <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
            <Text style={styles.deliveredText}>This order was delivered successfully.</Text>
          </View>
        )}

        {/* Cancelled state */}
        {status === 'cancelled' && (
          <View style={[styles.deliveredBadge, styles.cancelledBadge]}>
            <Ionicons name="close-circle" size={22} color="#C62828" />
            <Text style={[styles.deliveredText, { color: '#C62828' }]}>This order was cancelled.</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:  { fontSize: 13, color: TEXT_SOFT },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: TEXT_DARK, letterSpacing: -0.2 },
  headerSub:    { fontSize: 11, color: TEXT_SOFT, fontWeight: '600', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 18 },

  // ── Error ──
  errorWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  errorSub:   { fontSize: 13, color: TEXT_SOFT, textAlign: 'center' },

  // ── Vendor card ──
  vendorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 16,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: TEAL_BORDER,
    gap: 12,
  },
  vendorIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: TEAL_BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: TEAL_BORDER,
  },
  vendorInfo:  { flex: 1 },
  vendorLabel: { fontSize: 10, color: TEXT_SOFT, fontWeight: '600', marginBottom: 2 },
  vendorName:  { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  orderDate:   { fontSize: 11, color: TEXT_SOFT, fontWeight: '500', textAlign: 'right', maxWidth: 90 },

  // ── Section card ──
  sectionCard: {
    backgroundColor: WHITE, borderRadius: 18,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: BORDER,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#FFF3EC', alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  emptyItems:   { fontSize: 13, color: TEXT_SOFT, textAlign: 'center', paddingVertical: 16 },

  // ── Item row ──
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, gap: 10,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  itemDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: TEAL, flexShrink: 0, marginTop: 2,
  },
  itemLeft:      { flex: 1 },
  itemName:      { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  itemQty:       { fontSize: 11, fontWeight: '600', color: TEXT_SOFT },
  itemRight:     { alignItems: 'flex-end' },
  itemUnitPrice: { fontSize: 10, color: TEXT_SOFT, marginBottom: 2 },
  itemLineTotal: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },

  // ── Price rows ──
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  priceLabel:    { fontSize: 13, color: TEXT_MID, fontWeight: '500' },
  priceValue:    { fontSize: 13, color: TEXT_DARK, fontWeight: '600' },
  priceDiscount: { color: '#2E7D32' },
  priceDivider:  { height: 1, backgroundColor: BORDER, marginVertical: 6 },
  grandLabel:    { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  grandValue:    { fontSize: 17, fontWeight: '900', color: TEAL_DARK },

  // ── Address ──
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: WHITE, borderRadius: 14,
    padding: 14, marginBottom: 14, gap: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  addressText:  { flex: 1 },
  addressLabel: { fontSize: 10, color: TEXT_SOFT, fontWeight: '600', marginBottom: 3 },
  addressValue: { fontSize: 13, color: TEXT_DARK, fontWeight: '600', lineHeight: 19 },

  // ── Delivery code ──
  codeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: WHITE, borderRadius: 14,
    padding: 14, marginBottom: 14,
    borderWidth: 1.5, borderColor: TEAL_BORDER,
  },
  codeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  codeLabel: { fontSize: 13, fontWeight: '700', color: TEAL_DARK, marginBottom: 2 },
  codeNote:  { fontSize: 10, color: TEXT_SOFT },
  codeValue: { fontSize: 22, fontWeight: '900', color: TEAL_DARK, letterSpacing: 4 },

  // ── Track Order button ──
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: TEAL_DARK,
    paddingVertical: 16, borderRadius: 18,
    marginBottom: 14,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  trackBtnText: {
    color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.3,
  },

  // ── Delivered / Cancelled banners ──
  deliveredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F5E9', borderRadius: 14,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#A5D6A7',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE', borderColor: '#EF9A9A',
  },
  deliveredText: {
    fontSize: 13, fontWeight: '600', color: '#2E7D32', flex: 1,
  },
});