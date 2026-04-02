import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Animated,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const { width } = Dimensions.get('window');

// ── Dispatcher Brand Palette (Teal / Rider Theme) ─────
const TEAL          = '#00897B';
const TEAL_DARK     = '#00695C';
const TEAL_LIGHT    = '#26A69A';
const TEAL_SOFT     = '#E0F2F1';
const TEAL_BG       = '#E0F2F1';
const TEAL_BORDER   = '#B2DFDB';
const WHITE         = '#FFFFFF';
const BG            = '#F7F9F8';
const CARD          = '#FFFFFF';
const TEXT_DARK     = '#1A2E2B';
const TEXT_MID      = '#4A6360';
const TEXT_SOFT     = '#8AA09E';
const BORDER        = '#EEF3F2';
const GREEN         = '#2E7D32';
const GREEN_BG      = '#E8F5E9';
const GREEN_BORDER  = '#A5D6A7';
const AMBER         = '#E65100';
const AMBER_BG      = '#FFF3E0';
const RED           = '#C62828';
const RED_BG        = '#FFEBEE';

export default function DispatcherWallet() {
  // ── State ─────────────────────────────────────────────
  const [balance, setBalance]           = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [withdrawals, setWithdrawals]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [amount, setAmount]             = useState('');
  const [bankName, setBankName]         = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName]   = useState('');
  const [withdrawing, setWithdrawing]   = useState(false);

  // Animation
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchWalletData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fetch Wallet + Withdrawal History ─────────────────
  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // 1. Get Dashboard (Balance + Total Earnings)
      const dashboardRes = await api.get('/dispatch/dashboard');
      setBalance(dashboardRes.data.dashboard?.wallet_balance || 0);
      setTotalEarnings(dashboardRes.data.dashboard?.total_earnings || 0);

      // 2. Get Withdrawal History - FIXED
      const withdrawalRes = await api.get('/withdrawals');
      setWithdrawals(withdrawalRes.data.requests?.data || []);   // ← Correct path

    } catch (error: any) {
      console.log('Dispatcher Wallet fetch error:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWalletData();
  }, []);

  // ── Request Withdrawal ────────────────────────────────
  const requestWithdrawal = async () => {
    const withdrawAmount = Number(amount);

    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (withdrawAmount > balance) {
      Alert.alert('Error', `You can only withdraw up to ₦${Number(balance).toLocaleString()}`);
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Request ₦${withdrawAmount.toLocaleString()} to ${accountName}?`,
      [
        { text: 'Cancel' },
        {
          text: 'Submit Request',
          onPress: async () => {
            try {
              setWithdrawing(true);
              await api.post('/withdrawals', {
                amount: withdrawAmount,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
              });

              Alert.alert('Success', 'Withdrawal request submitted! Pending admin approval.');

              // Clear form
              setAmount('');
              setBankName('');
              setAccountNumber('');
              setAccountName('');

              // Refresh data to show new withdrawal immediately
              fetchWalletData();
            } catch (error: any) {
              const msg = error.response?.data?.message || 'Failed to submit request';
              Alert.alert('Error', msg);
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  // ── Status config ─────────────────────────────────────
  const statusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending:  { label: 'Pending',  color: AMBER,  bg: AMBER_BG,  icon: 'time-outline'           },
    approved: { label: 'Approved', color: GREEN,  bg: GREEN_BG,  icon: 'checkmark-circle-outline'},
    rejected: { label: 'Rejected', color: RED,    bg: RED_BG,    icon: 'close-circle-outline'   },
  };

  // ── Render single withdrawal row ──────────────────────
  const renderWithdrawal = ({ item, index }: { item: any; index: number }) => {
    const cfg = statusMap[item.status] || statusMap.pending;
    const dateStr = new Date(item.created_at).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

    return (
      <View style={[styles.historyRow, index === 0 && { marginTop: 0 }]}>
        <View style={[styles.historyIconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
        </View>

        <View style={styles.historyInfo}>
          <Text style={styles.historyAmount}>₦{Number(item.amount).toLocaleString()}</Text>
          <Text style={styles.historyMeta}>
            {item.bank_name ? `${item.bank_name} · ` : ''}{dateStr}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    );
  };

  // ── Loading Screen ────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading your rider wallet…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main UI ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Dispatcher Portal</Text>
          <Text style={styles.headerTitle}>My Wallet</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWalletData} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
      >
        {/* Hero Balance Card */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          <View style={styles.heroInner}>
            <View style={styles.heroLeft}>
              <View style={styles.heroBadge}>
                <Ionicons name="bicycle" size={13} color={TEAL_DARK} />
                <Text style={styles.heroBadgeText}>Available Balance</Text>
              </View>
              <Text style={styles.heroBalance}>
                ₦{Number(balance).toLocaleString()}
              </Text>
              <Text style={styles.heroNote}>Ready for withdrawal</Text>
            </View>
            <View style={styles.heroRight}>
              <Ionicons name="wallet" size={52} color="rgba(255,255,255,0.18)" />
            </View>
          </View>
        </Animated.View>

        {/* Total Earnings Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.earningsCard}>
            <View style={styles.earningsIconWrap}>
              <Ionicons name="trending-up-outline" size={22} color={TEAL} />
            </View>
            <View style={styles.earningsText}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>₦{Number(totalEarnings).toLocaleString()}</Text>
            </View>
            <View style={styles.earningsRight}>
              <Ionicons name="chevron-forward" size={18} color={TEXT_SOFT} />
            </View>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <View style={styles.sectionLabelWrap}>
            <Ionicons name="arrow-up-circle-outline" size={14} color={TEAL} />
            <Text style={styles.sectionLabel}>Request Withdrawal</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>

        {/* Withdrawal Form */}
        <View style={styles.formCard}>
          <Text style={styles.formFieldLabel}>Amount to Withdraw</Text>
          <View style={[styles.inputWrap, styles.amountInputWrap]}>
            <Text style={styles.currencyPrefix}>₦</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={TEXT_SOFT}
            />
          </View>

          <Text style={styles.balanceHint}>
            Available: <Text style={{ color: TEAL_DARK, fontWeight: '700' }}>₦{Number(balance).toLocaleString()}</Text>
          </Text>

          <View style={styles.bankDivider}>
            <View style={styles.bankDividerLine} />
            <Text style={styles.bankDividerLabel}>Bank Details</Text>
            <View style={styles.bankDividerLine} />
          </View>

          <Text style={styles.formFieldLabel}>Bank Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={16} color={TEXT_SOFT} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="e.g. GTBank" value={bankName} onChangeText={setBankName} placeholderTextColor={TEXT_SOFT} />
          </View>

          <Text style={styles.formFieldLabel}>Account Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="card-outline" size={16} color={TEXT_SOFT} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="10-digit number" keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} placeholderTextColor={TEXT_SOFT} maxLength={10} />
          </View>

          <Text style={styles.formFieldLabel}>Account Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={TEXT_SOFT} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Account holder name" value={accountName} onChangeText={setAccountName} placeholderTextColor={TEXT_SOFT} />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, withdrawing && styles.submitBtnDisabled]}
            onPress={requestWithdrawal}
            disabled={withdrawing}
            activeOpacity={0.88}
          >
            {withdrawing ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="arrow-up-circle-outline" size={20} color={WHITE} />
                <Text style={styles.submitBtnText}>Submit Withdrawal Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Withdrawal History */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <View style={styles.sectionLabelWrap}>
            <Ionicons name="time-outline" size={14} color={TEXT_MID} />
            <Text style={[styles.sectionLabel, { color: TEXT_MID }]}>Withdrawal History</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>

        {withdrawals.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={32} color={TEXT_SOFT} />
            </View>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySub}>Your withdrawal history will appear here.</Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            <FlatList
              data={withdrawals}
              renderItem={renderWithdrawal}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.historyDivider} />}
            />
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles (Dispatcher Teal Theme) ─────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 13, color: TEXT_SOFT, fontWeight: '500' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: TEAL_DARK,
  },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 20 },

  // Hero Card
  heroCard: {
    backgroundColor: TEAL,
    borderRadius: 22,
    padding: 24,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  heroBlob1: { position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.10)' },
  heroBlob2: { position: 'absolute', bottom: -50, right: 60, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.92)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 14 },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: TEAL_DARK },
  heroBalance: { fontSize: 38, fontWeight: '900', color: WHITE, letterSpacing: -1, marginBottom: 6 },
  heroNote: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  heroRight: { marginLeft: 10 },

  // Earnings Card
  earningsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 14,
  },
  earningsIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: TEAL_SOFT, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: TEAL_BORDER },
  earningsText: { flex: 1 },
  earningsLabel: { fontSize: 11, color: TEXT_SOFT, fontWeight: '600', marginBottom: 3 },
  earningsValue: { fontSize: 22, fontWeight: '900', color: TEAL, letterSpacing: -0.5 },
  earningsRight: {},

  // Section dividers
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionLine: { flex: 1, height: 1, backgroundColor: BORDER },
  sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: TEAL_SOFT, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: TEAL_BORDER },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEAL },

  // Form Card
  formCard: {
    backgroundColor: CARD, borderRadius: 20,
    padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  formFieldLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MID, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 7, marginTop: 4 },

  amountInputWrap: { borderColor: TEAL_BORDER, borderWidth: 1.5, backgroundColor: TEAL_BG },
  currencyPrefix: { fontSize: 22, fontWeight: '800', color: TEAL_DARK, marginRight: 4, marginLeft: 4 },
  amountInput: { fontSize: 28, fontWeight: '900', color: TEAL_DARK, letterSpacing: -0.5, flex: 1 },
  balanceHint: { fontSize: 12, color: TEXT_SOFT, fontWeight: '500', marginBottom: 18, marginTop: 4 },

  bankDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bankDividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  bankDividerLabel: { fontSize: 10, fontWeight: '700', color: TEXT_SOFT, letterSpacing: 0.5, textTransform: 'uppercase' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 13,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, height: 50,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: TEXT_DARK, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: TEAL,
    paddingVertical: 17, borderRadius: 16, marginTop: 8,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.55, shadowOpacity: 0.1 },
  submitBtnText: { color: WHITE, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  // History
  historyCard: {
    backgroundColor: CARD, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  historyDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  historyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyInfo: { flex: 1 },
  historyAmount: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 3 },
  historyMeta: { fontSize: 11, color: TEXT_SOFT, fontWeight: '500' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 40, backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 6 },
  emptySub: { fontSize: 13, color: TEXT_SOFT, textAlign: 'center', paddingHorizontal: 40 },
});