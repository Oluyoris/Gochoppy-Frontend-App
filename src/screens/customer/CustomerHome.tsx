import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext'; // ← THEME IMPORT

// ── Responsive helpers ───────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET  = SCREEN_W >= 768;
const IS_LARGE   = SCREEN_W >= 1024;
const H_PAD      = IS_TABLET ? 28 : 20;

const DISCOVER_W = IS_TABLET ? SCREEN_W * 0.42 : SCREEN_W * 0.72;
const SLIDE_W    = IS_TABLET ? SCREEN_W * 0.38 : SCREEN_W * 0.68;

const NUM_CAT_COLS = IS_LARGE ? 5 : IS_TABLET ? 4 : 3;
const CAT_CARD_W   = Math.floor((SCREEN_W - H_PAD * 2 - 12 * (NUM_CAT_COLS - 1)) / NUM_CAT_COLS);
const CAT_ICON_H   = IS_TABLET ? 90 : 78;

const NUM_BRAND_COLS = IS_LARGE ? 8 : IS_TABLET ? 6 : 4;
const BRAND_CARD_W   = Math.floor((SCREEN_W - H_PAD * 2 - 14 * (NUM_BRAND_COLS - 1)) / NUM_BRAND_COLS);
const BRAND_LOGO_S   = Math.min(BRAND_CARD_W - 8, IS_TABLET ? 88 : 74);

const FILTER_CIRCLE = IS_TABLET ? 68 : 58;
const FILTER_EMOJI  = IS_TABLET ? 30 : 26;
const FILTER_FONT   = IS_TABLET ? 11 : 10;

// ── Design Tokens (brand / accent colours — never change with theme) ─
const TEAL        = '#00897B';
const TEAL_DARK   = '#00695C';
const TEAL_BG     = '#E0F2F1';
const TEAL_BANNER = '#00897B';
const ORANGE      = '#FF6200';
const WHITE       = '#FFFFFF';
const STAR_COLOR  = '#FFB300';
const WARM_BEIGE   = '#FDF3E7';
const WARM_BEIGE_2 = '#FAE8D0';
const WARM_ACCENT  = '#F5C89A';

// ── Types ────────────────────────────────────────────────
type Item = {
  id: number;
  name: string;
  price: number | string;
  image: string | null;
  vendor?: { id: number; name: string; type?: string; logo?: string | null };
  rating?: number;
};

type Vendor = {
  id: number;
  name: string;
  logo: string | null;
  type: string;
};

// ── Menu items ───────────────────────────────────────────
const menuItems = [
  { label: 'Home',       icon: 'home-outline' as const,    screen: 'Home'            },
  { label: 'Categories', icon: 'grid-outline' as const,    screen: 'Categories'      },
  { label: 'History',    icon: 'list-outline' as const,    screen: 'Activities'      },
  { label: 'Wallet',     icon: 'wallet-outline' as const,  screen: 'CustomerWallet'  },
  { label: 'Profile',    icon: 'person-outline' as const,  screen: 'CustomerProfile' },
  { label: 'Coupons',    icon: 'gift-outline' as const,    screen: 'CustomerCoupon'  },
  { label: 'Cart',       icon: 'cart-outline' as const,    screen: 'Cart'            },
];

// ─────────────────────────────────────────────────────────
// FILTER KEYWORD MAP
// ─────────────────────────────────────────────────────────
const FILTER_RULES: Record<string, {
  vendorTypes:  string[];
  nameKeywords: string[];
  sectionTitle: string;
}> = {
  Promotions: {
    vendorTypes:  [],
    nameKeywords: [],
    sectionTitle: 'Promotions',
  },
  Food: {
    vendorTypes:  ['kitchen', 'food', 'restaurant', 'canteen', 'eatery'],
    nameKeywords: ['rice', 'chicken', 'beef', 'stew', 'soup', 'pasta',
                   'bread', 'egg', 'yam', 'plantain', 'noodle', 'shawarma',
                   'burger', 'pizza', 'sandwich', 'salad', 'fish', 'meat'],
    sectionTitle: 'Kitchen Foods',
  },
  Pharmacy: {
    vendorTypes:  ['pharmacy', 'drug', 'chemist', 'health'],
    nameKeywords: ['tablet', 'capsule', 'syrup', 'cream', 'drug', 'medicine',
                   'paracetamol', 'ibuprofen', 'vitamin', 'supplement',
                   'antibiotic', 'lotion', 'gel', 'drops', 'injection',
                   'bandage', 'health'],
    sectionTitle: 'Pharmacy Items',
  },
  Supermarket: {
    vendorTypes:  ['supermarket', 'grocery', 'store', 'mart', 'market'],
    nameKeywords: ['flour', 'sugar', 'salt', 'oil', 'tomato', 'pasta',
                   'noodle', 'biscuit', 'milk', 'butter', 'cheese',
                   'yogurt', 'cereal', 'snack', 'drink', 'detergent',
                   'soap', 'tissue', 'diaper', 'baby', 'can', 'tin'],
    sectionTitle: 'Supermarket Items',
  },
  'Local Food': {
    vendorTypes:  ['kitchen', 'food', 'restaurant', 'local', 'canteen', 'eatery'],
    nameKeywords: ['amala', 'eba', 'iyan', 'fufu', 'pounded', 'egusi',
                   'ogbono', 'ofe', 'banga', 'okra', 'efo', 'edikaikong',
                   'miyan', 'tuwon', 'akpu', 'ogi', 'akara', 'moimoi',
                   'jollof', 'ofada', 'oha', 'bitter leaf', 'ugwu', 'ukwa',
                   'afang', 'abak', 'banga', 'native', 'local', 'swallow',
                   'eba ', 'semovita', 'wheat'],
    sectionTitle: 'Local Foods',
  },
  Water: {
    vendorTypes:  ['water', 'beverage', 'drinks', 'supermarket', 'store'],
    nameKeywords: ['water', 'still water', 'sparkling', 'eva', 'nestle',
                   'ragolis', 'table water', 'mineral water', 'aqua', 'h2o'],
    sectionTitle: 'Water & Beverages',
  },
  Juice: {
    vendorTypes:  ['beverage', 'drinks', 'juice', 'supermarket', 'store'],
    nameKeywords: ['juice', 'coke', 'cola', 'coca', 'fanta', 'sprite',
                   'malt', 'malta', 'pepsi', 'mirinda', '7up', 'seven up',
                   'active', 'chivita', 'five alive', 'ribena', 'smoov',
                   'hollandia', 'trophy', 'star', 'heineken', 'dubic',
                   'energy drink', 'boost', 'predator', 'power horse',
                   'mountain dew', 'schweppes', 'bitter lemon', 'tonic',
                   'chapman', 'zobo', 'kunu', 'tigernut', 'smoothie', 'shake'],
    sectionTitle: 'Drinks & Juices',
  },
};

