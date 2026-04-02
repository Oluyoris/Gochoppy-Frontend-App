import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

interface OnboardingPage {
  backgroundColor: string;
  illustration: any;
  title: string;
  subtitle: string;
  isLast?: boolean;
}

const pages: OnboardingPage[] = [
  {
    backgroundColor: '#FF6200', // deep orange
    illustration: require('../../../assets/onlogo1.png'), // your welcome/logo image
    title: 'Welcome to GoChoppy',
    subtitle: 'Fast. Fresh. Delivered to your door.',
  },
  {
    backgroundColor: '#00897B', // teal green
    illustration: require('../../../assets/delivery.png'), // rocket / fast icon
    title: 'Lightning Fast Delivery',
    subtitle: 'Receive your orders in minutes, not hours.',
  },
  {
    backgroundColor: '#FFFFFF',
    illustration: require('../../../assets/food.png'), // food / restaurant illustration
    title: 'Restaurants & Food',
    subtitle: 'Choose from thousands of top-rated local kitchens.',
  },
  {
    backgroundColor: '#FFFFFF',
    illustration: require('../../../assets/gro.png'), // grocery cart / supermarket
    title: 'Groceries & Essentials',
    subtitle: 'Shop everyday items — delivered straight to you.',
  },
  {
    backgroundColor: '#FFFFFF',
    illustration: require('../../../assets/drug.png'), // medicine / pharmacy cross
    title: 'Pharmacy & Health',
    subtitle: 'Medicines and wellness products at your fingertips.',
    isLast: true,
  },
];

export default function Onboarding() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (err) {}
    navigation.replace('Login');
  };

  const renderItem = ({ item, index }: { item: OnboardingPage; index: number }) => {
    const isLast = item.isLast;

    return (
      <View style={[styles.page, { backgroundColor: item.backgroundColor }]}>
        {/* Illustration */}
        <Image
          source={item.illustration}
          style={styles.illustration}
          resizeMode="contain"
        />

        {/* Text */}
        <Text style={[styles.title, item.backgroundColor === '#FFFFFF' && { color: '#000' }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, item.backgroundColor === '#FFFFFF' && { color: '#555' }]}>
          {item.subtitle}
        </Text>

        {/* Progress dots */}
        <View style={styles.dots}>
          {pages.map((_, dotIndex) => {
            const opacity = scrollX.interpolate({
              inputRange: [(dotIndex - 1) * width, dotIndex * width, (dotIndex + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={dotIndex}
                style={[styles.dot, { opacity }, dotIndex === currentIndex && styles.activeDot]}
              />
            );
          })}
        </View>

        {/* Button area */}
        <View style={styles.buttonContainer}>
          {!isLast ? (
            <>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Skip button */}
      {currentIndex < pages.length - 1 && (
        <TouchableOpacity style={styles.skip} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  illustration: {
    width: width * 0.65,
    height: height * 0.40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    opacity: 0.4,
  },
  activeDot: { opacity: 1, transform: [{ scale: 1.3 }] },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 30,
  },
  nextText: {
    color: '#FF6200',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#FF6200',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 16,
    width: '80%',
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6200',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  loginText: {
    color: '#FF6200',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skip: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});