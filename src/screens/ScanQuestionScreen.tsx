import { Component } from 'react';
import { Platform, PermissionsAndroid, Image, Alert, View, ActivityIndicator } from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import axios from 'axios';
import mime from 'mime';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextContext from '@/context/TextContext';

import { SERVER_END_POINT } from '@/constants';

type Props = {};
type State = {
  scannedImage: string;
  loading: boolean;
};

class ScanQuestionScreen extends Component<Props, State> {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      scannedImage: '',
      loading: true,
    };
  }

  componentDidMount() {
    console.log('ScanQuestionScreen mounted ' + SERVER_END_POINT);
    axios
      .get(`${SERVER_END_POINT}/`)
      .then(res => console.log('Server test success:', res.data))
      .catch(err => console.log('Server test failed:', err.message));
    this.scanDocument();
  }

  removeExtraSpaces = (str: string) => {
    return str.trim().replace(/\s+/g, ' ');
  };

  sendImage = async (uri: string) => {
    this.setState({ loading: true });
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
          const response = await axios.post(`${SERVER_END_POINT}/text`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 600000,
          });

          const cleanedText = this.removeExtraSpaces(response.data.text);
          this.setState({ loading: false, scannedImage: '' });
          this.context.setText(cleanedText);

          router.push('/editScannedText');
        } catch (error) {
          console.error('Error sending POST request:', error);
          this.setState({ loading: false, scannedImage: '' });
        }
      }
    };
    reader.readAsDataURL(blob);
  };

  scanDocument = async () => {
    if (
      Platform.OS === 'android' &&
      (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)) !==
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      Alert.alert('Error', 'User must grant camera permissions for scanning.');
      return;
    }

    const { scannedImages } = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
    if (scannedImages && scannedImages.length > 0) {
      this.setState({ scannedImage: scannedImages[0], loading: true });
      await this.sendImage(scannedImages[0]);
    }
  };

  render() {
    const { scannedImage, loading } = this.state;

    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <SafeAreaView className="flex flex-1 justify-center items-center">
          {scannedImage !== '' && (
            <Image source={{ uri: scannedImage }} resizeMode="contain" className="w-1/2 -mt-12" />
          )}
          {loading && <ActivityIndicator color="#6844EE" size="large" />}
        </SafeAreaView>
      </View>
    );
  }
}

export default ScanQuestionScreen;
