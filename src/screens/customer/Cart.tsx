import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE     = '#FF6200';
const TEAL       = '#00897B';
const WHITE      = '#FFFFFF';
const BG         = '#F7F9F8';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#1A2E2B';
const TEXT_MID   = '#4A6360';
const TEXT_LIGHT = '#8AA09E';
const BORDER     = '#EEF3F2';
const RED        = '#EF4444';

type CartItem = {
  id: number;
  name: string;
  price: number | string;
  image: string | null;
  vendor?: {
    id: number;
    name: string;
    type?: string;
  };
  quantity: number;
};

export default function Cart({ navigation }: any) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── ALL ORIGINAL LOGIC ────────────────────────────
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cart = await AsyncStorage.getItem('cart');
      if (cart) {
        const items = JSON.parse(cart);
        setCartItems(items);
      }
    } catch (error) {
      console.log('Load cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedItems);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedItems));

    const total = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    await AsyncStorage.setItem('cartCount', total.toString());
  };

  const removeItem = async (id: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = cartItems.filter(item => item.id !== id);
            setCartItems(updatedItems);
            await AsyncStorage.setItem('cart', JSON.stringify(updatedItems));

            const total = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            await AsyncStorage.setItem('cartCount', total.toString());
          },
        },
      ]
    );
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  // ── LOADING ───────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // ── EMPTY STATE ───────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={52} color={ORANGE} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubText}>
            Add some delicious items to get started!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.88}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN CART ─────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{cartItems.length} items</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Cart Items ── */}
        {cartItems.map(item => {
          const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
          const subtotal = unitPrice * item.quantity;

          return (
            <View key={item.id} style={styles.cartCard}>
              {/* Item image */}
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                style={styles.cartImage}
              />

              {/* Item info */}
              <View style={styles.cartInfo}>
                <View style={styles.cartTopRow}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  {/* Remove button */}
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.removeBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={15} color={RED} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.cartVendor} numberOfLines={1}>
                  {item.vendor?.name || 'Vendor'}
                </Text>

                <View style={styles.cartBottomRow}>
                  {/* Subtotal */}
                  <Text style={styles.cartSubtotal}>₦{subtotal.toFixed(2)}</Text>

                  {/* Quantity controls */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={14} color={ORANGE} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, styles.qtyBtnAdd]}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={14} color={WHITE} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.cartUnitPrice}>₦{unitPrice} per item</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={[styles.summaryValue, { color: TEAL }]}>Calculated at checkout</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₦{totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout button */}
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={WHITE} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  itemCountBadge: {
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD5BC',
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: ORANGE,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  browseBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  browseBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Cart Card ──
  cartCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cartImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 12,
  },
  cartInfo: {
    flex: 1,
  },
  cartTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  cartName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cartVendor: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 10,
  },
  cartBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSubtotal: {
    fontSize: 15,
    fontWeight: '800',
    color: ORANGE,
  },
  cartUnitPrice: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 4,
  },

  // ── Quantity Controls ──
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  qtyBtnAdd: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    minWidth: 20,
    textAlign: 'center',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: TEXT_MID,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: ORANGE,
  },
  checkoutBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  checkoutText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});