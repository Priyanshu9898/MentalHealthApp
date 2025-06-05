/* eslint-disable react-native/no-inline-styles */
// // App.tsx
// import React, {useEffect, useRef, useState} from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   Animated,
//   StyleSheet,
//   Alert,
//   Platform,
//   ScrollView,
//   StatusBar,
// } from 'react-native';
// import {InferenceSession, Tensor} from 'onnxruntime-react-native';
// import RNFS from 'react-native-fs';
// import {Buffer} from 'buffer';

// const featureNames = [
//   'phone_score',
//   'sleep_score',
//   'leisure_score',
//   'social_score',
//   'me_score',
// ];

// const categories = ['Normal', 'Mild', 'Moderate', 'Severe'];

// export default function App() {
//   const [session, setSession] = useState<InferenceSession | null>(null);
//   const [loadingModel, setLoadingModel] = useState(true);
//   const [inputs, setInputs] = useState<Record<string, string>>(() =>
//     featureNames.reduce((acc, f) => {
//       acc[f] = '';
//       return acc;
//     }, {} as Record<string, string>),
//   );

//   // Animated value for the Predict button scale
//   const scaleAnim = useRef(new Animated.Value(1)).current;

//   // Load ONNX model once on mount
//   useEffect(() => {
//     async function loadOnnxModel() {
//       try {
//         // On Android, read directly from assets via readFileAssets()
//         // Make sure "model.onnx" is under android/app/src/main/assets/model.onnx
//         const base64String = await RNFS.readFileAssets('model.onnx', 'base64');
//         console.log(
//           '✅ RNFS.readFileAssets succeeded, base64 length:',
//           base64String.length,
//         );

//         // Convert Base64 → Uint8Array
//         const raw = Buffer.from(base64String, 'base64');
//         console.log('✅ Converted to Uint8Array, byteLength:', raw.byteLength);

//         // Create ONNX session
//         const sess = await InferenceSession.create(raw);
//         setSession(sess);
//         setLoadingModel(false);
//         console.log('🚀 ONNX session created successfully');
//       } catch (err: any) {
//         console.error('❌ Failed to load ONNX from assets:', err);
//         Alert.alert(
//           'Model Load Error',
//           'Could not load model.onnx. Ensure it is placed under android/app/src/main/assets/',
//         );
//       }
//     }

//     loadOnnxModel();
//   }, []);

//   const handlePredict = async () => {
//     if (!session) {
//       Alert.alert('Model not yet loaded');
//       return;
//     }

//     try {
//       // 1. Gather inputs & convert to floats
//       const featureValues: number[] = featureNames.map(fname => {
//         const txt = inputs[fname].trim();
//         if (txt === '') {
//           throw new Error(
//             `Please enter a value for ${fname.replace('_', ' ')}`,
//           );
//         }
//         const parsed = parseFloat(txt);
//         if (isNaN(parsed)) {
//           throw new Error(`Invalid number for ${fname.replace('_', ' ')}`);
//         }
//         return parsed;
//       });

//       // 2. Build ONNX input tensor [1, 5]
//       const tensorData = new Float32Array(featureValues);
//       const inputTensor = new Tensor('float32', tensorData, [
//         1,
//         featureNames.length,
//       ]);
//       const feeds: Record<string, Tensor> = {input: inputTensor};

//       // 3. Run inference
//       const outputMap = await session.run(feeds);
//       const outputTensor = outputMap.output as Tensor;
//       const scores = outputTensor.data as Float32Array;

//       // 4. Argmax
//       let maxIdx = 0;
//       let maxVal = scores[0];
//       for (let i = 1; i < scores.length; i++) {
//         if (scores[i] > maxVal) {
//           maxIdx = i;
//           maxVal = scores[i];
//         }
//       }
//       const predictedLabel = categories[maxIdx] || `Class ${maxIdx}`;

//       // 5. Show result
//       Alert.alert('Prediction', `Mental Health Status: ${predictedLabel}`);
//     } catch (err: any) {
//       Alert.alert('Error', err.message || 'Inference failed');
//       console.error(err);
//     }
//   };

