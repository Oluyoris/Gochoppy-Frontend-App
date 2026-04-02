import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';
import { VendorNavigationProp } from '../../navigation/types';

// ─── Design Tokens ────────────────────────────────────────────────
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const C = {
  bg:          '#F4F7F6',
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
  amberBorder: '#F5D4AC',
  blue:        '#2672C8',
  blueLight:   '#E5F0FC',
  violet:      '#6B52D4',
  violetLight: '#EDE9FA',
  green:       '#1A9060',
  greenLight:  '#E2F5EC',
  red:         '#D93030',
  redLight:    '#FDECEC',
  border:      '#E5F0EE',
  white:       '#FFFFFF',
};

export default function VendorOrders() {
  const navigation = useNavigation<VendorNavigationProp>();
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'processing' | 'completed' | 'all'>('new');

  // ─── ALL LOGIC UNTOUCHED ──────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor/orders');
      let allOrders = res.data.orders || [];

      allOrders = allOrders.sort((a: any, b: any) => {
        const aStatus = (a.status || '').toLowerCase();
        const bStatus = (b.status || '').toLowerCase();
        const isANew = ['ordered', 'paid'].includes(aStatus);
        const isBNew = ['ordered', 'paid'].includes(bStatus);
        if (isANew && !isBNew) return -1;
        if (isBNew && !isANew) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setOrders(allOrders);
    } catch (error) {
      console.log('Orders fetch error:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    return orders.filter((order) => {
      const status = (order.status || '').toLowerCase().trim();
      if (activeTab === 'new')        return status === 'ordered' || status === 'paid';
      if (activeTab === 'processing') return status === 'received' || status === 'packaged';
      if (activeTab === 'completed')  return ['delivered', 'completed', 'cancelled'].includes(status);
      return false;
    });
  };

  const tabs = [
    { id: 'new',        label: 'New',        icon: 'flash-outline'            },
    { id: 'processing', label: 'Processing', icon: 'sync-outline'             },
    { id: 'completed',  label: 'Completed',  icon: 'checkmark-circle-outline' },
    { id: 'all',        label: 'All',        icon: 'list-outline'             },
  ] as const;

  const getStatusMeta = (status: string) => {
    if (status === 'paid')     return { label: 'Paid',        color: C.amber,    bg: C.amberLight,  icon: 'card-outline' as const };
    if (status === 'ordered')  return { label: 'New Order',   color: C.amber,    bg: C.amberLight,  icon: 'receipt-outline' as const };
    if (status === 'received') return { label: 'Accepted',    color: C.blue,     bg: C.blueLight,   icon: 'thumbs-up-outline' as const };
    if (status === 'packaged') return { label: 'Packaged',    color: C.violet,   bg: C.violetLight, icon: 'cube-outline' as const };
    if (status === 'delivered' || status === 'completed')
                               return { label: 'Delivered',   color: C.green,    bg: C.greenLight,  icon: 'checkmark-circle-outline' as const };
    if (status.includes('cancel')) return { label: 'Cancelled', color: C.red,    bg: C.redLight,    icon: 'close-circle-outline' as const };
    return                           { label: status,           color: C.inkLight, bg: C.tealGlow,  icon: 'help-circle-outline' as const };
  };

  // ─── Counts for stat strip ─────────────────────────────────────
  const newCount        = orders.filter(o => ['ordered','paid'].includes((o.status||'').toLowerCase())).length;
  const processingCount = orders.filter(o => ['received','packaged'].includes((o.status||'').toLowerCase())).length;
  const totalCount      = orders.length;

  // ─── Order card ───────────────────────────────────────────────
  const renderOrder = ({ item }: { item: any }) => {
    const status = (item.status || '').toLowerCase().trim();
    const isNew  = ['ordered', 'paid'].includes(status);
    const meta   = getStatusMeta(status);
    const initial = (item.customer?.name || 'C').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.card, isNew && styles.cardNew]}
        onPress={() => navigation.navigate('VendorOrderDetails', { orderId: item.id })}
        activeOpacity={0.78}
      >
        {/* Coloured left accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

        <View style={styles.cardBody}>

          {/* Top row */}
          <View style={styles.cardTop}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: meta.bg }]}>
              <Text style={[styles.avatarText, { color: meta.color }]}>{initial}</Text>
            </View>

            {/* Order # + customer */}
            <View style={styles.cardMeta}>
              <Text style={styles.orderNum}>#{item.order_number}</Text>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customer?.name || 'Customer'}
              </Text>
            </View>

            {/* NEW pulse badge */}
            {isNew && (
              <View style={styles.newBadge}>
                <View style={styles.newDot} />
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Bottom row */}
          <View style={styles.cardBottom}>
            {/* Amount */}
            <Text style={styles.amount}>
              ₦{Number(item.grand_total || 0).toLocaleString()}
            </Text>

            {/* Status pill */}
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={10} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>

            {/* Date + chevron */}
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short',
                })}
              </Text>
              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={11} color={C.tealDeep} />
              </View>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.tealDeep} />

      {/* ════════════════════════════════════════════════
          HEADER — deep teal, eyebrow + title + refresh
      ════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>VENDOR PORTAL</Text>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* ════════════════════════════════════════════════
          STATS STRIP — 3 metrics on a slightly lighter
          teal band directly below the header
      ════════════════════════════════════════════════ */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{newCount}</Text>
          <Text style={styles.statLbl}>New</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{processingCount}</Text>
          <Text style={styles.statLbl}>Processing</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{totalCount}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
      </View>

      {/* ════════════════════════════════════════════════
          TABS — horizontal pill row
      ════════════════════════════════════════════════ */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'new'        ? newCount :
              tab.id === 'processing' ? processingCount :
              tab.id === 'all'        ? totalCount : null;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={12}
                  color={isActive ? C.white : C.inkLight}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {count !== null && count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ════════════════════════════════════════════════
          CONTENT — loading / empty / list
      ════════════════════════════════════════════════ */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="receipt-outline" size={34} color={C.tealMid} />
          </View>
          <Text style={styles.emptyTitle}>
            No {activeTab !== 'all' ? activeTab : ''} orders
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'new'
              ? 'New orders will appear here instantly'
              : 'Nothing to show in this category yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled
          bounces
          keyboardShouldPersistTaps="handled"
        />
      )}

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.tealDeep,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 12 : 12,
    paddingBottom: 14,
  },
  headerEyebrow: {
    fontSize: 9, fontWeight: '800', color: C.tealLight,
    letterSpacing: 2.5, marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.tealMid,
    paddingVertical: 11, paddingHorizontal: 24,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum:  { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  statLbl:  { fontSize: 10, fontWeight: '600', color: C.tealLight, letterSpacing: 0.4, marginTop: 1 },
  statSep:  { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.22)' },

  // ── Tabs ──
  tabsWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 22,
    backgroundColor: C.tealGlow,
    borderWidth: 1, borderColor: C.tealLight,
  },
  tabActive: {
    backgroundColor: C.tealDeep,
    borderColor: C.tealDeep,
  },
  tabLabel:       { fontSize: 12, fontWeight: '700', color: C.inkMid },
  tabLabelActive: { color: C.white },

  tabBadge: {
    backgroundColor: C.tealLight,
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:       { fontSize: 9, fontWeight: '800', color: C.tealDeep },
  tabBadgeTextActive: { color: C.white },

  // ── List ──
  list: {
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 40,
  },

  // ── Order card ──
  card: {
    backgroundColor: C.surface,
    borderRadius: 16, marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0A2724',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 2,
  },
  cardNew: {
    borderColor: C.amberBorder,
    shadowColor: C.amber,
    shadowOpacity: 0.1,
  },
  cardAccent: { width: 5 },

  cardBody: {
    flex: 1,
    paddingHorizontal: 14, paddingVertical: 12,
  },

  // Top row
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: '900' },
  cardMeta:   { flex: 1 },
  orderNum: {
    fontSize: 14, fontWeight: '800', color: C.ink, letterSpacing: -0.2, marginBottom: 2,
  },
  customerName: {
    fontSize: 11, fontWeight: '500', color: C.inkLight,
  },

  // NEW badge
  newBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.amberLight,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.amberBorder,
  },
  newDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: C.amber,
  },
  newBadgeText: { fontSize: 9, fontWeight: '900', color: C.amber, letterSpacing: 0.8 },

  // Divider
  cardDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },

  // Bottom row
  cardBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  amount: {
    fontSize: 15, fontWeight: '900', color: C.tealDeep, letterSpacing: -0.3,
    marginRight: 2,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
    flex: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
  },
  dateText: { fontSize: 10, fontWeight: '500', color: C.inkLight },
  chevronCircle: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: C.tealGlow,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Empty / Loading ──
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  loadingText: { fontSize: 13, color: C.inkLight, fontWeight: '500', marginTop: 10 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealGlow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: C.tealLight,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800', color: C.ink,
    letterSpacing: -0.2, textTransform: 'capitalize', marginBottom: 6,
  },
  emptySub: {
    fontSize: 13, color: C.inkLight, textAlign: 'center', lineHeight: 20, fontWeight: '500',
  },
});