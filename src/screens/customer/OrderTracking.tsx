import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const { width } = Dimensions.get('window');

// ── Colors (all original preserved) ─────────────────
const ORANGE        = '#FF6200';
const ORANGE_SOFT   = '#FFF3EC';
const ORANGE_BORDER = '#FFD5BC';
const TEAL          = '#00897B';
const TEAL_DARK     = '#00695C';
const TEAL_LIGHT    = '#4DB6AC';
const TEAL_BG       = '#E0F2F1';
const TEAL_BORDER   = '#B2DFDB';
const WHITE         = '#FFFFFF';
const BG            = '#F5FAF9';
const TEXT_DARK     = '#1A2E2B';
const TEXT_MID      = '#3D6360';
const TEXT_SOFT     = '#8FABA8';
const BORDER        = '#D4ECEA';
const GREY_LINE     = '#D1D9D8';

// ── Exact colors from the reference image ────────────
const MINT_BG       = '#EBF7F5';
const STEP_TEAL     = '#00897B';
const STEP_GREY_BG  = '#E8ECEC';
const STEP_GREY_TXT = '#BBBBBB';
const LINE_TEAL     = '#00897B';
const LINE_GREY     = '#DDDDDD';

export default function OrderTracking({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDispatcher, setExpandedDispatcher] = useState(false);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarVisible: true });
  }, [navigation]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.order || res.data);
    } catch (error) {
      console.log('Order fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={s.loadingText}>Fetching your order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <TouchableOpacity style={s.backArrow} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={s.errorWrap}>
          <View style={s.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={44} color={ORANGE} />
          </View>
          <Text style={s.errorTitle}>Order Not Found</Text>
          <Text style={s.errorSub}>We couldn't find this order. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  type OrderStatus =
    | 'ordered' | 'paid' | 'accepted' | 'received'
    | 'packaged' | 'picked_up' | 'enroute' | 'delivered' | 'cancelled';

  const realStatus: OrderStatus = order.status || 'ordered';

  const steps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'ordered',   label: 'Order Placed',            icon: 'receipt-outline'        },
    { key: 'paid',      label: 'Payment Confirmed',       icon: 'card-outline'           },
    { key: 'accepted',  label: 'Vendor Received Order',   icon: 'storefront-outline'     },
    { key: 'packaged',  label: 'Packaged & Ready',        icon: 'cube-outline'           },
    { key: 'picked_up', label: 'Picked Up by Dispatcher', icon: 'bicycle-outline'        },
    { key: 'enroute',   label: 'Enroute to You',          icon: 'navigate-outline'       },
    { key: 'delivered', label: 'Delivered',               icon: 'checkmark-done-outline' },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === realStatus);

  const getStepState = (stepKey: OrderStatus) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    return {
      isCompleted: stepIndex < currentStepIndex,
      isActive:    stepIndex === currentStepIndex,
    };
  };

  const showDispatcherInfo = ['picked_up', 'enroute', 'delivered'].includes(realStatus);

  const stepDescs: Partial<Record<OrderStatus, string>> = {
    ordered:   'Your order has been placed.',
    paid:      'Your payment was received.',
    accepted:  'The vendor is preparing your order.',
    packaged:  'Your order is ready for pickup.',
    picked_up: 'Your order is on its way.',
    enroute:   'Your driver is around to deliver your order.',
    delivered: 'Your order has been delivered.',
  };

  const customerName =
    order.customer_name?.split(' ')[0] ||
    order.user?.name?.split(' ')[0] ||
    'There';

  // NEW: Show Estimated Time when dispatcher has picked up
  const showEstimatedTime = realStatus === 'picked_up' || realStatus === 'enroute';
  const estimatedTime = order.estimated_time || '25-40 mins';   // from your delivery interval

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEAL, ORANGE]}
            tintColor={TEAL}
          />
        }
      >
        {/* ZONE 1 – HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        {/* ZONE 2 – HERO SECTION */}
        <View style={s.hero}>
          <View style={s.heroText}>
            <Text style={s.heroName}>{customerName}</Text>
            <Text style={s.heroSub}>
              {realStatus === 'delivered'
                ? 'Your order has been delivered 🎉'
                : realStatus === 'enroute'
                ? 'Your order will arrive shortly'
                : realStatus === 'picked_up'
                ? 'Rider has picked up your order'
                : realStatus === 'packaged'
                ? 'All packed and ready to go'
                : realStatus === 'accepted'
                ? 'Vendor is preparing your order'
                : realStatus === 'paid'
                ? 'Payment confirmed!'
                : "We've received your order!"}
            </Text>
          </View>
          <Text style={s.heroBike}>🏍️</Text>
        </View>

        {/* ZONE 3 – DELIVERY CODE */}
        {order.delivery_code && (
          <View style={s.codeSection}>
            <View style={s.codeCard}>
              <View style={s.codeCardLeft}>
                <View style={s.codeIconWrap}>
                  <Ionicons name="shield-checkmark" size={20} color={WHITE} />
                </View>
                <View>
                  <Text style={s.codeCardLabel}>Delivery Code</Text>
                  <Text style={s.codeCardNote}>Show to dispatcher on arrival</Text>
                </View>
              </View>
              <Text style={s.codeCardValue}>{order.delivery_code}</Text>
            </View>
          </View>
        )}

        {/* NEW: ESTIMATED TIME when dispatcher picked up */}
        {showEstimatedTime && (
          <View style={s.estimatedTimeCard}>
            <View style={s.estimatedTimeHeader}>
              <Ionicons name="time-outline" size={20} color={TEAL} />
              <Text style={s.estimatedTimeTitle}>Expected Arrival</Text>
            </View>
            <Text style={s.estimatedTimeValue}>{estimatedTime}</Text>
            <Text style={s.estimatedTimeSub}>The dispatcher should arrive within this window</Text>
          </View>
        )}

        {/* ZONE 4 – PROMO BANNER */}
        <View style={s.banner}>
          <View style={s.bannerBlob1} />
          <View style={s.bannerBlob2} />

          <View style={s.bannerInner}>
            <View style={s.bannerLeft}>
              <Text style={s.bannerTitle}>
                While we deliver,{'\n'}pay your bills
              </Text>
              <Text style={s.bannerSub}>
                Pay Electricity, Internet, DSTV and Airtime in seconds.
              </Text>
              <TouchableOpacity style={s.bannerBtn} activeOpacity={0.85}>
                <Text style={s.bannerBtnText}>Try it now</Text>
              </TouchableOpacity>
            </View>

            <View style={s.bannerRight}>
              <Text style={s.bannerEmoji}>🙌</Text>
              <Text style={s.bannerEmoji2}>💳</Text>
            </View>
          </View>
        </View>

        {/* ZONE 5 – STEPS LIST */}
        <View style={s.stepsList}>
          {steps.map((step, index) => {
            const { isCompleted, isActive } = getStepState(step.key);
            const isPending = !isCompleted && !isActive;
            const isLast    = index === steps.length - 1;

            const ts = order[`${step.key}_at`];
            const timeLabel = isCompleted && ts
              ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <View key={step.key} style={s.stepRow}>
                {/* Left column: checkbox + vertical line */}
                <View style={s.stepLeft}>
                  {isCompleted ? (
                    <View style={s.checkboxDone}>
                      <Ionicons name="checkmark" size={14} color={WHITE} />
                    </View>
                  ) : isActive ? (
                    <View style={s.checkboxActive}>
                      <View style={s.checkboxActiveDot} />
                    </View>
                  ) : (
                    <View style={s.checkboxPending} />
                  )}

                  {!isLast && (
                    <View style={[
                      s.line,
                      (isCompleted || isActive) ? s.lineTeal : s.lineGrey,
                    ]} />
                  )}
                </View>

                {/* Right column */}
                <View style={[s.stepContent, isLast && { paddingBottom: 4 }]}>
                  <View style={s.labelRow}>
                    <Text style={[
                      s.stepLabel,
                      isCompleted && s.stepLabelDone,
                      isActive    && s.stepLabelActive,
                      isPending   && s.stepLabelPending,
                    ]}>
                      {step.label}
                    </Text>

                    {timeLabel && (
                      <Text style={s.stepTime}>{timeLabel}</Text>
                    )}
                  </View>

                  <Text style={[
                    s.stepDesc,
                    isPending && s.stepDescPending,
                  ]}>
                    {stepDescs[step.key] || ''}
                  </Text>

                  {/* Dispatcher info */}
                  {step.key === 'picked_up' && showDispatcherInfo && order.dispatcher && (
                    <View style={s.dispatcherWrap}>
                      <TouchableOpacity
                        style={s.dispatcherToggle}
                        onPress={() => setExpandedDispatcher(!expandedDispatcher)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="person-circle-outline" size={14} color={ORANGE} />
                        <Text style={s.dispatcherToggleText}>
                          {expandedDispatcher ? 'Hide' : 'View'} Dispatcher Info
                        </Text>
                        <Ionicons
                          name={expandedDispatcher ? 'chevron-up' : 'chevron-down'}
                          size={13}
                          color={ORANGE}
                        />
                      </TouchableOpacity>

                      {expandedDispatcher && (
                        <View style={s.dispatcherCard}>
                          {[
                            { icon: 'person-outline' as const, key: 'Name',  val: order.dispatcher.name  || 'N/A' },
                            { icon: 'call-outline' as const,   key: 'Phone', val: order.dispatcher.phone || 'N/A' },
                          ].map((row, i) => (
                            <View key={i} style={[s.dispatcherRow, i < 1 && s.dispatcherRowBorder]}>
                              <View style={s.dispatcherIconWrap}>
                                <Ionicons name={row.icon} size={14} color={TEAL_DARK} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={s.dispatcherKey}>{row.key}</Text>
                                <Text style={s.dispatcherVal}>{row.val}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  // Loading / Error
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 13, color: TEXT_SOFT },
  backArrow:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  errorWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  errorIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, borderWidth: 1.5, borderColor: ORANGE_BORDER,
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  errorSub:   { fontSize: 13, color: TEXT_SOFT, textAlign: 'center', lineHeight: 20 },

  // ── Zone 1: Header ────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: WHITE,
  },

  // ── Zone 2: Hero ──────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: WHITE,
  },
  heroText: { flex: 1 },
  heroName: {
    fontSize: 34,
    fontWeight: '900',
    color: TEXT_DARK,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: TEXT_SOFT,
    fontWeight: '400',
    lineHeight: 20,
  },
  heroBike: {
    fontSize: 56,
    marginLeft: 10,
  },

  // ── Zone 3: Delivery Code ─────────────────────────────
  codeSection: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: WHITE,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TEAL_DARK,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  codeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 2,
  },
  codeCardNote: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  codeCardValue: {
    fontSize: 26,
    fontWeight: '900',
    color: WHITE,
    letterSpacing: 5,
  },

  // NEW: Estimated Time Card
  estimatedTimeCard: {
    marginHorizontal: 18,
    marginVertical: 12,
    backgroundColor: TEAL_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
  },
  estimatedTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  estimatedTimeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEAL_DARK,
  },
  estimatedTimeValue: {
    fontSize: 28,
    fontWeight: '900',
    color: TEAL,
    marginBottom: 4,
  },
  estimatedTimeSub: {
    fontSize: 13,
    color: TEXT_MID,
    lineHeight: 18,
  },

  // ── Zone 4: Promo Banner ──────────────────────────────
  banner: {
    width: '100%',
    backgroundColor: MINT_BG,
    paddingHorizontal: 22,
    paddingVertical: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerBlob1: {
    position: 'absolute',
    top: -50, right: -40,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  bannerBlob2: {
    position: 'absolute',
    bottom: -60, right: 40,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: { flex: 1, paddingRight: 12 },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    lineHeight: 25,
    marginBottom: 7,
  },
  bannerSub: {
    fontSize: 12,
    color: TEXT_MID,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 18,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: TEAL_DARK,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 30,
  },
  bannerBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEmoji:  { fontSize: 52 },
  bannerEmoji2: { fontSize: 32, marginTop: -8 },

  // ── Zone 5: Steps List ────────────────────────────────
  stepsList: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: WHITE,
  },

  stepRow: {
    flexDirection: 'row',
  },

  stepLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: 20,
  },

  checkboxDone: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: STEP_TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: WHITE,
    borderWidth: 2, borderColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActiveDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: TEAL,
  },
  checkboxPending: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: STEP_GREY_BG,
  },

  line: {
    width: 2, flex: 1, minHeight: 24,
    marginTop: 4, borderRadius: 2,
  },
  lineTeal: { backgroundColor: LINE_TEAL },
  lineGrey: { backgroundColor: LINE_GREY },

  stepContent: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 32,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  stepLabel: {
    fontSize: 14, fontWeight: '600', color: TEXT_SOFT,
    flex: 1, marginRight: 8,
  },
  stepLabelDone:    { color: TEAL, fontWeight: '700' },
  stepLabelActive:  { color: TEAL, fontWeight: '700', fontSize: 14 },
  stepLabelPending: { color: STEP_GREY_TXT, fontWeight: '500' },

  stepTime: {
    fontSize: 13, color: TEXT_SOFT, fontWeight: '500', flexShrink: 0,
  },

  stepDesc: {
    fontSize: 13, color: TEXT_DARK, fontWeight: '400', lineHeight: 19, opacity: 0.75,
  },
  stepDescPending: {
    color: STEP_GREY_TXT, opacity: 1,
  },

  // ── Dispatcher info ───────────────────────────────────
  dispatcherWrap: { marginTop: 10 },
  dispatcherToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: ORANGE_SOFT, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: ORANGE_BORDER,
  },
  dispatcherToggleText: { fontSize: 11, fontWeight: '700', color: ORANGE },
  dispatcherCard: {
    marginTop: 10, backgroundColor: TEAL_BG,
    borderRadius: 14, padding: 4, borderWidth: 1, borderColor: TEAL_BORDER, overflow: 'hidden',
  },
  dispatcherRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10, paddingHorizontal: 10,
  },
  dispatcherRowBorder: { borderBottomWidth: 1, borderBottomColor: TEAL_BORDER },
  dispatcherIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: TEAL_BORDER,
  },
  dispatcherKey: { fontSize: 10, fontWeight: '600', color: TEXT_SOFT, letterSpacing: 0.3, marginBottom: 2 },
  dispatcherVal: { fontSize: 13, fontWeight: '700', color: TEAL_DARK },
});