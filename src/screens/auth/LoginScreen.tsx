import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const { width, height } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE       = '#FF6200';
const ORANGE_LIGHT = '#FF8533';
const TEAL         = '#00897B';
const WHITE        = '#FFFFFF';
const BG           = '#FFFFFF';
const INPUT_BG     = '#F5F5F5';
const BORDER       = '#E8E8E8';
const TEXT_DARK    = '#111111';
const TEXT_MID     = '#555555';
const TEXT_LIGHT   = '#AAAAAA';

type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  MainTabs: undefined;
};

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', user.role);
      navigation.replace('MainTabs');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        errorMessage = error.response.data.message || 'Invalid credentials';
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.';
      } else {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="none"
        >
          <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

            {/* ── Logo ── */}
            <View style={styles.logoWrap}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../assets/onlogo1.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* ── Headline ── */}
            <Text style={styles.headline}>
              Sign in, we'll get{'\n'}your order going...
            </Text>

            {/* ── Register link ── */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Registration')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>

            {/* ── Email ── */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={TEXT_LIGHT}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
                <Ionicons name="at" size={18} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            {/* ── Password ── */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={TEXT_LIGHT}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="none"
                  autoComplete="off"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  activeOpacity={0.7}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'lock-closed-outline'}
                    size={18}
                    color={TEXT_LIGHT}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Forgot Password ── */}
            <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* ── Sign In Button ── */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Text style={styles.signInBtnText}>
                {loading ? 'SIGNING IN…' : 'SIGN IN'}
              </Text>
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or connect with...</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Social Buttons ── */}
            <View style={styles.socialRow}>
              {/* Google */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Apple / iCloud */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <Ionicons name="logo-apple" size={18} color={TEXT_DARK} />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: height * 0.06,
    paddingBottom: 40,
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 32,
    height: 32,
    tintColor: WHITE,
  },

  // ── Headline ──
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: TEXT_DARK,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 14,
  },

  // ── Register row ──
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  registerText: {
    fontSize: 14,
    color: TEXT_MID,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: ORANGE,
  },

  // ── Fields ──
  fieldWrap: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    paddingVertical: 0,
  },
  inputIcon: {
    marginLeft: 8,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },

  // ── Forgot ──
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    color: TEXT_MID,
    fontWeight: '600',
  },

  // ── Sign In Button ──
  signInBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  signInBtnDisabled: {
    backgroundColor: ORANGE_LIGHT,
    shadowOpacity: 0.1,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: WHITE,
    letterSpacing: 1.2,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },

  // ── Social ──
  socialRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '900',
    color: ORANGE,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
});