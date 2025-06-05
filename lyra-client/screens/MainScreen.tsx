/* eslint-disable react-native/no-inline-styles */

import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

import styles from '../styles/main.styles';
import COLORS from '../constant/colors';

const featureNames = [
  'phone_score',
  'sleep_score',
  'leisure_score',
  'social_score',
  'me_score',
];

const categories = ['Normal', 'Mild', 'Moderate', 'Severe'];

const MainScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    featureNames.reduce((acc, f) => {
      acc[f] = '';
      return acc;
    }, {} as Record<string, string>),
  );

  // For press animation on Predict button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Load ONNX model
  useEffect(() => {
    async function loadOnnxModel() {
      try {
        // Ensure model.onnx is in android/app/src/main/assets/ and Xcode bundle
        const base64String = await RNFS.readFileAssets('model.onnx', 'base64');
        const raw = Buffer.from(base64String, 'base64');
        const sess = await InferenceSession.create(raw);
        setSession(sess);
        setLoadingModel(false);
      } catch (err: any) {
        console.error('ONNX load error:', err.message);
        Alert.alert(
          'Model Load Error',
          'Unable to load ONNX model. Ensure model.onnx is bundled correctly.',
        );
      }
    }
    loadOnnxModel();
  }, []);

  // Handle Predict
  const handlePredict = async () => {
    if (!session) {
      Alert.alert('Model not ready', 'Please wait for the model to load.');
      return;
    }
    try {
      const values: number[] = featureNames.map(fname => {
        const txt = inputs[fname].trim();
        if (txt === '') {
          throw new Error(`${fname.replace('_', ' ')} is required`);
        }
        const num = parseFloat(txt);
        if (isNaN(num)) {
          throw new Error(`Invalid number for ${fname.replace('_', ' ')}`);
        }
        return num;
      });

      const tensorData = new Float32Array(values);
      const inputTensor = new Tensor('float32', tensorData, [
        1,
        featureNames.length,
      ]);
      const outputMap = await session.run({input: inputTensor});
      const outputTensor = outputMap.output as Tensor;
      const scores = outputTensor.data as Float32Array;

      let maxIdx = 0;
      let maxVal = scores[0];
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > maxVal) {
          maxIdx = i;
          maxVal = scores[i];
        }
      }
      const predicted = categories[maxIdx] || `Class ${maxIdx}`;
      Alert.alert('Prediction', `Your Mental Health Status: ${predicted}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Inference failed');
    }
  };

  // Animate Predict button press
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 4,
      tension: 150,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 150,
    }).start();
  };

  // Logout: remove token and navigate to Login
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.replace('Login');
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Unable to log out. Please try again.');
    }
  };

  if (loadingModel) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{marginTop: 12, color: COLORS.textSecondary}}>
          Loading model…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mental Health Predictor</Text>
        <Text style={styles.headerSubtitle}>Enter your scores below</Text>
        {/* Logout button in top‐right */}
        <TouchableOpacity
          style={headerStyles.logoutButton}
          onPress={handleLogout}>
          <Text style={headerStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled">
          {featureNames.map(fname => (
            <View key={fname} style={styles.card}>
              <Text style={styles.label}>{fname.replace('_', ' ')}</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={inputs[fname]}
                placeholder="e.g. 0.5"
                placeholderTextColor={COLORS.placeholderText}
                onChangeText={text =>
                  setInputs(prev => ({...prev, [fname]: text}))
                }
              />
            </View>
          ))}

          <Animated.View
            style={{transform: [{scale: scaleAnim}], alignItems: 'center'}}>
            <TouchableOpacity
              style={styles.predictButton}
              activeOpacity={0.8}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={handlePredict}>
              <Text style={styles.predictButtonText}>Predict</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Animated = require('react-native').Animated;

const headerStyles = StyleSheet.create({
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MainScreen;
