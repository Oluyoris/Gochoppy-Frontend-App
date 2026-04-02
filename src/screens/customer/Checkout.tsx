import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';

// ── Design Tokens ─────────────────────────────────────
const ORANGE     = '#FF6200';
const ORANGE_LT  = '#FFF3EC';
const ORANGE_MID = '#FF8533';
const TEAL       = '#00897B';
const TEAL_LT    = '#E8F5F3';
const WHITE      = '#FFFFFF';
const BG         = '#F4F6F5';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#111827';
const TEXT_MID   = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';
const BORDER     = '#E5E7EB';
const INPUT_BG   = '#F9FAFB';
const SUCCESS    = '#10B981';

// Payment method brand colors
const WALLET_COLOR   = '#7C3AED'; // Purple for wallet
const WALLET_LT      = '#F5F3FF';
const BANK_COLOR     = '#0EA5E9'; // Blue for bank
const BANK_LT        = '#F0F9FF';
const PAYSTACK_COLOR = '#00C3F7'; // Paystack blue
const PAYSTACK_LT    = '#ECFEFF';

type CartItem = {
  id: number;
  name: string;
  price: number | string;
  image: string | null;
  vendor?: { name: string; id: number };
  quantity: number;
};

type BusStop = {
  id: number;
  name: string;
};

