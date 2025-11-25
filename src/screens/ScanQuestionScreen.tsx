import { Component } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Image,
  Alert,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import axios from 'axios';
import mime from 'mime';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import TextContext from '@/context/TextContext';
import { SERVER_END_POINT } from '@/constants';

type Props = object;
type State = {
  scannedImage: string;
  loading: boolean;
  statusText: string;
};

class ScanQuestionScreen extends Component<Props, State> {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      scannedImage: '',
      loading: false, // Start false, wait for scan
      statusText: '',
    };
  }

  componentDidMount() {
    // Small delay to ensure screen transition finishes before opening camera
    setTimeout(() => {
      this.scanDocument();
    }, 500);
  }

  removeExtraSpaces = (str: string) => str.trim().replace(/\s+/g, ' ');

  sendImage = async (uri: string) => {
    this.setState({ loading: true, statusText: 'Extracting text from image...' });

    try {
      const res = await fetch(uri);
      const blob = await res.blob();

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result && typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          const payload = {
            uri: `data:${mime.getType(uri)};base64,${base64data}`,
            type: mime.getType(uri) || 'image/png',
            name: uri.split('/').pop() || 'image.png',
          };

          try {
            console.log('Sending to:', `${SERVER_END_POINT}/text`);
            const response = await axios.post(`${SERVER_END_POINT}/text`, payload, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 60000, // 60 seconds
            });

            const cleanedText = this.removeExtraSpaces(response.data.text);
            this.context.setText(cleanedText);

            // Navigate to Edit Screen
            router.push('/(routes)/results/editScannedText');
          } catch (error) {
            console.error('Server Upload Error:', error);
            Alert.alert('Upload Failed', 'Could not extract text. Please try again.');
            this.setState({ loading: false, scannedImage: '' });
          }
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('File Prep Error:', error);
      Alert.alert('Error', 'Failed to process the image file.');
      this.setState({ loading: false });
    }
  };

  scanDocument = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan.');
        router.back();
        return;
      }
    }

    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        const imageUri = scannedImages[0];
        this.setState({ scannedImage: imageUri });
        // Auto start upload
        this.sendImage(imageUri);
      } else {
        // User cancelled camera
        this.setState({ loading: false });
        router.back();
      }
    } catch (error) {
      console.error('Scanner Error:', error);
      router.back();
    }
  };

  handleRetry = () => {
    this.scanDocument();
  };

  render() {
    const { scannedImage, loading, statusText } = this.state;

    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        {/* Main Content Card */}
        <View className="w-[85%] bg-white rounded-2xl p-6 shadow-lg shadow-violet-100 items-center border border-slate-100">
          {loading ? (
            <>
              {/* Image Preview while loading */}
              {scannedImage ? (
                <View className="w-full h-64 rounded-xl overflow-hidden mb-6 bg-slate-100 border border-slate-200 relative">
                  <Image
                    source={{ uri: scannedImage }}
                    className="w-full h-full opacity-60"
                    resizeMode="contain"
                  />
                  {/* Overlay Spinner */}
                  <View className="absolute inset-0 justify-center items-center bg-black/10">
                    <ActivityIndicator color="#6844EE" size="large" />
                  </View>
                </View>
              ) : (
                <ActivityIndicator color="#6844EE" size="large" className="mb-4" />
              )}

              <Text className="text-lg font-bold text-slate-700 text-center">Processing...</Text>
              <Text className="text-sm text-slate-500 text-center mt-2">{statusText}</Text>
            </>
          ) : (
            /* Fallback State (Usually redirected before seeing this) */
            <View className="items-center py-6">
              <Feather name="camera" size={48} color="#94a3b8" />
              <Text className="text-slate-500 mt-4 text-center">Ready to scan</Text>
              <TouchableOpacity
                onPress={this.handleRetry}
                className="mt-6 bg-violet-600 px-6 py-3 rounded-full">
                <Text className="text-white font-bold">Start Scan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer/Cancel Button */}
        {loading && (
          <TouchableOpacity onPress={() => router.back()} className="mt-8">
            <Text className="text-slate-400 font-medium">Cancel Operation</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }
}

export default ScanQuestionScreen;
