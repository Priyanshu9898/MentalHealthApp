/* eslint-disable react-native/no-inline-styles */
// screens/MainScreen.tsx
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
} from 'react-native';
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

export default function MainScreen() {
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    featureNames.reduce((acc, f) => {
      acc[f] = '';
      return acc;
    }, {} as Record<string, string>),
  );

  // For press animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function loadOnnxModel() {
      try {
        const base64String = await RNFS.readFileAssets('model.onnx', 'base64');
        const raw = Buffer.from(base64String, 'base64');
        const sess = await InferenceSession.create(raw);
        setSession(sess);
        setLoadingModel(false);
      } catch (err: any) {
        console.error('ONNX load error:', err);
        Alert.alert('Model Error', 'Failed to load model.onnx from assets.');
      }
    }
    loadOnnxModel();
  }, []);

  const handlePredict = async () => {
    if (!session) {
      Alert.alert('Model not loaded yet');
      return;
    }
    try {
      // Collect & parse feature inputs
      const vals: number[] = featureNames.map(fname => {
        const txt = inputs[fname].trim();
        if (txt === '') {
          throw new Error(`${fname.replace('_', ' ')} is required`);
        }
        const parsed = parseFloat(txt);
        if (isNaN(parsed)) {
          throw new Error(`Invalid number for ${fname.replace('_', ' ')}`);
        }
        return parsed;
      });

      // Create input tensor shape [1, 5]
      const data = new Float32Array(vals);
      const inputTensor = new Tensor('float32', data, [1, featureNames.length]);
      const outputMap = await session.run({input: inputTensor});
      const outputTensor = outputMap.output as Tensor;
      const scores = outputTensor.data as Float32Array;

      // Argmax
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
      {/* Status bar tint match background */}
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mental Health Predictor</Text>
        <Text style={styles.headerSubtitle}>Enter your scores below</Text>
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
                onChangeText={txt =>
                  setInputs(prev => ({...prev, [fname]: txt}))
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
}

const Animated = require('react-native').Animated;
