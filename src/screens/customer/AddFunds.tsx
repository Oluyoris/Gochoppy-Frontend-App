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
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUICK_AMOUNTS = ['1,000', '5,000', '10,000', '50,000'];

const AddFunds = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings || {});
    } catch (error) {
      console.log('Settings fetch error:', error);
      setSettings({
        manual_bank_name: 'First Bank of Nigeria',
        manual_account_number: '1234567890',
        manual_account_name: 'GoChoppy Limited',
      });
    }
  };

  const pickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const submitDeposit = async () => {
    if (!amount || parseFloat(amount.replace(/,/g, '')) < 100) {
      Alert.alert('Invalid Amount', 'Minimum deposit is ₦100');
      return;
    }
    if (!proofImage) {
      Alert.alert('Proof Required', 'Please upload payment proof for bank transfer.');
      return;
    }

    setSubmitting(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(proofImage, { encoding: 'base64' as any });

      const payload = {
        amount: parseFloat(amount.replace(/,/g, '')),
        payment_method: 'bank_transfer',
        proof: `data:image/jpeg;base64,${base64}`,
      };

      const response = await api.post('/customer/wallet/fund', payload);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Deposit request submitted successfully.\nAwaiting admin approval.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit deposit');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit deposit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Funds</Text>
          <Text style={styles.headerSub}>Bank Transfer</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Step Indicator */}
        <View style={styles.stepsRow}>
          {['Amount', 'Transfer', 'Confirm'].map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                i === 0 && styles.stepDotDone,
                i === 1 && styles.stepDotActive,
                i === 2 && styles.stepDotPending,
              ]}>
                {i === 0
                  ? <Ionicons name="checkmark" size={14} color="#0D6E63" />
                  : <Text style={[styles.stepNum, i === 1 && styles.stepNumActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, i <= 1 && styles.stepLabelActive]}>{label}</Text>
              {i < 2 && (
                <View style={[styles.stepLine, i === 0 && styles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        {/* Amount Input */}
        <Text style={styles.sectionLabel}>Amount to deposit</Text>
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>₦</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#D1D5DB"
            />
          </View>
          <Text style={styles.amountMeta}>
            Min ₦100 · Max ₦500,000 ·{' '}
            <Text style={styles.amountMetaGreen}>No fees</Text>
          </Text>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.qaChip, amount === q.replace(/,/g, '') && styles.qaChipActive]}
              onPress={() => setAmount(q.replace(/,/g, ''))}
            >
              <Text style={[styles.qaText, amount === q.replace(/,/g, '') && styles.qaTextActive]}>
                ₦{q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bank Details */}
        <Text style={styles.sectionLabel}>Transfer to this account</Text>
        <View style={styles.bankCard}>
          <View style={styles.bankCardHeader}>
            <View>
              <Text style={styles.bankCardName}>{settings.manual_account_name || 'GoChoppy Limited'}</Text>
              <Text style={styles.bankCardSub}>Receiving account</Text>
            </View>
            <View style={styles.bankLogo}>
              <Text style={styles.bankLogoText}>
                {(settings.manual_bank_name || 'FBN').split(' ').map((w: string) => w[0]).join('').slice(0, 3)}
              </Text>
            </View>
          </View>

          <View style={styles.bankRow}>
            <Text style={styles.bankKey}>Bank name</Text>
            <Text style={styles.bankVal}>{settings.manual_bank_name || '---'}</Text>
          </View>

          <View style={styles.bankRow}>
            <Text style={styles.bankKey}>Account number</Text>
            <View style={styles.bankRowRight}>
              <Text style={[styles.bankVal, styles.acctNumber]}>
                {settings.manual_account_number || '---'}
              </Text>
              <TouchableOpacity style={styles.copyBtn}>
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.bankRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.bankKey}>Account name</Text>
            <Text style={styles.bankVal}>{settings.manual_account_name || '---'}</Text>
          </View>
        </View>

        {/* Upload Proof */}
        <Text style={styles.sectionLabel}>Payment proof</Text>
        <TouchableOpacity style={styles.uploadZone} onPress={pickProofImage}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={24} color="#0D6E63" />
          </View>
          <Text style={styles.uploadTitle}>
            {proofImage ? 'Change proof image' : 'Upload receipt or screenshot'}
          </Text>
          <Text style={styles.uploadSub}>JPG, PNG · Max 5MB</Text>
        </TouchableOpacity>

        {proofImage && (
          <Image source={{ uri: proofImage }} style={styles.proofImage} />
        )}

        {/* Notice */}
        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="information" size={12} color="#fff" />
          </View>
          <Text style={styles.noticeText}>
            Transfer the exact amount shown. Admin will verify and credit your wallet within 5 - 10 minutes.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitDeposit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Deposit Request</Text>
              <View style={styles.submitArrow}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F5F6FA',
    borderWidth: 0.5,
    borderColor: '#E0E0EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', letterSpacing: -0.2 },
  headerSub: { fontSize: 11, color: '#8B8BA7', marginTop: 1 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  /* Steps */
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 5 },
  stepDot: {
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: { backgroundColor: '#E1F5EE' },
  stepDotActive: { backgroundColor: '#0D6E63' },
  stepDotPending: { backgroundColor: '#F5F6FA', borderWidth: 1.5, borderColor: '#E0E0EC' },
  stepNum: { fontSize: 12, fontWeight: '500', color: '#8B8BA7' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#8B8BA7', textAlign: 'center' },
  stepLabelActive: { color: '#0D6E63', fontWeight: '500' },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 1.5,
    backgroundColor: '#E0E0EC',
  },
  stepLineDone: { backgroundColor: '#0D6E63' },

  /* Section label */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8BA7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  /* Amount */
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0EC',
    padding: 16,
    marginBottom: 12,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencyBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: '#A3E4C3',
  },
  currencyText: { fontSize: 16, fontWeight: '600', color: '#0D6E63' },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    paddingVertical: 0,
  },
  amountMeta: { fontSize: 12, color: '#8B8BA7', marginTop: 8 },
  amountMetaGreen: { color: '#0D6E63', fontWeight: '500' },

  /* Quick amounts */
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  qaChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E0E0EC',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  qaChipActive: { backgroundColor: '#F0FDF4', borderColor: '#0D6E63' },
  qaText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  qaTextActive: { color: '#0D6E63' },

  /* Bank card */
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0EC',
    overflow: 'hidden',
    marginBottom: 24,
  },
  bankCardHeader: {
    backgroundColor: '#0D6E63',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankCardName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  bankCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  bankLogo: {
    width: 34, height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F8',
  },
  bankRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bankKey: { fontSize: 12, color: '#8B8BA7' },
  bankVal: { fontSize: 13, fontWeight: '500', color: '#1A1A2E' },
  acctNumber: { fontSize: 15, fontWeight: '600', letterSpacing: 1.5, color: '#0D6E63' },
  copyBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#A3E4C3',
  },
  copyText: { fontSize: 11, fontWeight: '500', color: '#0D6E63' },

  /* Upload */
  uploadZone: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#A3E4C3',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadIconWrap: {
    width: 44, height: 44,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 3 },
  uploadSub: { fontSize: 12, color: '#8B8BA7' },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0EC',
  },

  /* Notice */
  notice: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  noticeIcon: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  /* Submit */
  submitBtn: {
    backgroundColor: '#FF6200',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  submitArrow: {
    width: 24, height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddFunds;