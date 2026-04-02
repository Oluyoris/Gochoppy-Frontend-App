// CustomerCoupon.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/api';

type Coupon = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  discount_amount: number;
  applicable_categories: string[];
  max_uses: number;
  used_count: number;
  expires_at: string | null;
};

// ── Perforated zigzag edge SVG-style using View circles ──
// Renders a row of small semicircles to mimic a ticket tear edge
function PerforatedEdge() {
  const circles = Array(22).fill(0);
  return (
    <View style={perf.row}>
      {/* left notch */}
      <View style={perf.notchLeft} />
      {/* dotted line across */}
      <View style={perf.dottedLine}>
        {circles.map((_, i) => (
          <View key={i} style={perf.dot} />
        ))}
      </View>
      {/* right notch */}
      <View style={perf.notchRight} />
    </View>
  );
}

const perf = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 0,
  },
  // left semicircle notch cut into the card edge
  notchLeft: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0F0F0', // matches page background
    marginLeft: -9,
    zIndex: 2,
  },
  // right semicircle notch
  notchRight: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0F0F0',
    marginRight: -9,
    zIndex: 2,
  },
  dottedLine: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4B896',
  },
});

export default function CustomerCoupon() {
  const navigation = useNavigation<any>();

  const [couponCode, setCouponCode]       = useState('');
  const [loadingRedeem, setLoadingRedeem] = useState(false);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [promos, setPromos]               = useState<Coupon[]>([]);

  const fetchAvailableCoupons = async () => {
    setLoadingPromos(true);
    try {
      const res = await api.get('/coupons/active');
      setPromos(res.data.data || res.data || []);
    } catch (err: any) {
      console.log('Failed to fetch coupons:', err);
      setPromos([]);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => { fetchAvailableCoupons(); }, []);

  const redeemCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    setLoadingRedeem(true);
    try {
      const res = await api.post('/coupons/redeem', {
        code: couponCode.trim().toUpperCase(),
      });
      if (res.data.success) {
        Alert.alert('✅ Success', res.data.message || 'Coupon redeemed successfully!');
        setCouponCode('');
        fetchAvailableCoupons();
      } else {
        Alert.alert('Invalid', res.data.message || 'This coupon is not valid or has expired.');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to redeem coupon';
      Alert.alert('Failed', message);
    } finally {
      setLoadingRedeem(false);
    }
  };

  const applyPromo = (coupon: Coupon) => {
    setCouponCode(coupon.code);
    Alert.alert('Code Ready', `Code "${coupon.code}" has been filled.\nTap "Confirm Code" to redeem.`);
  };

  const daysUntilExpiry = (expires_at: string | null): string => {
    if (!expires_at) return 'Never';
    const diff = Math.ceil(
      (new Date(expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diff <= 0) return 'Expired';
    return `in ${diff} day${diff === 1 ? '' : 's'}`;
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Coupons</Text>
        <TouchableOpacity style={s.headerBtn}>
          <Ionicons name="headset-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Enter Coupon Code ── */}
        <View style={s.inputSection}>
          <Text style={s.inputLabel}>Enter Coupon Code</Text>
          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              placeholder="Enter coupon code"
              placeholderTextColor="#C5C5C5"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            style={[s.confirmBtn, loadingRedeem && s.confirmBtnDisabled]}
            onPress={redeemCoupon}
            disabled={loadingRedeem}
            activeOpacity={0.85}
          >
            <Text style={s.confirmBtnText}>
              {loadingRedeem ? 'Checking...' : 'Confirm Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Available promo ── */}
        <Text style={s.sectionTitle}>Available promo</Text>

        {loadingPromos ? (
          <Text style={s.stateText}>Loading available coupons...</Text>
        ) : promos.length === 0 ? (
          <Text style={s.stateText}>No active coupons available at the moment</Text>
        ) : (
          promos.map((coupon) => (
            // ═══════════════════════════════════════════
            // VOUCHER CARD
            // Light gold/cream background, real ticket look
            // ═══════════════════════════════════════════
            <View key={coupon.id} style={s.voucherOuter}>

              {/* ── TOP SECTION — gold bg, title + desc + sale badge ── */}
              <View style={s.voucherTop}>

                {/* Sale sticker — top right */}
                <View style={s.stickerWrap}>
                  <Text style={s.stickerEmoji}>🏷️</Text>
                  <View style={s.stickerBadge}>
                    <Text style={s.stickerText}>SALE</Text>
                  </View>
                </View>

                <Text style={s.voucherTitle}>
                  {coupon.discount_amount}NGN OFF
                </Text>
                <Text style={s.voucherDesc}>
                  {coupon.title || coupon.description || `Use code ${coupon.code}`}
                </Text>
              </View>

              {/* ── PERFORATED DIVIDER — the ticket tear edge ── */}
              <PerforatedEdge />

              {/* ── BOTTOM SECTION — meta info + apply button ── */}
              <View style={s.voucherBottom}>
                <View style={s.metaRow}>
                  <View style={s.metaBlock}>
                    <Text style={s.metaLabel}>Offer Ends</Text>
                    <Text style={s.metaValue}>{daysUntilExpiry(coupon.expires_at)}</Text>
                  </View>
                  <View style={s.metaDivider} />
                  <View style={s.metaBlock}>
                    <Text style={s.metaLabel}>Usage</Text>
                    <Text style={s.metaValue}>{coupon.used_count}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.applyBtn}
                  onPress={() => applyPromo(coupon)}
                  activeOpacity={0.85}
                >
                  <Text style={s.applyBtnText}>Apply Code</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
const ORANGE      = '#FF6200';
const GOLD_BG     = '#FDF3DC';   // light gold/cream — matches screenshot card bg
const GOLD_BORDER = '#E8C97A';   // warm gold border
const GOLD_BOTTOM = '#FEF9EE';   // slightly lighter for bottom section

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F0F0' },
  scroll: { paddingBottom: 50 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  // ── Input section ──
  inputSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 10,
  },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 10 },
  inputBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9EAEC',
  },
  input: { fontSize: 14, color: '#111827', padding: 0 },
  confirmBtn: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  // ── Section title ──
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#111827',
    marginHorizontal: 18, marginTop: 6, marginBottom: 12,
  },

  // ══════════════════════════════════════
  // VOUCHER CARD STYLES
  // ══════════════════════════════════════
  voucherOuter: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    overflow: 'hidden',
    backgroundColor: GOLD_BG,
    // warm golden shadow
    shadowColor: '#C9A040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 4,
  },

  // top section — gold bg
  voucherTop: {
    backgroundColor: GOLD_BG,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    position: 'relative',
  },

  // sale sticker
  stickerWrap: {
    position: 'absolute',
    top: 12,
    right: 14,
    alignItems: 'center',
  },
  stickerEmoji: {
    fontSize: 30,
    transform: [{ rotate: '-10deg' }],
  },
  stickerBadge: {
    backgroundColor: '#E8000D',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: -8,
    shadowColor: '#900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  stickerText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  voucherTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 7,
    paddingRight: 65,
  },
  voucherDesc: {
    fontSize: 12,
    color: '#6B5B3E',
    lineHeight: 18,
    paddingRight: 65,
  },

  // bottom section — slightly lighter gold
  voucherBottom: {
    backgroundColor: GOLD_BOTTOM,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaBlock: {},
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: GOLD_BORDER,
    opacity: 0.6,
  },
  metaLabel: { fontSize: 10, color: '#9C8060', marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  applyBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // ── States ──
  stateText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 14 },
});