function itemMatchesFilter(item: Item, filterLabel: string): boolean {
  const rule = FILTER_RULES[filterLabel];
  if (!rule) return true;
  if (filterLabel === 'Promotions') return true;
  const vendorType = (item.vendor?.type  ?? '').toLowerCase().trim();
  const itemName   = (item.name          ?? '').toLowerCase().trim();
  const matchesType    = rule.vendorTypes.some(t  => vendorType.includes(t));
  const matchesName    = rule.nameKeywords.some(kw => itemName.includes(kw));
  return matchesType || matchesName;
}

// ── Data ─────────────────────────────────────────────────
const foodFilters = [
  { label: 'Promotions',  emoji: '🏷️', circleColor: '#FF3B5C', bg: '#FFE4EA', textColor: '#C0143C', searchType: 'promotions'  },
  { label: 'Food',        emoji: '🍽️', circleColor: '#00897B', bg: '#D0F5F0', textColor: '#00695C', searchType: 'food'        },
  { label: 'Pharmacy',    emoji: '💊', circleColor: '#7B2FBE', bg: '#EFE0FF', textColor: '#5C1A9A', searchType: 'pharmacy'    },
  { label: 'Supermarket', emoji: '🛒', circleColor: '#FF6200', bg: '#FFEADB', textColor: '#CC4400', searchType: 'supermarket' },
  { label: 'Local Food',  emoji: '🍲', circleColor: '#2E7D32', bg: '#D6F5DA', textColor: '#1B5E20', searchType: 'local food'  },
  { label: 'Water',       emoji: '💧', circleColor: '#0288D1', bg: '#D6EEFF', textColor: '#01579B', searchType: 'water'       },
  { label: 'Juice',       emoji: '🥤', circleColor: '#F57C00', bg: '#FFF0D6', textColor: '#BF5600', searchType: 'juice'       },
];

const categoryPills = [
  { label: 'Kitchen',     icon: 'restaurant-outline' as const, color: TEAL_DARK, bg: '#E0F2F1' },
  { label: 'Supermarket', icon: 'cart-outline' as const,       color: ORANGE,    bg: '#FFF0E8' },
  { label: 'Pharmacy',    icon: 'medkit-outline' as const,     color: '#6A1B9A', bg: '#F3E5F5' },
];

