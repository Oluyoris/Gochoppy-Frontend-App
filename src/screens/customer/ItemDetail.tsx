import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';

const { width } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE      = '#FF6200';
const ORANGE_SOFT = '#FFF3EC';
const ORANGE_BORDER = '#FFD5BC';
const TEAL        = '#00897B';
const TEAL_DARK   = '#00695C';
const TEAL_LIGHT  = '#4DB6AC';
const TEAL_BG     = '#E0F2F1';
const WHITE       = '#FFFFFF';
const BG          = '#F5FAF9';
const CARD_BG     = '#FFFFFF';
const TEXT_DARK   = '#1A2E2B';
const TEXT_MID    = '#3D6360';
const TEXT_SOFT   = '#8FABA8';
const BORDER      = '#D4ECEA';
const STAR_COLOR  = '#FFB300';

type Item = {
  id: number;
  name: string;
  price: number | string;
  image: string | null;
  vendor?: { id: number; name: string; type?: string };
  description?: string;
};

// ── Small star row ────────────────────────────────────
function Stars({ rating = 4.3 }: { rating?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {Array(full).fill(0).map((_, i)  => <Ionicons key={`f${i}`} name="star"         size={12} color={STAR_COLOR} />)}
      {half &&                              <Ionicons              name="star-half"     size={12} color={STAR_COLOR} />}
      {Array(empty).fill(0).map((_, i) => <Ionicons key={`e${i}`} name="star-outline"  size={12} color={STAR_COLOR} />)}
      <Text style={{ fontSize: 11, color: TEXT_SOFT, marginLeft: 4, fontFamily: 'Quicksand_600SemiBold' }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export default function ItemDetail({ route, navigation }: any) {
  // ── ALL ORIGINAL LOGIC (untouched) ────────────────
  const { item }: { item: Item } = route.params;

  const [quantity, setQuantity]             = useState(1);
  const [similarItems, setSimilarItems]     = useState<Item[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [addedToCart, setAddedToCart]       = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8,   useNativeDriver: true }),
    ]).start();
    if (item?.vendor?.id) fetchSimilarItems();
  }, [item]);

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const addToCart = async () => {
    try {
      const currentCart = await AsyncStorage.getItem('cart');
      let cartItems = currentCart ? JSON.parse(currentCart) : [];
      const existingIndex = cartItems.findIndex((c: any) => c.id === item.id);
      if (existingIndex !== -1) {
        cartItems[existingIndex].quantity += quantity;
      } else {
        cartItems.push({ ...item, quantity });
      }
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      Alert.alert('Added to Cart', `${quantity} × ${item.name} added!`);
    } catch (error) {
      console.log('Add to cart error:', error);
      Alert.alert('Error', 'Could not add to cart.');
    }
  };

  const fetchSimilarItems = async () => {
    try {
      setLoadingSimilar(true);
      const res = await api.get('/home/items');
      const allItems: Item[] = res.data.items || [];
      const sameVendorItems = allItems
        .filter((i: Item) => i.vendor?.id === item.vendor?.id && i.id !== item.id)
        .sort((a: Item, b: Item) => b.id - a.id)
        .slice(0, 10);
      setSimilarItems(sameVendorItems);
    } catch (err) {
      console.log('Failed to load similar items:', err);
      setSimilarItems([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const unitPrice = Number(item.price);
  const subtotal  = unitPrice * quantity;

  // mock rating per item
  const itemRating = parseFloat((3.7 + (item.id % 13) * 0.1).toFixed(1));

  const renderSimilarItem = ({ item: simItem }: { item: Item }) => (
    <TouchableOpacity
      style={styles.similarCard}
      onPress={() => navigation.navigate('ItemDetail', { item: simItem })}
      activeOpacity={0.88}
    >
      <Image
        source={{ uri: simItem.image || 'https://via.placeholder.com/150' }}
        style={styles.similarImage}
      />
      <View style={styles.similarInfo}>
        <Text style={styles.similarName} numberOfLines={1}>{simItem.name}</Text>
        <Text style={styles.similarPrice}>₦{Number(simItem.price).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Static Header (untouched as requested) ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity style={styles.favBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero Image ── */}
        <Animated.View style={[styles.heroWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/400' }}
            style={styles.heroImage}
          />
          {/* Teal gradient-like bottom fade */}
          <View style={styles.heroBottomFade} />

          {/* Badges on image */}
          <View style={styles.vendorChip}>
            <View style={styles.vendorDot} />
            <Text style={styles.vendorChipText} numberOfLines={1}>
              {item.vendor?.name || 'Vendor'}
            </Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{item.vendor?.type || 'Food'}</Text>
          </View>

          {/* Price badge sitting on bottom edge of image */}
          <View style={styles.heroPriceBadge}>
            <Text style={styles.heroPriceLabel}>Unit Price</Text>
            <Text style={styles.heroPriceValue}>₦{unitPrice.toLocaleString()}</Text>
          </View>
        </Animated.View>

        {/* ── Name + Rating ── */}
        <Animated.View style={[styles.nameBlock, { opacity: fadeAnim }]}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Stars rating={itemRating} />
            <View style={styles.ratingDivider} />
            <Ionicons name="location-outline" size={12} color={TEXT_SOFT} />
            <Text style={styles.deliveryText}>Express Delivery</Text>
          </View>
        </Animated.View>

        {/* ── Quantity + Subtotal Card ── */}
        <View style={styles.qtyCard}>
          {/* Left: label + subtotal */}
          <View>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalStaticText}>Subtotal </Text>
              <Text style={styles.subtotalValue}>₦{subtotal.toLocaleString()}</Text>
            </View>
          </View>

          {/* Right: stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnOutline, quantity === 1 && { opacity: 0.3 }]}
              onPress={decreaseQuantity}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={16} color={ORANGE} />
            </TouchableOpacity>

            <View style={styles.stepCount}>
              <Text style={styles.stepNum}>{quantity}</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnFilled]}
              onPress={increaseQuantity}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Description Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardIcon}>
              <Ionicons name="document-text-outline" size={14} color={ORANGE} />
            </View>
            <Text style={styles.infoCardTitle}>Description</Text>
          </View>
          <Text style={styles.descText}>
            {item.description ||
              'No description available for this item. Enjoy premium quality from trusted vendors on GoChoppy.'}
          </Text>
        </View>

        {/* ── Vendor Info Strip ── */}
        <View style={styles.vendorStrip}>
          <View style={styles.vendorStripLeft}>
            <View style={styles.vendorAvatar}>
              <Ionicons name="storefront" size={18} color={TEAL_DARK} />
            </View>
            <View>
              <Text style={styles.vendorStripName}>{item.vendor?.name || 'Vendor'}</Text>
              <Text style={styles.vendorStripType}>{item.vendor?.type || 'Food & Drinks'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.vendorVisitBtn}>
            <Text style={styles.vendorVisitText}>Visit Store</Text>
            <Ionicons name="arrow-forward" size={12} color={TEAL_DARK} />
          </TouchableOpacity>
        </View>

        {/* ── Similar Items ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardIcon, { backgroundColor: TEAL_BG }]}>
              <Ionicons name="grid-outline" size={14} color={TEAL_DARK} />
            </View>
            <Text style={styles.infoCardTitle}>More from {item.vendor?.name || 'this vendor'}</Text>
          </View>

          {loadingSimilar ? (
            <ActivityIndicator size="small" color={TEAL} style={{ marginVertical: 20 }} />
          ) : similarItems.length === 0 ? (
            <Text style={styles.emptySimilar}>No other items from this vendor</Text>
          ) : (
            <FlatList
              data={similarItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={sim => sim.id.toString()}
              renderItem={renderSimilarItem}
              contentContainerStyle={{ paddingVertical: 4, gap: 12 }}
            />
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerTotal}>₦{subtotal.toLocaleString()}</Text>
        </View>

        <View style={styles.footerBtnRow}>
          {/* Order Now */}
          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.88}>
            <Ionicons name="flash-outline" size={16} color={ORANGE} />
            <Text style={styles.orderBtnText}>Order Now</Text>
          </TouchableOpacity>

          {/* Add to Cart */}
          <TouchableOpacity
            style={[styles.addBtn, addedToCart && styles.addBtnSuccess]}
            onPress={addToCart}
            activeOpacity={0.88}
          >
            <Ionicons
              name={addedToCart ? 'checkmark-circle-outline' : 'cart-outline'}
              size={16}
              color={WHITE}
            />
            <Text style={styles.addBtnText}>
              {addedToCart ? 'Added!' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header (static / unchanged) ───────────────────
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
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerTitle: { fontSize: 15, fontFamily: 'Quicksand_700Bold', color: TEXT_DARK, letterSpacing: 0.1 },
  favBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: ORANGE_BORDER,
  },

  scrollContent: { paddingBottom: 20 },

  // ── Hero Image ────────────────────────────────────
  heroWrapper: {
    width: '100%',
    height: 280,
    position: 'relative',
    marginBottom: 0,
    // Teal border on the image
    borderBottomWidth: 3,
    borderBottomColor: TEAL_LIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 90,
    // deep teal-to-transparent gradient simulation
    backgroundColor: 'rgba(0,60,55,0.55)',
  },
  vendorChip: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,40,36,0.75)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(77,182,172,0.4)',
  },
  vendorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: TEAL_LIGHT },
  vendorChipText: { fontSize: 11, fontFamily: 'Quicksand_700Bold', color: WHITE },
  categoryChip: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: ORANGE,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 10, fontFamily: 'Quicksand_700Bold',
    color: WHITE, textTransform: 'capitalize', letterSpacing: 0.4,
  },
  // Price badge on bottom of image
  heroPriceBadge: {
    position: 'absolute', bottom: 14, right: 14,
    backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TEAL_LIGHT,
    alignItems: 'flex-end',
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  heroPriceLabel: { fontSize: 9, fontFamily: 'Quicksand_600SemiBold', color: TEXT_SOFT, letterSpacing: 0.5 },
  heroPriceValue: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: ORANGE },

  // ── Name + Rating ─────────────────────────────────
  nameBlock: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: TEXT_DARK,
    lineHeight: 26,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingDivider: {
    width: 1, height: 12,
    backgroundColor: BORDER,
    marginHorizontal: 2,
  },
  deliveryText: {
    fontSize: 11,
    fontFamily: 'Quicksand_600SemiBold',
    color: TEAL,
  },

  // ── Quantity Card ─────────────────────────────────
  qtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  qtyLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_700Bold',
    color: TEXT_MID,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  subtotalRow: { flexDirection: 'row', alignItems: 'center' },
  subtotalStaticText: {
    fontSize: 12, fontFamily: 'Quicksand_500Medium', color: TEXT_SOFT,
  },
  subtotalValue: {
    fontSize: 15, fontFamily: 'Quicksand_700Bold', color: TEAL_DARK,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnOutline: {
    backgroundColor: WHITE,
  },
  stepBtnFilled: {
    backgroundColor: ORANGE,
  },
  stepCount: {
    width: 40, height: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER,
  },
  stepNum: {
    fontSize: 16, fontFamily: 'Quicksand_700Bold', color: TEXT_DARK,
  },

  // ── Info Card ─────────────────────────────────────
  infoCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  infoCardIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: ORANGE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 13, fontFamily: 'Quicksand_700Bold', color: TEXT_DARK, letterSpacing: 0.1,
  },
  descText: {
    fontSize: 13, fontFamily: 'Quicksand_500Medium',
    color: TEXT_MID, lineHeight: 21,
  },

  // ── Vendor Strip ──────────────────────────────────
  vendorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TEAL_BG,
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  vendorStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#B2DFDB',
  },
  vendorStripName: {
    fontSize: 13, fontFamily: 'Quicksand_700Bold', color: TEAL_DARK,
  },
  vendorStripType: {
    fontSize: 11, fontFamily: 'Quicksand_500Medium', color: TEXT_MID, marginTop: 1,
  },
  vendorVisitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#B2DFDB',
  },
  vendorVisitText: {
    fontSize: 11, fontFamily: 'Quicksand_700Bold', color: TEAL_DARK,
  },

  // ── Similar Cards ─────────────────────────────────
  similarCard: {
    width: 140,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  similarImage: { width: '100%', height: 100, resizeMode: 'cover' },
  similarInfo:  { padding: 9 },
  similarName:  { fontSize: 12, fontFamily: 'Quicksand_700Bold',   color: TEXT_DARK, marginBottom: 3 },
  similarPrice: { fontSize: 12, fontFamily: 'Quicksand_700Bold',   color: ORANGE },
  emptySimilar: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: TEXT_SOFT, marginVertical: 16 },

  // ── Sticky Footer ─────────────────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28,
    backgroundColor: WHITE,
    borderTopWidth: 1.5,
    borderTopColor: TEAL_LIGHT,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 16,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 12, fontFamily: 'Quicksand_600SemiBold', color: TEXT_SOFT,
  },
  footerTotal: {
    fontSize: 20, fontFamily: 'Quicksand_700Bold', color: TEXT_DARK, letterSpacing: -0.3,
  },
  footerBtnRow: { flexDirection: 'row', gap: 12 },
  orderBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 50, borderRadius: 14,
    borderWidth: 2, borderColor: ORANGE,
    backgroundColor: ORANGE_SOFT,
  },
  orderBtnText: {
    fontSize: 13, fontFamily: 'Quicksand_700Bold', color: ORANGE, letterSpacing: 0.1,
  },
  addBtn: {
    flex: 1.6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 14,
    backgroundColor: ORANGE,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 7,
  },
  addBtnSuccess: { backgroundColor: TEAL, shadowColor: TEAL },
  addBtnText: {
    fontSize: 13, fontFamily: 'Quicksand_700Bold', color: WHITE, letterSpacing: 0.2,
  },
});