export default function Checkout({ navigation }: any) {
  const [cartItems, setCartItems]           = useState<CartItem[]>([]);
  const [address, setAddress]               = useState('');
  const [city, setCity]                     = useState('Ekiti');
  const [phone, setPhone]                   = useState('');
  const [notes, setNotes]                   = useState('');
  const [paymentMethod, setPaymentMethod]   = useState<'wallet' | 'paystack' | 'bank_transfer'>('wallet');
  const [proofImage, setProofImage]         = useState<string | null>(null);
  const [settings, setSettings]             = useState<any>({});
  const [busStops, setBusStops]             = useState<BusStop[]>([]);
  const [selectedBusStopId, setSelectedBusStopId] = useState<number | undefined>(undefined);
  const [deliveryFee, setDeliveryFee]       = useState(0);
  const [estimatedTime, setEstimatedTime]   = useState('');
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [walletBalance, setWalletBalance]   = useState(0);

  useEffect(() => {
    loadCart();
    fetchSettings();
    fetchBusStops();
    fetchWalletBalance();
  }, []);

  const loadCart = async () => {
    try {
      const cart = await AsyncStorage.getItem('cart');
      if (cart) setCartItems(JSON.parse(cart));
    } catch (error) {
      console.log('Load cart error:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get('/customer/wallet');
      setWalletBalance(res.data.data?.balance || 0);
    } catch (error) {
      console.log('Wallet balance fetch error:', error);
      setWalletBalance(0);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings || {});
    } catch (error) {
      console.log('Settings fetch error:', error);
      setSettings({
        service_charge_amount: 200,
        manual_bank_enabled: true,
        manual_bank_name: 'First Bank of Nigeria',
        manual_account_number: '1234567890',
        manual_account_name: 'GoChoppy Limited',
        paystack_enabled: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusStops = async () => {
    try {
      const res = await api.get('/popular-bus-stops');
      setBusStops(res.data.data || []);
    } catch (error) {
      console.log('Failed to fetch bus stops:', error);
    }
  };

  const subtotal  = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  const serviceFee = settings.service_charge_amount || 200;
  const grandTotal = subtotal + deliveryFee + serviceFee;

  const fetchDeliveryFee = async (busStopId: number) => {
    if (!cartItems.length || !cartItems[0]?.vendor?.id) return;
    setLoadingDelivery(true);
    try {
      const response = await api.get('/delivery-fee', {
        params: { vendor_id: cartItems[0].vendor.id, user_bus_stop_id: busStopId },
      });
      if (response.data.success) {
        setDeliveryFee(response.data.delivery_fee);
        setEstimatedTime(response.data.estimated_time || '25-40 mins');
      } else {
        setDeliveryFee(0);
      }
    } catch (error) {
      console.log('Delivery fee error:', error);
      setDeliveryFee(0);
    } finally {
      setLoadingDelivery(false);
    }
  };

  const handleBusStopChange = (id: number | string) => {
    const numId = Number(id);
    setSelectedBusStopId(numId);
    if (numId) fetchDeliveryFee(numId);
  };

  const pickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) setProofImage(result.assets[0].uri);
  };

  const confirmOrder = async () => {
    if (!address || !phone) {
      Alert.alert('Missing Info', 'Please fill in delivery address and phone number.');
      return;
    }
    if (!selectedBusStopId) {
      Alert.alert('Missing Bus Stop', 'Please select the nearest bus stop to your delivery address.');
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < grandTotal) {
      Alert.alert('Insufficient Balance', `Your wallet balance (₦${walletBalance}) is not enough for this order.`);
      return;
    }
    if (paymentMethod === 'bank_transfer' && !proofImage) {
      Alert.alert('Proof Required', 'Please upload payment proof for bank transfer.');
      return;
    }

    const payload: any = {
      vendor_id: cartItems[0]?.vendor?.id,
      user_bus_stop_id: selectedBusStopId,
      items: cartItems.map(item => ({ item_id: item.id, quantity: item.quantity })),
      address: `${address}, ${city}`,
      phone,
      notes,
      payment_method: paymentMethod,
    };

    if (paymentMethod === 'bank_transfer' && proofImage) {
      try {
        const base64 = await FileSystem.readAsStringAsync(proofImage, { encoding: 'base64' as any });
        payload.payment_proof = `data:image/jpeg;base64,${base64}`;
      } catch (err) {
        Alert.alert('Error', 'Failed to process payment proof.');
        return;
      }
    }

    try {
      setLoading(true);
      const response = await api.post('/orders', payload);
      if (response.data.success) {
        await AsyncStorage.removeItem('cart');
        await AsyncStorage.setItem('cartCount', '0');
        navigation.navigate('OrderSuccess', {
          orderId: response.data.order.id,
          deliveryCode: response.data.delivery_code,
          grandTotal: grandTotal.toFixed(2),
          address: `${address}, ${city}`,
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to place order');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Payment method config ──────────────────────────
  const paymentOptions = [
    {
      key: 'wallet' as const,
      label: 'Wallet',
      sublabel: `₦${walletBalance.toLocaleString()}`,
      icon: 'wallet-outline' as const,
      color: WALLET_COLOR,
      bgLight: WALLET_LT,
      show: true,
    },
    {
      key: 'bank_transfer' as const,
      label: 'Bank',
      sublabel: 'Transfer',
      icon: 'business-outline' as const,
      color: BANK_COLOR,
      bgLight: BANK_LT,
      show: !!settings.manual_bank_enabled,
    },
    {
      key: 'paystack' as const,
      label: 'Paystack',
      sublabel: 'Card / USSD',
      icon: 'card-outline' as const,
      color: PAYSTACK_COLOR,
      bgLight: PAYSTACK_LT,
      show: !!settings.paystack_enabled,
    },
  ].filter(o => o.show);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={48} color={ORANGE} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubText}>Add some delicious items to get started!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activePayment = paymentOptions.find(o => o.key === paymentMethod)!;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Order Summary */}
          <View style={styles.sectionLabel}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabelText}>Order Summary</Text>
          </View>

          <View style={styles.card}>
            {cartItems.map((item, index) => {
              const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
              return (
                <View key={item.id} style={[styles.itemRow, index < cartItems.length - 1 && styles.itemRowDivider]}>
                  <View style={styles.itemQtyBadge}>
                    <Text style={styles.itemQtyText}>{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₦{(unitPrice * item.quantity).toFixed(2)}</Text>
                </View>
              );
            })}

            <View style={styles.divider} />

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Subtotal</Text>
              <Text style={styles.feeValue}>₦{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Delivery Fee</Text>
              {loadingDelivery ? <ActivityIndicator size="small" color={TEAL} /> :
                <Text style={styles.feeValue}>₦{deliveryFee.toFixed(2)}{estimatedTime ? `  ·  ${estimatedTime}` : ''}</Text>
              }
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Service Charge</Text>
              <Text style={styles.feeValue}>₦{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₦{grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Bus Stop */}
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: TEAL }]} />
            <Text style={styles.sectionLabelText}>Nearest Bus Stop</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.helperText}>Select the bus stop closest to your delivery address</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="bus-outline" size={16} color={TEAL} style={styles.pickerIcon} />
              <View style={styles.pickerInner}>
                <Picker
                  selectedValue={selectedBusStopId}
                  onValueChange={handleBusStopChange}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor={TEXT_MID}
                >
                  <Picker.Item label="Select a bus stop..." value={null} color={TEXT_LIGHT} />
                  {busStops.map((stop) => (
                    <Picker.Item key={stop.id} label={stop.name} value={stop.id} color={TEXT_DARK} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Delivery Details */}
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: TEAL }]} />
            <Text style={styles.sectionLabelText}>Delivery Details</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="home-outline" size={16} color={TEXT_LIGHT} />
              <TextInput style={styles.textInput} placeholder="e.g. 12 Broad Street" value={address} onChangeText={setAddress} placeholderTextColor={TEXT_LIGHT} />
            </View>

            <Text style={styles.inputLabel}>City</Text>
            <View style={styles.inputRow}>
              <Ionicons name="map-outline" size={16} color={TEXT_LIGHT} />
              <TextInput style={styles.textInput} placeholder="City" value={city} onChangeText={setCity} placeholderTextColor={TEXT_LIGHT} />
            </View>

            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={[styles.inputRow, { marginBottom: 0 }]}>
              <Ionicons name="call-outline" size={16} color={TEXT_LIGHT} />
              <TextInput style={styles.textInput} placeholder="08012345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={TEXT_LIGHT} />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: TEXT_LIGHT }]} />
            <Text style={styles.sectionLabelText}>Notes <Text style={styles.optionalTag}>(optional)</Text></Text>
          </View>

          <View style={styles.card}>
            <TextInput style={styles.notesInput} placeholder="e.g. No onions, extra sauce..." value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholderTextColor={TEXT_LIGHT} textAlignVertical="top" />
          </View>

          {/* ════════════════════════════════════════
              PAYMENT METHOD — REDESIGNED
          ════════════════════════════════════════ */}
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: ORANGE }]} />
            <Text style={styles.sectionLabelText}>Payment Method</Text>
          </View>

          <View style={styles.paymentCard}>
            {/* Tab row — equal width, perfectly aligned */}
            <View style={styles.payTabsRow}>
              {paymentOptions.map((option) => {
                const isActive = paymentMethod === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.payTab,
                      isActive && { borderColor: option.color, backgroundColor: option.bgLight },
                      paymentOptions.length === 2 && { flex: 1 },
                      paymentOptions.length === 3 && { flex: 1 },
                    ]}
                    onPress={() => setPaymentMethod(option.key)}
                    activeOpacity={0.82}
                  >
                    {/* Icon circle */}
                    <View style={[
                      styles.payTabIconCircle,
                      isActive
                        ? { backgroundColor: option.color }
                        : { backgroundColor: '#F1F5F9' },
                    ]}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isActive ? WHITE : TEXT_MID}
                      />
                    </View>

                    {/* Labels */}
                    <Text style={[
                      styles.payTabLabel,
                      isActive && { color: option.color },
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.payTabSub,
                      isActive && { color: option.color, opacity: 0.75 },
                    ]}>
                      {option.sublabel}
                    </Text>

                    {/* Active check badge */}
                    {isActive && (
                      <View style={[styles.payTabCheck, { backgroundColor: option.color }]}>
                        <Ionicons name="checkmark" size={9} color={WHITE} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Wallet Info Panel ── */}
            {paymentMethod === 'wallet' && (
              <View style={[styles.payInfoPanel, { borderColor: WALLET_COLOR, backgroundColor: WALLET_LT }]}>
                <View style={styles.payInfoRow}>
                  <View>
                    <Text style={[styles.payInfoTitle, { color: WALLET_COLOR }]}>Available Balance</Text>
                    <Text style={[styles.payInfoAmount, { color: WALLET_COLOR }]}>
                      ₦{walletBalance.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.payInfoBadge, {
                    backgroundColor: walletBalance >= grandTotal ? '#EDE9FE' : '#FEE2E2'
                  }]}>
                    <Ionicons
                      name={walletBalance >= grandTotal ? 'shield-checkmark' : 'warning'}
                      size={14}
                      color={walletBalance >= grandTotal ? WALLET_COLOR : '#EF4444'}
                    />
                    <Text style={[styles.payInfoBadgeText, {
                      color: walletBalance >= grandTotal ? WALLET_COLOR : '#EF4444'
                    }]}>
                      {walletBalance >= grandTotal ? 'Sufficient' : 'Insufficient'}
                    </Text>
                  </View>
                </View>
                {walletBalance < grandTotal && (
                  <Text style={styles.payInfoWarning}>
                    You need ₦{(grandTotal - walletBalance).toFixed(2)} more. Please top up your wallet or choose another payment method.
                  </Text>
                )}
              </View>
            )}

            {/* ── Paystack Info Panel ── */}
            {paymentMethod === 'paystack' && (
              <View style={[styles.payInfoPanel, { borderColor: PAYSTACK_COLOR, backgroundColor: PAYSTACK_LT }]}>
                <View style={styles.payInfoRow}>
                  <View>
                    <Text style={[styles.payInfoTitle, { color: PAYSTACK_COLOR }]}>Secure Payment</Text>
                    <Text style={[styles.payInfoDesc, { color: '#0891B2' }]}>
                      Pay with Card, USSD, Bank, or Mobile Money
                    </Text>
                  </View>
                  <View style={[styles.payInfoBadge, { backgroundColor: '#CFFAFE' }]}>
                    <Ionicons name="lock-closed" size={13} color={PAYSTACK_COLOR} />
                    <Text style={[styles.payInfoBadgeText, { color: PAYSTACK_COLOR }]}>Encrypted</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bank Transfer Details */}
          {paymentMethod === 'bank_transfer' && settings.manual_bank_enabled && (
            <>
              <View style={styles.sectionLabel}>
                <View style={[styles.sectionDot, { backgroundColor: BANK_COLOR }]} />
                <Text style={styles.sectionLabelText}>Bank Details</Text>
              </View>

              <View style={[styles.card, styles.bankCard]}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankKey}>Bank Name</Text>
                  <Text style={styles.bankVal}>{settings.manual_bank_name}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankKey}>Account No.</Text>
                  <Text style={[styles.bankVal, styles.accountNumber]}>{settings.manual_account_number}</Text>
                </View>
                <View style={[styles.bankDetailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.bankKey}>Account Name</Text>
                  <Text style={styles.bankVal}>{settings.manual_account_name}</Text>
                </View>

                <View style={styles.bankNotice}>
                  <Ionicons name="information-circle" size={14} color={BANK_COLOR} />
                  <Text style={[styles.bankNoticeText, { color: BANK_COLOR }]}>Transfer the exact amount, then upload proof below</Text>
                </View>

                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: BANK_COLOR }]} onPress={pickProofImage} activeOpacity={0.85}>
                  <Ionicons name="cloud-upload-outline" size={17} color={WHITE} />
                  <Text style={styles.uploadBtnText}>
                    {proofImage ? 'Change Payment Proof' : 'Upload Payment Proof'}
                  </Text>
                </TouchableOpacity>

                {proofImage && (
                  <View style={styles.proofWrap}>
                    <Image source={{ uri: proofImage }} style={styles.proofImg} resizeMode="cover" />
                    <View style={styles.proofBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={SUCCESS} />
                      <Text style={styles.proofBadgeText}>Proof uploaded successfully</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, (loading || loadingDelivery || !selectedBusStopId) && styles.confirmBtnDisabled]}
            onPress={confirmOrder}
            disabled={loading || loadingDelivery || !selectedBusStopId}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={WHITE} />
                <Text style={styles.confirmBtnText}>Confirm Order · ₦{grandTotal.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, letterSpacing: 0.1 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginLeft: 2 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  sectionLabelText: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, letterSpacing: 0.3, textTransform: 'uppercase' },
  optionalTag: { fontSize: 12, fontWeight: '400', color: TEXT_LIGHT },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  itemRowDivider: { borderBottomWidth: 1, borderBottomColor: BORDER },
  itemQtyBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: ORANGE_LT, alignItems: 'center', justifyContent: 'center' },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: ORANGE },
  itemName: { flex: 1, fontSize: 14, color: TEXT_DARK, fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feeLabel: { fontSize: 13, color: TEXT_MID },
  feeValue: { fontSize: 13, color: TEXT_DARK, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: BORDER },
  totalLabel: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  totalAmount: { fontSize: 17, fontWeight: '800', color: ORANGE },

  helperText: { fontSize: 12, color: TEXT_MID, marginBottom: 10 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingLeft: 12, overflow: 'hidden', height: 50 },
  pickerIcon: { marginRight: 6 },
  pickerInner: { flex: 1, height: 50, justifyContent: 'center' },
  picker: { flex: 1, color: TEXT_DARK, fontSize: 14, height: 50 },
  pickerItem: { fontSize: 14, color: TEXT_DARK },

  inputLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MID, marginBottom: 6, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: INPUT_BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, height: 48, marginBottom: 14 },
  textInput: { flex: 1, fontSize: 14, color: TEXT_DARK },
  notesInput: { fontSize: 14, color: TEXT_DARK, backgroundColor: INPUT_BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 12, height: 90, textAlignVertical: 'top' },

  // ── NEW: Payment Card & Tabs ──────────────────────
  paymentCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Row of tabs — flexDirection row, gap between them
  payTabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
  },

  // Individual tab card
  payTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
    position: 'relative',
    minHeight: 100,
  },

  payTabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  payTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
  },

  payTabSub: {
    fontSize: 10,
    fontWeight: '500',
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginTop: 2,
  },

  payTabCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info panel below tabs
  payInfoPanel: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },

  payInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  payInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  payInfoAmount: {
    fontSize: 22,
    fontWeight: '800',
  },

  payInfoDesc: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 180,
  },

  payInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  payInfoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  payInfoWarning: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 10,
    lineHeight: 18,
  },

  // Bank transfer
  bankCard: { borderColor: '#BFDBFE', backgroundColor: '#F0F9FF' },
  bankDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  bankKey: { fontSize: 13, color: TEXT_MID },
  bankVal: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  accountNumber: { fontWeight: '800', letterSpacing: 1, color: BANK_COLOR },
  bankNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8 },
  bankNoticeText: { fontSize: 12, fontWeight: '500', flex: 1 },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 13, marginTop: 12 },
  uploadBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
  proofWrap: { marginTop: 12 },
  proofImg: { width: '100%', height: 180, borderRadius: 10, backgroundColor: BORDER },
  proofBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, backgroundColor: '#ECFDF5', borderRadius: 8 },
  proofBadgeText: { fontSize: 12, color: SUCCESS, fontWeight: '600' },

  confirmBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnDisabled: { opacity: 0.55 },
  confirmBtnText: { color: WHITE, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: ORANGE_LT, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: TEXT_LIGHT, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  browseBtn: { backgroundColor: ORANGE, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  browseBtnText: { color: WHITE, fontSize: 14, fontWeight: '800' },
});