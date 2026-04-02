import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletData {
  balance: number;
  total_earned: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
  payment_method?: string;
}

const CustomerWallet = ({ navigation }: any) => {
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, total_earned: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const fetchWalletData = async () => {
    setError('');
    setLoading(true);
    try {
      const [walletRes, transRes] = await Promise.all([
        api.get('/customer/wallet'),
        api.get('/customer/wallet/transactions'),
      ]);
      setWallet(walletRes.data.data || { balance: 0, total_earned: 0 });
      setTransactions(transRes.data.data || []);
    } catch (err: any) {
      if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.data?.message || 'Failed to load wallet'}`);
      } else if (err.request) {
        setError('Cannot connect to server. Check your internet or backend is running.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchWalletData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchWalletData(); };

  const handleAddFund = () => {
    Alert.alert('Add Funds', 'How would you like to fund your wallet?', [
      { text: 'Bank Transfer', onPress: () => navigation.navigate('AddFunds') },
      { text: 'Paystack', onPress: () => Alert.alert('Coming Soon', 'Paystack integration in progress') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const isFood = (desc: string) => {
    const d = desc?.toLowerCase() || '';
    return d.includes('food') || d.includes('order') || d.includes('payment');
  };

  const formatTxDate = (dateStr: string) =>
    new Date(dateStr)
      .toLocaleString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      .replace(',', '')
      .toLowerCase();

  if (error) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle" size={54} color="#EF4444" />
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={fetchWalletData}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={s.loadingText}>Loading Wallet...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* ── Top Nav ── */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Wallet</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="headset-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6200" />}
      >

        {/* ═══════════════════════════════════════
            BALANCE CARD — faded peach/orange bg
        ═══════════════════════════════════════ */}
        <View style={s.balanceCard}>
          {/* decorative bg circles */}
          <View style={s.bgCircle1} />
          <View style={s.bgCircle2} />

          {/* date + refresh */}
          <View style={s.cardTopRow}>
            <Text style={s.balanceDateText}>
              Balance at {new Date().toLocaleString('en-NG', {
                weekday: 'short', month: 'short', day: '2-digit',
                year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={17} color="#C07840" />
            </TouchableOpacity>
          </View>

          {/* amount + eye */}
          <View style={s.amountRow}>
            <Text style={s.balanceAmount}>
              {balanceVisible ? `₦${wallet.balance.toLocaleString()}` : '₦ ●●●●'}
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible(v => !v)}>
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color="#A0683A" />
            </TouchableOpacity>
          </View>

          {/* buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.cardsBtn} activeOpacity={0.7}>
              <Ionicons name="card-outline" size={15} color="#374151" />
              <Text style={s.cardsBtnText}>Cards (0)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addFundBtn} onPress={handleAddFund} activeOpacity={0.82}>
              <Ionicons name="add-circle-outline" size={15} color="#fff" />
              <Text style={s.addFundText}>Add Fund</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════
            FOOD PROMO BANNER
            Left: dark green + food emoji items stacked
            Right: orange flame gradient + "Less than ₦5,000"
        ═══════════════════════════════════════════════ */}
        <View style={s.banner}>

          {/* ── LEFT: dark green food section ── */}
          <View style={s.bannerLeft}>
            {/* gold sparkle star shape */}
            <View style={s.sparkle}>
              <Text style={s.sparkleText}>✦</Text>
            </View>

            {/* food items stacked/overlapping */}
            <View style={s.foodStack}>
              {/* water bottle — back left */}
              <View style={[s.foodBubble, s.foodBubble1]}>
                <MaterialCommunityIcons name="bottle-soda-classic-outline" size={22} color="#fff" />
                <Text style={s.foodBubbleLabel}>Water</Text>
              </View>
              {/* rice bowl — center, slightly raised */}
              <View style={[s.foodBubble, s.foodBubble2]}>
                <MaterialCommunityIcons name="rice" size={26} color="#fff" />
                <Text style={s.foodBubbleLabel}>Rice</Text>
              </View>
              {/* chicken — front right */}
              <View style={[s.foodBubble, s.foodBubble3]}>
                <MaterialCommunityIcons name="food-drumstick" size={24} color="#fff" />
                <Text style={s.foodBubbleLabel}>& Chicken</Text>
              </View>
            </View>
          </View>

          {/* ── RIGHT: orange flame section ── */}
          <View style={s.bannerRight}>
            {/* flame/glow circles behind text */}
            <View style={s.flameGlow1} />
            <View style={s.flameGlow2} />
            <View style={s.flameGlow3} />

            <View style={s.bannerRightContent}>
              {/* text left side */}
              <View>
                <Text style={s.bannerLess}>Less than</Text>
                <Text style={s.bannerPrice}>₦5,000</Text>
              </View>

              {/* dark pill right side */}
              <View style={s.explorePill}>
                <Text style={s.exploreTop}>Explore GOCHOPPY</Text>
                <Text style={s.exploreSub}>to Order Now!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={s.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="receipt-outline" size={44} color="#D1D5DB" />
            <Text style={s.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <View style={s.txList}>
            {transactions.map((tx) => (
              <View key={tx.id} style={s.txCard}>

                {/* icon */}
                {isFood(tx.description) ? (
                  <View style={[s.txIcon, { backgroundColor: '#FFF3EE' }]}>
                    <Ionicons name="fast-food-outline" size={17} color="#FF6200" />
                  </View>
                ) : (
                  <View style={[s.txIcon, { backgroundColor: '#EEF2FF' }]}>
                    <MaterialCommunityIcons name="credit-card-plus-outline" size={16} color="#4F6EF7" />
                  </View>
                )}

                {/* description + date */}
                <View style={s.txMid}>
                  <Text style={s.txDesc}>{tx.description}</Text>
                  <Text style={s.txDate}>{formatTxDate(tx.created_at)}</Text>
                </View>

                {/* amount + method + type */}
                <View style={s.txRight}>
                  <Text style={s.txAmount}>₦{Number(tx.amount).toLocaleString()}</Text>
                  {tx.payment_method ? <Text style={s.txMethod}>{tx.payment_method}</Text> : null}
                  <Text style={[s.txType, { color: tx.type === 'credit' ? '#16A34A' : '#EF4444' }]}>
                    {tx.type}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#F4F4F4' },

  // ── Nav ──
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  // ── Balance Card ──
  balanceCard: {
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FDEBD5',
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#E87B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  bgCircle1: {
    position: 'absolute', width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,160,80,0.13)',
    top: -50, right: -50,
  },
  bgCircle2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,140,50,0.09)',
    bottom: 5, left: -25,
  },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  balanceDateText: { fontSize: 11, color: '#A0673A', flex: 1, marginRight: 8 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: '#1A1A1A', letterSpacing: -1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  cardsBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, paddingVertical: 13,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardsBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  addFundBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF6200',
    borderRadius: 12, paddingVertical: 13,
    shadowColor: '#FF6200', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.40, shadowRadius: 8, elevation: 6,
  },
  addFundText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // ═══════════════════════════════════
  // BANNER — pixel-accurate to screenshot
  // ═══════════════════════════════════
  banner: {
    marginHorizontal: 14, marginTop: 12,
    borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', height: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },

  // LEFT — dark green with overlapping food items
  bannerLeft: {
    flex: 0.42,
    backgroundColor: '#1A5C1A',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // gold sparkle star (the ✦ shape behind food in screenshot)
  sparkle: {
    position: 'absolute', left: 6, top: 6,
  },
  sparkleText: {
    fontSize: 28, color: '#FFD700', opacity: 0.85,
  },
  // food items overlapping each other like in screenshot
  foodStack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  foodBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  foodBubble1: { marginRight: -6, zIndex: 1, transform: [{ scale: 0.88 }] },
  foodBubble2: { zIndex: 2, transform: [{ scale: 1.08 }, { translateY: -4 }] },
  foodBubble3: { marginLeft: -6, zIndex: 1, transform: [{ scale: 0.90 }] },
  foodBubbleLabel: {
    fontSize: 6.5, color: '#c8f0c8', fontWeight: '600',
    marginTop: 2, textAlign: 'center',
  },

  // RIGHT — orange with flame glow circles
  bannerRight: {
    flex: 0.58,
    backgroundColor: '#FF6200',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  // layered yellow/orange glow blobs = flame effect from screenshot
  flameGlow1: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#FFAA00',
    right: -30, top: -30, opacity: 0.55,
  },
  flameGlow2: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#FFD000',
    right: 10, bottom: -25, opacity: 0.40,
  },
  flameGlow3: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#FF8C00',
    left: -10, top: -10, opacity: 0.30,
  },
  bannerRightContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11, zIndex: 2,
  },
  bannerLess: {
    fontSize: 10, color: '#FFE0CC', fontWeight: '600',
    fontStyle: 'italic',
  },
  bannerPrice: {
    fontSize: 23, color: '#FFFFFF', fontWeight: '900',
    letterSpacing: -0.8, fontStyle: 'italic',
  },
  explorePill: {
    backgroundColor: '#1C1C1C',
    borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6,
  },
  exploreTop: { fontSize: 9, color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.1 },
  exploreSub: { fontSize: 8, color: '#9CA3AF', marginTop: 2 },

  // ── Transactions ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  viewAll: { fontSize: 12, fontWeight: '600', color: '#FF6200' },

  txList: { paddingHorizontal: 14, gap: 6 },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  txIcon: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  txMid: { flex: 1 },
  // ← FIXED: small, medium-weight like in screenshot
  txDesc: { fontSize: 12, fontWeight: '500', color: '#111827' },
  txDate: { fontSize: 10.5, color: '#9CA3AF', marginTop: 2 },
  txRight: { alignItems: 'flex-end', marginLeft: 8 },
  txAmount: { fontSize: 12, fontWeight: '700', color: '#111827' },
  txMethod: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  txType: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  // ── States ──
  emptyState: { alignItems: 'center', paddingVertical: 46 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F4F4F4' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorText: { marginTop: 16, color: '#EF4444', textAlign: 'center', fontSize: 14 },
  retryBtn: {
    marginTop: 16, backgroundColor: '#FF6200',
    paddingHorizontal: 28, paddingVertical: 11, borderRadius: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

export default CustomerWallet;