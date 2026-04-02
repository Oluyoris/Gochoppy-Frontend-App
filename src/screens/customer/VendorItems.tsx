import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { CustomerNavigationProp } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

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

export default function VendorItems() {
  // ── ALL ORIGINAL LOGIC ────────────────────────────
  const route = useRoute<any>();
  const { vendorId, vendorName } = route.params || {};
  const navigation = useNavigation<CustomerNavigationProp>();

  const [items, setItems]               = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [loading, setLoading]           = useState(true);
  const [cartCount, setCartCount]       = useState(0);

  useEffect(() => {
    if (vendorId) fetchVendorItems();
    loadCartCount();
  }, [vendorId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items.slice(0, 20));
    } else {
      const lowerQuery = searchQuery.toLowerCase().trim();
      const results = items.filter((item: any) =>
        item.name.toLowerCase().includes(lowerQuery)
      );
      setFilteredItems(results);
    }
  }, [searchQuery, items]);

  const loadCartCount = async () => {
    try {
      const cart = await AsyncStorage.getItem('cart');
      if (cart) {
        const cartItems = JSON.parse(cart);
        const total = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.log('Load cart count error:', error);
      setCartCount(0);
    }
  };

  const addToCart = async (item: any) => {
    try {
      const currentCart = await AsyncStorage.getItem('cart');
      let cartItems = currentCart ? JSON.parse(currentCart) : [];

      const existingIndex = cartItems.findIndex((c: any) => c.id === item.id);
      if (existingIndex !== -1) {
        cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1;
      } else {
        cartItems.push({ ...item, quantity: 1 });
      }

      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));

      const total = cartItems.reduce((sum: number, c: any) => sum + (c.quantity || 1), 0);
      setCartCount(total);

      Alert.alert('Added!', `${item.name} added to cart (${cartItems.find((c: any) => c.id === item.id)?.quantity || 1} ×)`);
    } catch (error) {
      console.log('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add item. Try again.');
    }
  };

  const fetchVendorItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/home/items');
      const allItems = res.data.items || [];
      const vendorItems = allItems.filter((item: any) => item?.vendor?.id === vendorId);
      vendorItems.sort((a: any, b: any) => b.id - a.id);
      setItems(vendorItems);
      setFilteredItems(vendorItems.slice(0, 20));
    } catch (err) {
      console.error('Failed to fetch vendor items:', err);
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => setSearchQuery('');

  // ── ITEM CARD ─────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { item })}
      activeOpacity={0.88}
    >
      {/* Image */}
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={styles.itemImage}
      />

      {/* Subtle bottom gradient overlay */}
      <View style={styles.imageOverlay} />

      {/* Heart / fav button */}
      <TouchableOpacity style={styles.favBtn} activeOpacity={0.8}>
        <Ionicons name="heart-outline" size={14} color={ORANGE} />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>₦{Number(item.price).toLocaleString()}</Text>

          {/* Add to cart button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addToCart(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color={WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{vendorName}'s Menu</Text>
          {!loading && filteredItems.length > 0 && (
            <Text style={styles.headerSub}>{filteredItems.length} items</Text>
          )}
        </View>

        {/* Cart icon with badge */}
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={20} color={WHITE} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={TEXT_LIGHT} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${vendorName}'s items…`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={TEXT_LIGHT}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading menu…</Text>
        </View>

      /* ── Empty ── */
      ) : filteredItems.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="basket-outline" size={48} color={ORANGE} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching items' : 'No items yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'This vendor has no items listed yet'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearSearch} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>

      /* ── Grid ── */
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '600',
    marginTop: 1,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: TEAL,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  cartBadgeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: '900',
  },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    marginHorizontal: 18,
    marginVertical: 14,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    paddingVertical: 0,
  },

  // ── States ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  emptySubText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 8,
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD5BC',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ORANGE,
  },

  // ── Grid ──
  list: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // ── Item Card ──
  itemCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // Fav button (top-right on image)
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Info section
  itemInfo: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});