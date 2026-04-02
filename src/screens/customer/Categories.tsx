import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
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
const TEXT_LIGHT = '#8AA09E';
const BORDER     = '#EEF3F2';

// ── Category accent colors & icons ───────────────────
const categoryConfig: { [key: string]: { color: string; accent: string; icon: any } } = {
  kitchen:     { color: '#FF6200', accent: '#FFF0E8', icon: 'restaurant-outline'   },
  pharmacy:    { color: '#7B1FA2', accent: '#F3E5F5', icon: 'medical-outline'       },
  supermarket: { color: '#00897B', accent: '#E8F5F3', icon: 'basket-outline'        },
};

const fallbackConfig = { color: '#1E88E5', accent: '#E3F2FD', icon: 'grid-outline' };

// ── Your local images (original) ─────────────────────
const categoryImages: { [key: string]: any } = {
  kitchen:     require('../../../assets/categories/kitchen.jpg'),
  pharmacy:    require('../../../assets/categories/pharmacy.jpg'),
  supermarket: require('../../../assets/categories/supermarket.jpg'),
};

export default function Categories() {
  // ── ALL ORIGINAL LOGIC ────────────────────────────
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const navigation = useNavigation<CustomerNavigationProp>();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/home/items');
      console.log('API full response:', JSON.stringify(res.data, null, 2));

      const types = new Set<string>();
      if (res.data?.items && Array.isArray(res.data.items)) {
        res.data.items.forEach((item: any) => {
          const type = item?.vendor?.type || item?.vendor?.vendor_type;
          if (type && typeof type === 'string' && type.trim()) {
            types.add(type.trim());
          }
        });
      }

      const sortedTypes = Array.from(types).sort();
      console.log('Real categories from backend:', sortedTypes);
      setCategories(sortedTypes);
    } catch (err) {
      console.error('Fetch categories failed:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER CATEGORY CARD ──────────────────────────
  const renderCategory = ({ item, index }: { item: string; index: number }) => {
    const key         = item.toLowerCase();
    const imageSource = categoryImages[key] || categoryImages.kitchen;
    const cfg         = categoryConfig[key] || fallbackConfig;
    const label       = item.charAt(0).toUpperCase() + item.slice(1);

    // Alternate card heights for visual rhythm
    const isLarge = index % 3 === 0;

    return (
      <TouchableOpacity
        style={[styles.categoryCard, { height: isLarge ? 200 : 160 }]}
        onPress={() => navigation.navigate('VendorsByCategory', { category: item })}
        activeOpacity={0.88}
      >
        {/* Background image */}
        <Image source={imageSource} style={styles.categoryImage} />

        {/* Gradient overlay — darker at bottom */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Category icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon} size={14} color={WHITE} />
        </View>

        {/* Label */}
        <View style={styles.labelWrap}>
          <Text style={styles.categoryTitle}>{label}</Text>
          <View style={styles.arrowWrap}>
            <Ionicons name="arrow-forward" size={12} color={WHITE} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── RENDER ────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        {categories.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{categories.length} types</Text>
          </View>
        )}
      </View>

      {/* ── Subtitle strip ── */}
      {!loading && categories.length > 0 && (
        <View style={styles.subtitleStrip}>
          <Ionicons name="storefront-outline" size={13} color={TEXT_LIGHT} />
          <Text style={styles.subtitleText}>Browse by vendor type</Text>
        </View>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading categories…</Text>
        </View>

      /* ── Empty ── */
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="grid-outline" size={48} color={ORANGE} />
          </View>
          <Text style={styles.emptyTitle}>No categories available</Text>
          <Text style={styles.emptySubText}>Check back soon for more options</Text>
        </View>

      /* ── Grid ── */
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item}
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
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD5BC',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE,
  },

  // ── Subtitle ──
  subtitleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  subtitleText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },

  // ── Loading / Empty ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  emptySubText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },

  // ── Grid ──
  list: {
    padding: 18,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // ── Category Card ──
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  // Icon badge (top-left)
  iconBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Label (bottom)
  labelWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});