// ────────────────────────────────────────────────────────
// STAR RATING
// ────────────────────────────────────────────────────────
function StarRating({ rating = 4.2, size = 9 }: { rating?: number; size?: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {Array(full).fill(0).map((_, i)  => <Ionicons key={`f${i}`} name="star"         size={size} color={STAR_COLOR} />)}
      {half && <Ionicons name="star-half" size={size} color={STAR_COLOR} />}
      {Array(empty).fill(0).map((_, i) => <Ionicons key={`e${i}`} name="star-outline" size={size} color={STAR_COLOR} />)}
      <Text style={{ fontSize: size - 1, color: '#8FABA8', marginLeft: 2, fontFamily: 'Quicksand_600SemiBold' }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────
// SECTION HEADER  — theme-aware
// ────────────────────────────────────────────────────────
function SectionHeader({ title, textColor }: { title: string; textColor: string }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <View style={sh.accent} />
        <Text style={[sh.title, { color: textColor }]}>{title}</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD, marginBottom: 12 },
  left:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  accent: { width: 3, height: 13, borderRadius: 2, backgroundColor: ORANGE },
  title:  { fontSize: IS_TABLET ? 16 : 14, fontFamily: 'Quicksand_700Bold', letterSpacing: 0.2 },
});

// ────────────────────────────────────────────────────────
// FILTER SECTION BG — dark-mode aware
// ────────────────────────────────────────────────────────
function FilterSectionBg({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <View style={[fsb.outer, { backgroundColor: isDark ? '#1A2E2B' : '#EDF7F6' }]}>
      <View style={fsb.blobTopLeft} />
      <View style={fsb.blobBottomRight} />
      <View style={fsb.blobMid} />
      <View style={fsb.ringDecor} />
      {children}
    </View>
  );
}
const fsb = StyleSheet.create({
  outer:           { paddingTop: 16, paddingBottom: 18, marginBottom: 8, overflow: 'hidden', shadowColor: '#00897B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 3 },
  blobTopLeft:     { position: 'absolute', top: -40,  left: -40,  width: 140, height: 140, borderRadius: 70, backgroundColor: '#B2DFDB', opacity: 0.20 },
  blobBottomRight: { position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: '#80CBC4', opacity: 0.15 },
  blobMid:         { position: 'absolute', top: 20, right: '35%', width: 70, height: 70, borderRadius: 35, backgroundColor: '#A5D6A7', opacity: 0.12 },
  ringDecor:       { position: 'absolute', top: -50, right: 60, width: 120, height: 120, borderRadius: 60, borderWidth: 16, borderColor: '#80CBC4', opacity: 0.15, backgroundColor: 'transparent' },
});

// ────────────────────────────────────────────────────────
// WARM SECTION BG — dark-mode aware
// ────────────────────────────────────────────────────────
function WarmSectionBg({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <View style={[wsb.outer, { backgroundColor: isDark ? '#1E1A14' : WARM_BEIGE }]}>
      <View style={wsb.blobTopRight} />
      <View style={wsb.blobBottomLeft} />
      <View style={wsb.blobMid} />
      <View style={wsb.ringDecor} />
      {children}
    </View>
  );
}
const wsb = StyleSheet.create({
  outer:          { marginVertical: 8, paddingTop: 18, paddingBottom: 22, overflow: 'hidden', shadowColor: '#E8B97A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 4 },
  blobTopRight:   { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: WARM_ACCENT, opacity: 0.15 },
  blobBottomLeft: { position: 'absolute', bottom: -35, left: -35, width: 140, height: 140, borderRadius: 70, backgroundColor: WARM_BEIGE_2, opacity: 0.30 },
  blobMid:        { position: 'absolute', top: 50, left: '40%', width: 90, height: 90, borderRadius: 45, backgroundColor: WARM_ACCENT, opacity: 0.10 },
  ringDecor:      { position: 'absolute', bottom: -60, right: 40, width: 130, height: 130, borderRadius: 65, borderWidth: 18, borderColor: WARM_ACCENT, opacity: 0.12, backgroundColor: 'transparent' },
});

// ────────────────────────────────────────────────────────
// PROMO BANNER  (brand colours — always the same)
// ────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <View style={bnr.wrapper}>
      <View style={bnr.card}>
        <View style={bnr.circleTopRight} />
        <View style={bnr.circleBottomLeft} />
        <View style={bnr.left}>
          <View style={bnr.tagPill}><Text style={bnr.tagText}>🔥 Limited Offer</Text></View>
          <Text style={bnr.headline}>Free Delivery{'\n'}on Orders Over ₦5,000</Text>
          <Text style={bnr.sub}>Use code <Text style={bnr.code}>CHOP25</Text> at checkout</Text>
          <TouchableOpacity style={bnr.cta}>
            <Text style={bnr.ctaText}>Order Now</Text>
            <Ionicons name="arrow-forward" size={13} color={TEAL_DARK} />
          </TouchableOpacity>
        </View>
        <View style={bnr.right}>
          <Text style={bnr.bigEmoji}>🛵</Text>
          <Text style={bnr.smallEmoji}>🍔</Text>
        </View>
      </View>
    </View>
  );
}
const bnr = StyleSheet.create({
  wrapper:          { marginHorizontal: H_PAD, marginTop: 6, marginBottom: 4 },
  card:             { borderRadius: 20, backgroundColor: TEAL_BANNER, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: IS_TABLET ? 24 : 18, overflow: 'hidden', shadowColor: TEAL_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  circleTopRight:   { position: 'absolute', top: -28, right: -28, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)' },
  circleBottomLeft: { position: 'absolute', bottom: -20, left: 80, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.07)' },
  left:       { flex: 1 },
  right:      { alignItems: 'center', marginLeft: 10 },
  tagPill:    { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 7 },
  tagText:    { color: WHITE, fontSize: IS_TABLET ? 12 : 10, fontFamily: 'Quicksand_700Bold', letterSpacing: 0.3 },
  headline:   { color: WHITE, fontSize: IS_TABLET ? 18 : 15, fontFamily: 'Quicksand_700Bold', lineHeight: IS_TABLET ? 26 : 21, marginBottom: 5, letterSpacing: 0.1 },
  sub:        { color: 'rgba(255,255,255,0.75)', fontSize: IS_TABLET ? 13 : 11, fontFamily: 'Quicksand_500Medium', marginBottom: 12 },
  code:       { color: WHITE, fontFamily: 'Quicksand_700Bold', textDecorationLine: 'underline' },
  cta:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WHITE, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  ctaText:    { color: TEAL_DARK, fontSize: IS_TABLET ? 14 : 12, fontFamily: 'Quicksand_700Bold' },
  bigEmoji:   { fontSize: IS_TABLET ? 52 : 42, lineHeight: IS_TABLET ? 62 : 50 },
  smallEmoji: { fontSize: IS_TABLET ? 28 : 22, alignSelf: 'flex-end', marginTop: -8 },
});

// ────────────────────────────────────────────────────────
// VENDOR BRAND CARD — theme-aware
// ────────────────────────────────────────────────────────
function VendorBrandCard({
  vendor,
  onPress,
  surfaceColor,
  textColor,
}: {
  vendor: Vendor;
  onPress: () => void;
  surfaceColor: string;
  textColor: string;
}) {
  const logoSize = BRAND_LOGO_S;
  return (
    <TouchableOpacity style={[vb.card, { width: BRAND_CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[vb.logoRing, { width: logoSize, height: logoSize, borderRadius: logoSize / 2, backgroundColor: surfaceColor }]}>
        {vendor.logo ? (
          <Image source={{ uri: vendor.logo }} style={vb.logo} resizeMode="cover" />
        ) : (
          <View style={[vb.logoPlaceholder, { backgroundColor: TEAL_BG }]}>
            <Ionicons name="storefront-outline" size={IS_TABLET ? 30 : 26} color={TEAL_DARK} />
          </View>
        )}
      </View>
      <View style={vb.ratedBadge}>
        <Ionicons name="star" size={9} color={WHITE} />
        <Text style={vb.ratedText}>Rated</Text>
      </View>
      <Text style={[vb.name, { color: textColor }]} numberOfLines={1}>{vendor.name}</Text>
    </TouchableOpacity>
  );
}
const vb = StyleSheet.create({
  card:            { alignItems: 'center' },
  logoRing:        { borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4, marginBottom: 0 },
  logo:            { width: '100%', height: '100%' },
  logoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  ratedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: ORANGE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 7, marginBottom: 5, shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  ratedText:       { color: WHITE, fontSize: 10, fontFamily: 'Quicksand_700Bold', letterSpacing: 0.2 },
  name:            { fontSize: IS_TABLET ? 12 : 11, fontFamily: 'Quicksand_600SemiBold', textAlign: 'center', maxWidth: BRAND_CARD_W - 4 },
});

// ────────────────────────────────────────────────────────
// DISCOVER CARD — theme-aware
// ────────────────────────────────────────────────────────
function DiscoverCard({
  item,
  onPress,
  onAdd,
  textPrimary,
  textSoft,
}: {
  item: Item;
  onPress: () => void;
  onAdd: () => void;
  textPrimary: string;
  textSoft: string;
}) {
  const rating = item.rating ?? parseFloat((3.8 + Math.random() * 1.1).toFixed(1));
  return (
    <View style={[dc.wrapper, { width: DISCOVER_W }]}>
      <TouchableOpacity style={dc.imgFrame} onPress={onPress} activeOpacity={0.92}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/300x150' }} style={dc.image} resizeMode="cover" />
        <View style={dc.deliveryBadge}>
          <Ionicons name="gift-outline" size={10} color={TEAL_DARK} />
          <Text style={dc.deliveryBadgeText}>Free Delivery On ALL Orders!</Text>
        </View>
        <View style={dc.heart}>
          <Ionicons name="heart-outline" size={15} color={WHITE} />
        </View>
      </TouchableOpacity>
      <View style={dc.infoRow}>
        <TouchableOpacity style={dc.infoLeft} onPress={onPress} activeOpacity={0.7}>
          <Text style={[dc.name, { color: textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <View style={dc.metaRow}>
            <View style={dc.freeBadge}>
              <Ionicons name="pricetag-outline" size={8} color={TEAL_DARK} />
              <Text style={dc.freeText}>Free</Text>
            </View>
            <Text style={[dc.sep, { color: textSoft }]}>  </Text>
            <Text style={[dc.meta, { color: textSoft }]}>34-44 min</Text>
            <Text style={[dc.sep, { color: textSoft }]}>  ·  </Text>
            <Ionicons name="star" size={9} color={STAR_COLOR} />
            <Text style={[dc.meta, { color: textSoft }]}> {rating.toFixed(1)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={dc.addBtn} onPress={onAdd} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add" size={14} color={WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const dc = StyleSheet.create({
  wrapper:           { backgroundColor: 'transparent' },
  imgFrame:          { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  image:             { width: '100%', height: IS_TABLET ? 180 : 140 },
  deliveryBadge:     { position: 'absolute', bottom: 8, left: 14, right: 14, backgroundColor: '#B2DFDB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  deliveryBadgeText: { fontSize: IS_TABLET ? 11 : 10, fontFamily: 'Quicksand_600SemiBold', color: TEAL_DARK },
  heart:             { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.28)', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoRow:           { flexDirection: 'row', alignItems: 'center', paddingTop: 9, paddingBottom: 4, gap: 8 },
  infoLeft:          { flex: 1 },
  name:              { fontSize: IS_TABLET ? 14 : 12, fontFamily: 'Quicksand_700Bold', marginBottom: 4 },
  metaRow:           { flexDirection: 'row', alignItems: 'center' },
  freeBadge:         { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: TEAL_BG, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  freeText:          { fontSize: 9, fontFamily: 'Quicksand_600SemiBold', color: TEAL_DARK },
  sep:               { fontSize: 10 },
  meta:              { fontSize: IS_TABLET ? 11 : 10, fontFamily: 'Quicksand_500Medium' },
  addBtn:            { backgroundColor: ORANGE, width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0, shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },
});

// ────────────────────────────────────────────────────────
// SLIDE CARD — theme-aware
// ────────────────────────────────────────────────────────
function SlideCard({
  item,
  onPress,
  onAdd,
  textPrimary,
  textSoft,
}: {
  item: Item;
  onPress: () => void;
  onAdd: () => void;
  textPrimary: string;
  textSoft: string;
}) {
  const rating = item.rating ?? parseFloat((3.6 + Math.random() * 1.3).toFixed(1));
  return (
    <View style={[sc.wrapper, { width: SLIDE_W }]}>
      <TouchableOpacity style={sc.imgFrame} onPress={onPress} activeOpacity={0.92}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/300x160' }} style={sc.image} resizeMode="cover" />
        {item.vendor?.type && <View style={sc.promoTag}><Text style={sc.promoText}>{item.vendor.type}</Text></View>}
        <View style={sc.heart}><Ionicons name="heart-outline" size={15} color={WHITE} /></View>
      </TouchableOpacity>
      <View style={sc.textBlock}>
        <Text style={[sc.name, { color: textPrimary }]} numberOfLines={1}>{item.name}</Text>
        {item.vendor?.name && <Text style={[sc.vendor, { color: textSoft }]} numberOfLines={1}>{item.vendor.name}</Text>}
        <View style={sc.bottomRow}>
          <View style={sc.metaRow}>
            <View style={sc.freeBadge}>
              <Ionicons name="pricetag-outline" size={8} color={TEAL_DARK} />
              <Text style={sc.freeText}>Free</Text>
            </View>
            <Text style={[sc.sep, { color: textSoft }]}> · </Text>
            <Ionicons name="star" size={9} color={STAR_COLOR} />
            <Text style={[sc.rating, { color: textPrimary }]}> {rating.toFixed(1)}</Text>
          </View>
          <View style={sc.priceAddGroup}>
            <Text style={sc.price}>₦{item.price}</Text>
            <TouchableOpacity style={sc.addBtn} onPress={onAdd} activeOpacity={0.8} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="add" size={15} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  wrapper:       { backgroundColor: 'transparent' },
  imgFrame:      { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 6, elevation: 3 },
  image:         { width: '100%', height: IS_TABLET ? 170 : 130, borderRadius: 14 },
  promoTag:      { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(220,50,0,0.85)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  promoText:     { color: WHITE, fontSize: 9, fontFamily: 'Quicksand_700Bold' },
  heart:         { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.28)', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  textBlock:     { paddingTop: 8, paddingBottom: 4 },
  name:          { fontSize: IS_TABLET ? 14 : 12, fontFamily: 'Quicksand_700Bold', marginBottom: 2 },
  vendor:        { fontSize: IS_TABLET ? 12 : 10, fontFamily: 'Quicksand_500Medium', marginBottom: 6 },
  bottomRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  freeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: TEAL_BG, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  freeText:      { fontSize: 9, fontFamily: 'Quicksand_600SemiBold', color: TEAL_DARK },
  sep:           { fontSize: 10 },
  rating:        { fontSize: IS_TABLET ? 11 : 10, fontFamily: 'Quicksand_600SemiBold' },
  priceAddGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  price:         { fontSize: IS_TABLET ? 14 : 12, fontFamily: 'Quicksand_700Bold', color: TEAL_DARK },
  addBtn:        { backgroundColor: ORANGE, width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 4 },
});

// ────────────────────────────────────────────────────────
// POPULAR CARD — theme-aware
// ────────────────────────────────────────────────────────
function PopularCard({
  item,
  onPress,
  onAdd,
  fullWidth,
  textPrimary,
  textSoft,
}: {
  item: Item;
  onPress: () => void;
  onAdd: () => void;
  fullWidth?: boolean;
  textPrimary: string;
  textSoft: string;
}) {
  const rating = item.rating ?? parseFloat((3.6 + Math.random() * 1.3).toFixed(1));
  return (
    <View style={[pc.wrapper, fullWidth && pc.wrapperFull]}>
      <TouchableOpacity style={pc.imgFrame} onPress={onPress} activeOpacity={0.92}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/400x200' }} style={pc.image} resizeMode="cover" />
        {item.vendor?.type && <View style={pc.promoTag}><Text style={pc.promoText}>{item.vendor.type}</Text></View>}
        <View style={pc.heart}><Ionicons name="heart-outline" size={17} color={WHITE} /></View>
      </TouchableOpacity>
      <View style={pc.textBlock}>
        <View style={pc.nameRow}>
          <Text style={[pc.name, { color: textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <View style={pc.priceAddGroup}>
            <Text style={pc.price}>₦{item.price}</Text>
            <TouchableOpacity style={pc.addBtn} onPress={onAdd} activeOpacity={0.8} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="add" size={18} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>
        {item.vendor?.name && <Text style={[pc.vendor, { color: textSoft }]} numberOfLines={1}>{item.vendor.name}</Text>}
        <View style={pc.metaRow}>
          <View style={pc.freeBadge}>
            <Ionicons name="pricetag-outline" size={9} color={TEAL_DARK} />
            <Text style={pc.freeText}>Free</Text>
          </View>
          <Text style={[pc.sep, { color: textSoft }]}>  ·  </Text>
          <Text style={[pc.meta, { color: textSoft }]}>25-35 min</Text>
          <Text style={[pc.sep, { color: textSoft }]}>  ·  </Text>
          <Ionicons name="star" size={10} color={STAR_COLOR} />
          <Text style={[pc.metaRating, { color: textPrimary }]}> {rating.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}
const POPULAR_TABLET_W = (SCREEN_W - H_PAD * 2 - 16) / 2;
const pc = StyleSheet.create({
  wrapper:       { marginHorizontal: IS_TABLET ? 0 : H_PAD, marginBottom: IS_TABLET ? 0 : 18, backgroundColor: 'transparent', width: IS_TABLET ? POPULAR_TABLET_W : undefined },
  wrapperFull:   { width: SCREEN_W - H_PAD * 2 },
  imgFrame:      { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 7, elevation: 4 },
  image:         { width: '100%', height: IS_TABLET ? 220 : 185, borderRadius: 14 },
  promoTag:      { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(220,50,0,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  promoText:     { color: WHITE, fontSize: 9, fontFamily: 'Quicksand_700Bold' },
  heart:         { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.28)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textBlock:     { paddingTop: 10, paddingBottom: 2 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  name:          { fontSize: IS_TABLET ? 15 : 14, fontFamily: 'Quicksand_700Bold', flex: 1, marginRight: 10 },
  priceAddGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  price:         { fontSize: IS_TABLET ? 15 : 14, fontFamily: 'Quicksand_700Bold', color: TEAL_DARK },
  addBtn:        { backgroundColor: ORANGE, width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },
  vendor:        { fontSize: IS_TABLET ? 13 : 11, fontFamily: 'Quicksand_500Medium', marginBottom: 6 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  freeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: TEAL_BG, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9 },
  freeText:      { fontSize: IS_TABLET ? 11 : 10, fontFamily: 'Quicksand_600SemiBold', color: TEAL_DARK },
  sep:           { fontSize: IS_TABLET ? 12 : 11 },
  meta:          { fontSize: IS_TABLET ? 12 : 11, fontFamily: 'Quicksand_500Medium' },
  metaRating:    { fontSize: IS_TABLET ? 12 : 11, fontFamily: 'Quicksand_600SemiBold' },
});

// ────────────────────────────────────────────────────────
// HAMBURGER ICON — theme-aware
// ────────────────────────────────────────────────────────
function HamburgerIcon({ color }: { color: string }) {
  return (
    <View style={hbg.lines}>
      <View style={[hbg.line, hbg.lineTop, { backgroundColor: color }]} />
      <View style={[hbg.line, hbg.lineMid, { backgroundColor: color }]} />
      <View style={[hbg.line, hbg.lineBot, { backgroundColor: color }]} />
    </View>
  );
}
const hbg = StyleSheet.create({
  lines:   { gap: 4, alignItems: 'flex-end' },
  line:    { height: 2, borderRadius: 2 },
  lineTop: { width: IS_TABLET ? 20 : 18 },
  lineMid: { width: IS_TABLET ? 14 : 12 },
  lineBot: { width: IS_TABLET ? 20 : 18 },
});

// ────────────────────────────────────────────────────────
// NAV MENU DROPDOWN — theme-aware
// ────────────────────────────────────────────────────────
function NavMenu({
  visible,
  onClose,
  onNavigate,
  surfaceColor,
  textPrimary,
  textSoft,
  borderColor,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  surfaceColor: string;
  textPrimary: string;
  textSoft: string;
  borderColor: string;
}) {
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={nm.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[nm.panel, { backgroundColor: surfaceColor, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={nm.panelHeader}>
          <Text style={[nm.panelTitle, { color: textPrimary }]}>Menu</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={[nm.divider, { backgroundColor: borderColor }]} />
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.screen}
            style={[nm.menuItem, { borderBottomColor: borderColor }, idx === menuItems.length - 1 && nm.menuItemLast]}
            onPress={() => onNavigate(item.screen)}
            activeOpacity={0.75}
          >
            <View style={nm.menuIconWrap}>
              <Ionicons name={item.icon} size={18} color={TEAL_DARK} />
            </View>
            <Text style={[nm.menuLabel, { color: textPrimary }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={textSoft} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
}
const nm = StyleSheet.create({
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel:       { position: 'absolute', top: IS_TABLET ? 90 : 76, right: H_PAD, width: IS_TABLET ? 240 : 210, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 12, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  panelTitle:  { fontSize: IS_TABLET ? 15 : 13, fontFamily: 'Quicksand_700Bold', letterSpacing: 0.3 },
  divider:     { height: 1, marginHorizontal: 16, marginBottom: 4 },
  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: IS_TABLET ? 13 : 11, gap: 12, borderBottomWidth: 1 },
  menuItemLast:{ borderBottomWidth: 0, marginBottom: 6 },
  menuIconWrap:{ width: 32, height: 32, borderRadius: 9, backgroundColor: TEAL_BG, justifyContent: 'center', alignItems: 'center' },
  menuLabel:   { flex: 1, fontSize: IS_TABLET ? 14 : 13, fontFamily: 'Quicksand_600SemiBold' },
});

// ────────────────────────────────────────────────────────
// FILTERED RESULTS VIEW — theme-aware
// ────────────────────────────────────────────────────────
function FilteredResults({
  label,
  items,
  loading,
  onPress,
  onAdd,
  textPrimary,
  textSoft,
}: {
  label: string;
  items: Item[];
  loading: boolean;
  onPress: (item: Item) => void;
  onAdd: (item: Item) => void;
  textPrimary: string;
  textSoft: string;
}) {
  const rule = FILTER_RULES[label];
  const title = rule?.sectionTitle ?? label;
  const filter = foodFilters.find(f => f.label === label);
  const emoji  = filter?.emoji ?? '🔍';

  return (
    <View style={fr.container}>
      <View style={[fr.banner, { backgroundColor: filter?.bg ?? TEAL_BG }]}>
        <Text style={fr.bannerEmoji}>{emoji}</Text>
        <View>
          <Text style={[fr.bannerTitle, { color: filter?.textColor ?? TEAL_DARK }]}>{title}</Text>
          <Text style={[fr.bannerSub, { color: filter?.textColor ?? TEAL_DARK }]}>
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} found`}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={TEAL} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={fr.empty}>
          <Text style={fr.emptyEmoji}>😕</Text>
          <Text style={[fr.emptyText, { color: textPrimary }]}>No {title.toLowerCase()} available right now</Text>
          <Text style={[fr.emptySub, { color: textSoft }]}>Check back soon or try another category</Text>
        </View>
      ) : (
        <View style={fr.grid}>
          {items.map(item => (
            <PopularCard
              key={item.id.toString()}
              item={item}
              onPress={() => onPress(item)}
              onAdd={() => onAdd(item)}
              fullWidth={!IS_TABLET}
              textPrimary={textPrimary}
              textSoft={textSoft}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const fr = StyleSheet.create({
  container:   { flex: 1, paddingTop: 8 },
  banner:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: H_PAD, marginBottom: 20, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: IS_TABLET ? 17 : 15, fontFamily: 'Quicksand_700Bold', marginBottom: 2 },
  bannerSub:   { fontSize: IS_TABLET ? 13 : 11, fontFamily: 'Quicksand_500Medium', opacity: 0.8 },
  empty:       { alignItems: 'center', paddingTop: 60, paddingHorizontal: H_PAD },
  emptyEmoji:  { fontSize: 48, marginBottom: 14 },
  emptyText:   { fontSize: IS_TABLET ? 16 : 14, fontFamily: 'Quicksand_700Bold', textAlign: 'center', marginBottom: 6 },
  emptySub:    { fontSize: IS_TABLET ? 13 : 12, fontFamily: 'Quicksand_500Medium', textAlign: 'center' },
  grid:        { paddingHorizontal: IS_TABLET ? H_PAD : 0, flexDirection: IS_TABLET ? 'row' : 'column', flexWrap: IS_TABLET ? 'wrap' : undefined, gap: IS_TABLET ? 16 : 0 },
});

// ────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────
export default function CustomerHome() {
  const navigation = useNavigation<any>();

  // ── THEME ─────────────────────────────────────────────
  const { colors: themeColors, isDark } = useTheme();
  const bgColor      = themeColors.background;
  const surfaceColor = themeColors.surface;
  const textPrimary  = themeColors.textPrimary;
  const textSoft     = themeColors.textSecondary ?? '#8FABA8';
  const borderColor  = themeColors.border        ?? '#EDEDED';

  const [searchQuery, setSearchQuery]               = useState('');
  const [activeFilter, setActiveFilter]             = useState<string | null>(null);
  const [allItems, setAllItems]                     = useState<Item[]>([]);
  const [filteredItems, setFilteredItems]           = useState<Item[]>([]);
  const [featured, setFeatured]                     = useState<Item[]>([]);
  const [favouriteGroceries, setFavouriteGroceries] = useState<Item[]>([]);
  const [quickReliefDrugs, setQuickReliefDrugs]     = useState<Item[]>([]);
  const [popularPicks, setPopularPicks]             = useState<Item[]>([]);
  const [popularVendors, setPopularVendors]         = useState<Vendor[]>([]);
  const [userName, setUserName]                     = useState('User');
  const [cartCount, setCartCount]                   = useState(0);
  const [couponCount, setCouponCount]               = useState(0);
  const [loading, setLoading]                       = useState(true);
  const [filterLoading, setFilterLoading]           = useState(false);
  const [menuVisible, setMenuVisible]               = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadCartCount = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('cart');
      if (!raw) { setCartCount(0); return; }
      const items: any[] = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) { setCartCount(0); return; }
      setCartCount(items.reduce((s: number, it: any) => s + (it.quantity || 1), 0));
    } catch { setCartCount(0); }
  }, []);

  const loadCouponCount = useCallback(async () => {
    try {
      const res = await api.get('/coupons/active');
      const coupon: any[] = res.data.data || res.data.coupons || res.data.coupon || [];
      const active = coupon.filter((c: any) => {
        const notUsed    = !c.is_used && c.used !== true && c.status !== 'used';
        const notExpired = !c.expires_at || new Date(c.expires_at) > new Date();
        return notUsed && notExpired;
      });
      setCouponCount(active.length);
    } catch { setCouponCount(0); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
      loadCouponCount();
    }, [loadCartCount, loadCouponCount])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchUserName();
    fetchHomeData();
    loadCartCount();
    loadCouponCount();
  }, []);

  useEffect(() => {
    if (!activeFilter) {
      setFilteredItems([]);
      return;
    }
    setFilterLoading(true);
    const t = setTimeout(() => {
      const results = allItems.filter(item => itemMatchesFilter(item, activeFilter));
      setFilteredItems(results);
      setFilterLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [activeFilter, allItems]);

  const fetchUserName = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const res = await api.get('/user');
        setUserName(res.data.name?.split(' ')[0] || 'User');
      }
    } catch {}
  };

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/home/items', { params });
      const items: Item[] = res.data.items || [];
      setAllItems(items);
      setFeatured(
        items.filter(i => {
          const t = (i.vendor?.type ?? '').toLowerCase();
          return ['kitchen', 'food', 'restaurant', 'canteen', 'eatery'].some(k => t.includes(k));
        })
      );
      setFavouriteGroceries(
        items.filter(i => {
          const t = (i.vendor?.type ?? '').toLowerCase();
          return ['supermarket', 'grocery', 'store', 'mart'].some(k => t.includes(k));
        })
      );
      setQuickReliefDrugs(
        items.filter(i => {
          const t = (i.vendor?.type ?? '').toLowerCase();
          return ['pharmacy', 'drug', 'chemist', 'health'].some(k => t.includes(k));
        })
      );
      setPopularPicks(items);
      const vendorMap = new Map<number, Vendor>();
      items.forEach(item => {
        const v = item.vendor;
        if (v?.id && !vendorMap.has(v.id))
          vendorMap.set(v.id, { id: v.id, name: v.name, logo: v.logo ?? null, type: v.type ?? '' });
      });
      setPopularVendors(Array.from(vendorMap.values()));
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const addToCart = async (item: Item) => {
    try {
      const raw  = await AsyncStorage.getItem('cart');
      const items: any[] = raw ? JSON.parse(raw) : [];
      const idx  = items.findIndex((c: any) => c.id === item.id);
      if (idx !== -1) { items[idx].quantity = (items[idx].quantity || 1) + 1; }
      else { items.push({ ...item, quantity: 1 }); }
      await AsyncStorage.setItem('cart', JSON.stringify(items));
      setCartCount(items.reduce((s: number, c: any) => s + (c.quantity || 1), 0));
      Alert.alert('Added! 🛒', `${item.name} added to cart`);
    } catch { Alert.alert('Error', 'Could not add item to cart'); }
  };

  const handleFilterPress = (label: string) => {
    if (activeFilter === label) {
      setActiveFilter(null);
      setSearchQuery('');
    } else {
      setActiveFilter(label);
      setSearchQuery('');
    }
  };

  const handleMenuNavigate = (screen: string) => {
    setMenuVisible(false);
    const tabScreens = ['Home', 'Categories', 'Activities'];
    if (tabScreens.includes(screen)) {
      navigation.navigate('CustomerTabs', { screen });
    } else {
      navigation.navigate(screen);
    }
  };

  // ── Icon background colours adapt to dark mode ──────
  const couponBtnBg  = isDark ? 'rgba(255,98,0,0.15)'  : '#FFF0E8';
  const couponBtnBdr = isDark ? 'rgba(255,98,0,0.30)'  : '#FFD4B8';
  const cartBtnBg    = isDark ? 'rgba(0,137,123,0.15)' : TEAL_BG;
  const cartBtnBdr   = isDark ? 'rgba(0,137,123,0.30)' : '#B2DFDB';
  const menuBtnBg    = isDark ? 'rgba(0,137,123,0.15)' : TEAL_BG;
  const menuBtnBdr   = isDark ? 'rgba(0,137,123,0.30)' : '#B2DFDB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: bgColor }]}>
          <View>
            <Text style={[styles.greetingSmall, { color: textSoft }]}>Good day 👋</Text>
            <Text style={[styles.greetingName, { color: textPrimary }]}>Hi, {userName}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Coupon */}
            <TouchableOpacity onPress={() => navigation.navigate('CustomerCoupon')} style={styles.iconWrapper} activeOpacity={0.8}>
              <View style={[styles.iconBtn, { backgroundColor: couponBtnBg, borderColor: couponBtnBdr }]}>
                <Ionicons name="gift-outline" size={IS_TABLET ? 22 : 20} color={ORANGE} />
              </View>
              {couponCount > 0 && (
                <View style={[styles.badge, { backgroundColor: TEAL }]}>
                  <Text style={styles.badgeCount}>{couponCount > 9 ? '9+' : couponCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Cart */}
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.iconWrapper} activeOpacity={0.8}>
              <View style={[styles.iconBtn, { backgroundColor: cartBtnBg, borderColor: cartBtnBdr }]}>
                <Ionicons name="cart-outline" size={IS_TABLET ? 22 : 20} color={TEAL_DARK} />
              </View>
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: ORANGE }]}>
                  <Text style={styles.badgeCount}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Hamburger menu */}
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconWrapper} activeOpacity={0.8}>
              <View style={[styles.iconBtn, { backgroundColor: menuBtnBg, borderColor: menuBtnBdr }]}>
                <HamburgerIcon color={TEAL_DARK} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: surfaceColor, borderColor }]}>
            <Ionicons name="search-outline" size={15} color={textSoft} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search food, groceries, drugs…"
              placeholderTextColor={textSoft}
              value={searchQuery}
              onChangeText={text => { setSearchQuery(text); setActiveFilter(null); }}
              onSubmitEditing={fetchHomeData}
              returnKeyType="search"
            />
            <TouchableOpacity>
              <Ionicons name="camera-outline" size={17} color={TEAL} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ══ FILTER PILLS ══════════════════════════ */}
          <FilterSectionBg isDark={isDark}>
            {IS_TABLET ? (
              <View style={styles.filterTabletRow}>
                {foodFilters.map(item => {
                  const isActive = activeFilter === item.label;
                  return (
                    <TouchableOpacity key={item.label} style={styles.filterPillTablet} onPress={() => handleFilterPress(item.label)} activeOpacity={0.8}>
                      <View style={[
                        styles.filterCircle,
                        { backgroundColor: isActive ? item.circleColor : item.bg },
                        isActive && { shadowColor: item.circleColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 6 },
                      ]}>
                        <Text style={styles.filterEmoji}>{item.emoji}</Text>
                      </View>
                      <Text style={[styles.filterLabel, { color: isActive ? item.textColor : textPrimary }, isActive && { fontFamily: 'Quicksand_700Bold' }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <FlatList
                data={foodFilters}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPhoneRow}
                renderItem={({ item }) => {
                  const isActive = activeFilter === item.label;
                  return (
                    <TouchableOpacity style={styles.filterPillPhone} onPress={() => handleFilterPress(item.label)} activeOpacity={0.8}>
                      <View style={[
                        styles.filterCircle,
                        { backgroundColor: isActive ? item.circleColor : item.bg },
                        isActive && { shadowColor: item.circleColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 6 },
                      ]}>
                        <Text style={styles.filterEmoji}>{item.emoji}</Text>
                      </View>
                      <Text style={[styles.filterLabel, { color: isActive ? item.textColor : textPrimary }, isActive && { fontFamily: 'Quicksand_700Bold' }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={item => item.label}
              />
            )}
          </FilterSectionBg>

          {/* ══ FILTERED RESULTS or NORMAL HOME CONTENT ══ */}
          {activeFilter ? (
            <FilteredResults
              label={activeFilter}
              items={filteredItems}
              loading={filterLoading}
              onPress={item => navigation.navigate('ItemDetail', { item })}
              onAdd={item => addToCart(item)}
              textPrimary={textPrimary}
              textSoft={textSoft}
            />
          ) : (
            <>
              {/* Discover Best Food */}
              <View style={styles.section}>
                <SectionHeader title="Discover Best Food" textColor={textPrimary} />
                {loading ? <ActivityIndicator size="small" color={TEAL} style={styles.loader} /> :
                 featured.length === 0 ? <Text style={[styles.emptyText, { color: textSoft }]}>No food items available</Text> : (
                  <FlatList data={featured} horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
                    renderItem={({ item }) => (
                      <DiscoverCard
                        item={item}
                        onPress={() => navigation.navigate('ItemDetail', { item })}
                        onAdd={() => addToCart(item)}
                        textPrimary={textPrimary}
                        textSoft={textSoft}
                      />
                    )}
                    keyExtractor={item => item.id.toString()} />
                )}
              </View>

              {/* Warm section */}
              <WarmSectionBg isDark={isDark}>
                <View style={[styles.section, { marginBottom: 18 }]}>
                  <SectionHeader title="Pick a Category" textColor={textPrimary} />
                  {IS_TABLET ? (
                    <View style={styles.categoryTabletRow}>
                      {categoryPills.map(item => (
                        <TouchableOpacity key={item.label} style={[styles.categoryCardTablet, { width: CAT_CARD_W }]}
                          onPress={() => navigation.navigate('VendorsByCategory', { category: item.label.toLowerCase() })}>
                          <View style={[styles.categoryIconBox, { backgroundColor: item.bg, width: CAT_CARD_W, height: CAT_ICON_H }]}>
                            <Ionicons name={item.icon} size={36} color={item.color} />
                          </View>
                          <View style={[styles.categoryBadge, { backgroundColor: item.bg, width: CAT_CARD_W }]}>
                            <Text style={[styles.categoryBadgeText, { color: item.color }]} numberOfLines={1}>{item.label}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <FlatList data={categoryPills} horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryPhoneRow}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.categoryCardPhone}
                          onPress={() => navigation.navigate('VendorsByCategory', { category: item.label.toLowerCase() })}>
                          <View style={[styles.categoryIconBox, { backgroundColor: item.bg, width: 92, height: CAT_ICON_H }]}>
                            <Ionicons name={item.icon} size={30} color={item.color} />
                          </View>
                          <View style={[styles.categoryBadge, { backgroundColor: item.bg, width: 92 }]}>
                            <Text style={[styles.categoryBadgeText, { color: item.color }]} numberOfLines={1}>{item.label}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      keyExtractor={item => item.label} />
                  )}
                </View>

                <View style={[styles.section, { marginBottom: 18 }]}>
                  <SectionHeader title="Favourite Groceries" textColor={textPrimary} />
                  {loading ? <ActivityIndicator size="small" color={TEAL} style={styles.loader} /> :
                   favouriteGroceries.length === 0 ? <Text style={[styles.emptyText, { color: textSoft }]}>No groceries available</Text> : (
                    <FlatList data={favouriteGroceries} horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
                      renderItem={({ item }) => (
                        <SlideCard
                          item={item}
                          onPress={() => navigation.navigate('ItemDetail', { item })}
                          onAdd={() => addToCart(item)}
                          textPrimary={textPrimary}
                          textSoft={textSoft}
                        />
                      )}
                      keyExtractor={item => item.id.toString()} />
                  )}
                </View>

                <PromoBanner />
              </WarmSectionBg>

              {/* Quick Relief Drugs */}
              <View style={styles.section}>
                <SectionHeader title="Quick Relief Drugs" textColor={textPrimary} />
                {loading ? <ActivityIndicator size="small" color={TEAL} style={styles.loader} /> :
                 quickReliefDrugs.length === 0 ? <Text style={[styles.emptyText, { color: textSoft }]}>No drugs available</Text> : (
                  <FlatList data={quickReliefDrugs} horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
                    renderItem={({ item }) => (
                      <SlideCard
                        item={item}
                        onPress={() => navigation.navigate('ItemDetail', { item })}
                        onAdd={() => addToCart(item)}
                        textPrimary={textPrimary}
                        textSoft={textSoft}
                      />
                    )}
                    keyExtractor={item => item.id.toString()} />
                )}
              </View>

              {/* Popular Brands */}
              {popularVendors.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Popular Brands" textColor={textPrimary} />
                  {IS_TABLET ? (
                    <View style={styles.brandTabletGrid}>
                      {popularVendors.map(vendor => (
                        <VendorBrandCard
                          key={vendor.id.toString()}
                          vendor={vendor}
                          onPress={() => navigation.navigate('VendorItems', { vendorId: vendor.id, vendorName: vendor.name })}
                          surfaceColor={surfaceColor}
                          textColor={textPrimary}
                        />
                      ))}
                    </View>
                  ) : (
                    <FlatList data={popularVendors} horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 18 }}
                      renderItem={({ item: vendor }) => (
                        <VendorBrandCard
                          vendor={vendor}
                          onPress={() => navigation.navigate('VendorItems', { vendorId: vendor.id, vendorName: vendor.name })}
                          surfaceColor={surfaceColor}
                          textColor={textPrimary}
                        />
                      )}
                      keyExtractor={v => v.id.toString()} />
                  )}
                </View>
              )}

              {/* Popular Picks */}
              <View style={[styles.section, { marginBottom: 10 }]}>
                <SectionHeader title="Popular Picks 🔥" textColor={textPrimary} />
                {loading ? <ActivityIndicator size="small" color={TEAL} style={styles.loader} /> :
                 popularPicks.length === 0 ? <Text style={[styles.emptyText, { color: textSoft }]}>No items available</Text> :
                 IS_TABLET ? (
                   <View style={styles.popularTabletGrid}>
                     {popularPicks.map(item => (
                       <PopularCard
                         key={item.id.toString()}
                         item={item}
                         onPress={() => navigation.navigate('ItemDetail', { item })}
                         onAdd={() => addToCart(item)}
                         textPrimary={textPrimary}
                         textSoft={textSoft}
                       />
                     ))}
                   </View>
                 ) : (
                   popularPicks.map(item => (
                     <PopularCard
                       key={item.id.toString()}
                       item={item}
                       onPress={() => navigation.navigate('ItemDetail', { item })}
                       onAdd={() => addToCart(item)}
                       fullWidth
                       textPrimary={textPrimary}
                       textSoft={textSoft}
                     />
                   ))
                 )
                }
              </View>
            </>
          )}

        </ScrollView>
      </Animated.View>

      <NavMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
        surfaceColor={surfaceColor}
        textPrimary={textPrimary}
        textSoft={textSoft}
        borderColor={borderColor}
      />
    </SafeAreaView>
  );
}

// ── Global Styles ─────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: H_PAD, paddingTop: IS_TABLET ? 18 : 14, paddingBottom: IS_TABLET ? 14 : 10 },
  greetingSmall: { fontSize: IS_TABLET ? 13 : 11, fontFamily: 'Quicksand_500Medium', letterSpacing: 0.3, marginBottom: 1 },
  greetingName:  { fontSize: IS_TABLET ? 20 : 17, fontFamily: 'Quicksand_700Bold', letterSpacing: 0.1 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrapper:   { position: 'relative' },

  // Unified icon button (replaces couponIconBg / cartIconBg / menuIconBg)
  iconBtn:       { width: IS_TABLET ? 44 : 38, height: IS_TABLET ? 44 : 38, borderRadius: IS_TABLET ? 14 : 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  badge:         { position: 'absolute', top: -4, right: -4, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: WHITE },
  badgeCount:    { color: WHITE, fontSize: 9, fontFamily: 'Quicksand_700Bold' },

  searchWrapper: { paddingHorizontal: H_PAD, marginBottom: IS_TABLET ? 18 : 14 },
  searchBar:     { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: IS_TABLET ? 12 : 9, gap: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput:   { flex: 1, fontFamily: 'Quicksand_500Medium', fontSize: IS_TABLET ? 15 : 13, paddingVertical: 0 },

  filterTabletRow:  { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: H_PAD, paddingBottom: 4 },
  filterPillTablet: { alignItems: 'center', gap: 6, flex: 1, maxWidth: 110 },
  filterPhoneRow:   { paddingHorizontal: H_PAD, gap: 16, paddingBottom: 4 },
  filterPillPhone:  { alignItems: 'center', gap: 6, minWidth: 64 },
  filterCircle:     { width: FILTER_CIRCLE, height: FILTER_CIRCLE, borderRadius: FILTER_CIRCLE / 2, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  filterEmoji:      { fontSize: FILTER_EMOJI, lineHeight: FILTER_EMOJI + 6 },
  filterLabel:      { fontSize: FILTER_FONT, fontFamily: 'Quicksand_600SemiBold', textAlign: 'center' },

  categoryTabletRow:  { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', paddingHorizontal: H_PAD, gap: 12 },
  categoryCardTablet: { alignItems: 'center' },
  categoryPhoneRow:   { paddingHorizontal: H_PAD, gap: 14, paddingBottom: 4 },
  categoryCardPhone:  { alignItems: 'center', width: 92 },
  categoryIconBox:    { borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  categoryBadge:      { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center' },
  categoryBadgeText:  { fontSize: IS_TABLET ? 13 : 11, fontFamily: 'Quicksand_700Bold' },

  brandTabletGrid:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', paddingHorizontal: H_PAD, rowGap: 22, columnGap: 10 },
  popularTabletGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: H_PAD, gap: 16 },

  section:   { marginBottom: 22, marginTop: 4 },
  loader:    { marginVertical: 30 },
  emptyText: { textAlign: 'center', fontSize: IS_TABLET ? 14 : 12, fontFamily: 'Quicksand_500Medium', marginVertical: 20, marginHorizontal: H_PAD },
});