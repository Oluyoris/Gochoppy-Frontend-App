import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';

// ─── Design Tokens ────────────────────────────────────────────────
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const C = {
  bg:          '#EAF6F4',
  surface:     '#FFFFFF',
  tealDeep:    '#0D6E63',
  tealMid:     '#17A898',
  tealLight:   '#C8EDEA',
  tealGlow:    '#E2F7F5',
  ink:         '#0A2724',
  inkMid:      '#2D5550',
  inkLight:    '#7AA8A3',
  amber:       '#E8821A',
  amberLight:  '#FEF0E0',
  green:       '#1A9060',
  greenLight:  '#E2F5EC',
  red:         '#D93030',
  redLight:    '#FDECEC',
  border:      '#C8EDEA',
  borderLight: '#E5F5F3',
  inputBorder: '#C8EDEA',
  placeholder: '#9DBFBB',
  white:       '#FFFFFF',
};

export default function MenuRequests() {
  const navigation = useNavigation();

  // ─── ALL STATE UNTOUCHED ──────────────────────────────────────
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [category, setCategory]     = useState('');
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── ALL LOGIC UNTOUCHED ──────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchMenuRequests();
    }, [])
  );

  const fetchMenuRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu-requests');
      setRequests(res.data.requests || []);
    } catch (error) {
      console.log('Menu requests error:', error);
      Alert.alert('Error', 'Failed to load menu requests');
    } finally {
      setLoading(false);
    }
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submitMenuRequest = async () => {
    if (!name.trim() || !price.trim() || isNaN(Number(price))) {
      Alert.alert('Error', 'Please fill name and valid price');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('price', price.trim());
    formData.append('category', category.trim());

    if (imageUri) {
      const filename = imageUri.split('/').pop();
      const fileType = filename?.split('.').pop();
      formData.append('image', {
        uri: imageUri,
        name: filename || 'menu.jpg',
        type: `image/${fileType || 'jpeg'}`,
      } as any);
    }

    try {
      await api.post('/menu-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Menu request submitted! Awaiting admin approval.');
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageUri(null);
      fetchMenuRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── STATUS META ─────────────────────────────────────────────
  const getStatusMeta = (status: string) => {
    if (status === 'approved') return { label: 'Approved', color: C.green,  bg: C.greenLight, icon: 'checkmark-circle-outline' as const };
    if (status === 'rejected') return { label: 'Rejected', color: C.red,    bg: C.redLight,   icon: 'close-circle-outline' as const };
    return                            { label: 'Pending',  color: C.amber,  bg: C.amberLight, icon: 'time-outline' as const };
  };

  // ─── RENDER REQUEST CARD ──────────────────────────────────────
  const renderRequest = ({ item }: { item: any }) => {
    const meta = getStatusMeta(item.status || 'pending');

    return (
      <View style={styles.requestCard}>
        {/* Left stripe */}
        <View style={[styles.cardStripe, { backgroundColor: meta.color }]} />

        <View style={styles.cardInner}>
          {/* Header row */}
          <View style={styles.cardTopRow}>
            <Text style={styles.requestName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={11} color={meta.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Image */}
          {item.image && (
            <Image
              source={{ uri: item.image_url || `http://your-backend-domain/storage/${item.image}` }}
              style={styles.requestImage}
              resizeMode="cover"
            />
          )}

          {/* Price + category row */}
          <View style={styles.priceRow}>
            <Text style={styles.requestPrice}>₦{Number(item.price).toLocaleString()}</Text>
            {item.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>

          {item.description && (
            <Text style={styles.requestDesc} numberOfLines={2}>{item.description}</Text>
          )}

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={C.inkLight} />
            <Text style={styles.requestDate}>
              {new Date(item.created_at).toLocaleDateString('en-NG')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>VENDOR</Text>
        <Text style={styles.headerTitle}>Menu Requests</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── FORM CARD ────────────────────────────────────────── */}
        <View style={styles.formCard}>
          {/* Form header */}
          <View style={styles.formHeader}>
            <View style={styles.formIconWrap}>
              <Ionicons name="add-circle-outline" size={16} color={C.tealDeep} />
            </View>
            <Text style={styles.formTitle}>Submit New Item</Text>
          </View>

          {/* Item Name */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Item Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jollof Rice"
              placeholderTextColor={C.placeholder}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of the item…"
              placeholderTextColor={C.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price + Category row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Price (₦) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={C.placeholder}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Category <Text style={styles.optional}>(opt.)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rice"
                placeholderTextColor={C.placeholder}
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>

          {/* Image picker */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Food Photo <Text style={styles.optional}>(optional)</Text></Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.changeImageOverlay}>
                    <Ionicons name="camera-outline" size={18} color={C.white} />
                    <Text style={styles.changeImageText}>Change</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imageIconCircle}>
                    <Ionicons name="image-outline" size={22} color={C.tealMid} />
                  </View>
                  <Text style={styles.imageText}>Tap to upload photo</Text>
                  <Text style={styles.imageSubText}>JPG or PNG recommended</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submitMenuRequest}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color={C.white} style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── REQUESTS LIST ────────────────────────────────────── */}
        <View style={styles.listHeader}>
          <Text style={styles.listSectionLabel}>YOUR REQUESTS</Text>
          <TouchableOpacity onPress={fetchMenuRequests}>
            <Ionicons name="refresh-outline" size={16} color={C.tealMid} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.tealMid} />
            <Text style={styles.loadingText}>Loading requests…</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Ionicons name="restaurant-outline" size={32} color={C.tealMid} />
            </View>
            <Text style={styles.emptyText}>No requests yet</Text>
            <Text style={styles.emptySub}>Submit your first menu item above!</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    backgroundColor: C.tealDeep,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 10,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: C.tealLight,
    letterSpacing: 2.5,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Form card
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.tealDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  formIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ink,
  },

  // Inputs
  inputWrap: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.inkMid,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  required: {
    color: C.red,
  },
  optional: {
    color: C.inkLight,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.ink,
    backgroundColor: C.tealGlow,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 0,
  },

  // Image picker
  imagePicker: {
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 10,
    height: 130,
    overflow: 'hidden',
    backgroundColor: C.tealGlow,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkMid,
  },
  imageSubText: {
    fontSize: 10,
    color: C.inkLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13,110,99,0.6)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 5,
  },
  changeImageText: {
    fontSize: 12,
    color: C.white,
    fontWeight: '700',
  },

  // Submit button
  submitButton: {
    backgroundColor: C.tealDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: C.tealDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: C.inkLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // List section
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.inkLight,
    letterSpacing: 2,
  },

  list: { paddingBottom: 10 },

  // Request card
  requestCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.tealDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardStripe: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ink,
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  requestImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: C.tealDeep,
    letterSpacing: -0.3,
  },
  categoryChip: {
    backgroundColor: C.tealGlow,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.tealDeep,
  },
  requestDesc: {
    fontSize: 12,
    color: C.inkLight,
    lineHeight: 17,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  requestDate: {
    fontSize: 10,
    color: C.inkLight,
    fontWeight: '500',
  },

  // Loading / empty
  center: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: C.inkLight,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.ink,
  },
  emptySub: {
    fontSize: 12,
    color: C.inkLight,
    textAlign: 'center',
  },
});