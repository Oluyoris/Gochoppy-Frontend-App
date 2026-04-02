import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import { CustomerNavigationProp } from '../../navigation/types';

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  bg:          '#F4F9F8',
  surface:     '#FFFFFF',
  tealDeep:    '#0D6E63',
  tealMid:     '#17A898',
  tealLight:   '#C8EDEA',
  tealGlow:    '#E8F7F5',
  ink:         '#0A2724',
  inkMid:      '#3A5A56',
  inkLight:    '#7AA8A3',
  amber:       '#E8821A',
  amberLight:  '#FEF0E0',
  blue:        '#1E6FC8',
  blueLight:   '#E3F0FD',
  violet:      '#6B3FA0',
  violetLight: '#F3E8FA',
  green:       '#1A9060',
  greenLight:  '#E2F5EC',
  red:         '#D93030',
  redLight:    '#FDECEC',
  orange:      '#FF6200',
  orangeLight: '#FFF0E8',
  border:      '#E4EEEC',
  white:       '#FFFFFF',
};

// ─── Tab definitions ─────────────────────────────────────────────
const TABS = [
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'all',       label: 'All' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Activities() {
  // ─── ALL ORIGINAL LOGIC UNTOUCHED ────────────────────────────
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<CustomerNavigationProp>();

  // tab state — purely UI, no logic change
  const [activeTab, setActiveTab] = useState<TabId>('active');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my-orders');
      setOrders(res.data.orders || []);
    } catch (error) {
      console.log('Orders fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // ─── ORIGINAL STATUS HELPERS — NOT TOUCHED ───────────────────
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { color: C.tealMid,  bg: C.tealLight,   icon: 'checkmark-done-outline' as const, label: 'Delivered'  };
      case 'cancelled':
        return { color: C.red,      bg: C.redLight,     icon: 'close-circle-outline'   as const, label: 'Cancelled'  };
      case 'enroute':
        return { color: C.blue,     bg: C.blueLight,    icon: 'navigate-outline'       as const, label: 'En Route'   };
      case 'picked_up':
        return { color: C.violet,   bg: C.violetLight,  icon: 'bicycle-outline'        as const, label: 'Picked Up'  };
      case 'packaged':
        return { color: C.amber,    bg: C.amberLight,   icon: 'cube-outline'           as const, label: 'Packaged'   };
      default:
        return { color: C.orange,   bg: C.orangeLight,  icon: 'time-outline'           as const, label: 'Pending'    };
    }
  };

  // ─── TAB FILTER ───────────────────────────────────────────────
  const getFiltered = () => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'completed')
      return orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
    // active = everything else
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  };

  const filtered = getFiltered();

  // ─── CARD RENDER ─────────────────────────────────────────────
  const renderOrderItem = ({ item }: { item: any }) => {
    const cfg          = getStatusConfig(item.status);
    const isInProgress = !['delivered', 'cancelled'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.82}
      >
        {/* Left colour stripe */}
        <View style={[styles.cardStripe, { backgroundColor: cfg.color }]} />

        <View style={styles.cardInner}>
          {/* Top: order number + status pill */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.orderNumLabel}>ORDER</Text>
              <Text style={styles.orderNum}>#{item.order_number}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={10} color={cfg.color} style={{ marginRight: 3 }} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Vendor + amount row */}
          <View style={styles.midRow}>
            <View style={styles.vendorWrap}>
              <View style={styles.vendorDot} />
              <Text style={styles.vendorName} numberOfLines={1}>
                {item.vendor?.name || 'Unknown Vendor'}
              </Text>
            </View>
            <Text style={styles.amount}>
              ₦{Number(item.grand_total).toLocaleString()}
            </Text>
          </View>

          {/* Date + arrow */}
          <View style={styles.footerRow}>
            <View style={styles.dateWrap}>
              <Ionicons name="time-outline" size={10} color={C.inkLight} />
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-NG', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.arrowChip}>
              <Text style={styles.arrowChipText}>Details</Text>
              <Ionicons name="chevron-forward" size={11} color={C.tealDeep} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.tealMid]}
              tintColor={C.tealMid}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}

          // ── Header scrolls with the list ──────────────────────
          ListHeaderComponent={
            <View>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text style={styles.pageTitle}>My Orders</Text>
                {orders.length > 0 && (
                  <View style={styles.totalChip}>
                    <Text style={styles.totalChipText}>{orders.length}</Text>
                  </View>
                )}
              </View>

              {/* Filter tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsRow}
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  const tabCount = tab.id === 'all'
                    ? orders.length
                    : tab.id === 'completed'
                    ? orders.filter(o => ['delivered','cancelled'].includes(o.status)).length
                    : orders.filter(o => !['delivered','cancelled'].includes(o.status)).length;

                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => setActiveTab(tab.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                        {tab.label}
                      </Text>
                      {tabCount > 0 && (
                        <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                          <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                            {tabCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }

          // ── Empty state ───────────────────────────────────────
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCircle}>
                <Ionicons name="receipt-outline" size={28} color={C.tealMid} />
              </View>
              <Text style={styles.emptyTitle}>
                No {activeTab !== 'all' ? activeTab : ''} orders
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'active'
                  ? 'You have no active orders right now'
                  : 'Nothing to show here yet'}
              </Text>
            </View>
          }
        />
      )}
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
    fontSize: 12,
    color: C.inkLight,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },

  // Title row (inside list header)
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -0.4,
  },
  totalChip: {
    backgroundColor: C.tealLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  totalChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.tealDeep,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.tealLight,
  },
  tabActive: {
    backgroundColor: C.tealDeep,
    borderColor: C.tealDeep,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.inkMid,
  },
  tabLabelActive: {
    color: C.white,
  },
  tabCount: {
    backgroundColor: C.tealGlow,
    borderRadius: 10,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.tealDeep,
  },
  tabCountTextActive: {
    color: C.white,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    marginBottom: 9,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0A3A34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardStripe: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 7,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: C.inkLight,
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  orderNum: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Mid row
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  vendorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.tealMid,
    flexShrink: 0,
  },
  vendorName: {
    fontSize: 12,
    color: C.inkMid,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
    color: C.tealDeep,
    letterSpacing: -0.3,
  },

  // Footer row
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 10,
    color: C.inkLight,
    fontWeight: '500',
  },
  arrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: C.tealGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.tealLight,
  },
  arrowChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.tealDeep,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.ink,
    textTransform: 'capitalize',
  },
  emptySub: {
    fontSize: 12,
    color: C.inkLight,
    textAlign: 'center',
  },
});