//   // Animate button press-in (scale to 0.95)
//   const onPressIn = () => {
//     Animated.spring(scaleAnim, {
//       toValue: 0.95,
//       useNativeDriver: true,
//       friction: 4,
//       tension: 150,
//     }).start();
//   };

//   // Animate button release (scale back to 1)
//   const onPressOut = () => {
//     Animated.spring(scaleAnim, {
//       toValue: 1,
//       useNativeDriver: true,
//       friction: 4,
//       tension: 150,
//     }).start();
//   };

//   if (loadingModel) {
//     return (
//       <SafeAreaView style={styles.center}>
//         <Text style={styles.loadingText}>Loading ONNX model…</Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Status bar */}
//       <StatusBar
//         barStyle="dark-content"
//         backgroundColor={styles.container.backgroundColor}
//       />

//       {/* Header with accent stripe */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Mental Health Predictor</Text>
//         <Text style={styles.headerSubtitle}>
//           Enter your scores and tap Predict
//         </Text>
//       </View>

//       <ScrollView contentContainerStyle={styles.form}>
//         {/* Input cards */}
//         {featureNames.map(fname => (
//           <View key={fname} style={styles.card}>
//             <Text style={styles.label}>{fname.replace('_', ' ')}:</Text>
//             <TextInput
//               style={styles.textInput}
//               keyboardType="numeric"
//               value={inputs[fname]}
//               placeholder="e.g. 0.5"
//               placeholderTextColor="#777"
//               onChangeText={text =>
//                 setInputs(prev => ({...prev, [fname]: text}))
//               }
//             />
//           </View>
//         ))}

//         {/* Animated Predict button */}
//         <Animated.View style={{transform: [{scale: scaleAnim}]}}>
//           <Pressable
//             style={({pressed}) => [
//               styles.predictButton,
//               pressed && styles.predictButtonPressed,
//             ]}
//             android_ripple={{
//               color: '#FFFFFF50', // white ripple with 50% opacity
//               radius: 120,
//             }}
//             onPressIn={onPressIn}
//             onPressOut={onPressOut}
//             onPress={handlePredict}>
//             <Text style={styles.predictButtonText}>Predict</Text>
//           </Pressable>
//         </Animated.View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const ACCENT_COLOR = '#4A90E2'; // primary blue accent
// const ACCENT_DARK = '#4178C0'; // darker shade for pressed state

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F7FA', // very light grey background
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 18,
//     color: '#555',
//   },

//   // Header area
//   header: {
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     paddingVertical: 24,
//     paddingHorizontal: 20,
//   },
//   headerTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 6,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#666',
//   },

//   // Form container
//   form: {
//     paddingHorizontal: 20,
//     paddingBottom: 40,
//   },

//   // “Card” container for each input
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 18,
//     marginBottom: 16,

//     // iOS shadow
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.08,
//     shadowRadius: 6,

//     // Android elevation
//     elevation: 3,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//   },
//   textInput: {
//     backgroundColor: '#F0F3F7',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: Platform.OS === 'ios' ? 14 : 10,
//     fontSize: 16,
//     color: '#222',
//   },

//   // Predict button styles
//   predictButton: {
//     backgroundColor: ACCENT_COLOR,
//     borderRadius: 8,
//     paddingVertical: 16,
//     marginHorizontal: 4,
//     marginTop: 8,

//     // iOS shadow
//     shadowColor: ACCENT_COLOR,
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 6,

//     // Android elevation
//     elevation: 4,
//   },
//   predictButtonPressed: {
//     backgroundColor: ACCENT_DARK,
//   },
//   predictButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });

// App.tsx
import React from 'react';

import {View, StatusBar} from 'react-native';
import COLORS from './constant/colors';
import AuthNavigator from './Navigation/AuthNavigator';

export default function App() {
  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <AuthNavigator />
    </View>
  );
}
