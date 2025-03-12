/* This code snippet is a React component called `ScanQuestionScreen` that utilizes the `useState` and
`useEffect` hooks from React. It also imports necessary components and modules such as `Platform`,
`PermissionsAndroid`, `Image`, `Alert`, `View`, and `DocumentScanner` for handling document scanning
functionality. */
import { Component } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Image,
  Alert,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Text,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import axios from 'axios';
import mime from 'mime';

import { SERVER_END_POINT } from '@/constants';
import styles from '@/src/styles';

type Props = object;

type State = {
  scannedImage: string;
  loading: boolean;
  text: string;
};

class ScanQuestionScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scannedImage: '',
      loading: true,
      text: '',
    };
  }

  componentDidMount() {
    this.scanDocument();
  }

  removeExtraSpaces(str: string) {
    str = str.trim();
    str = str.replace(/\s+/g, ' ');
    return str;
  }

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
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 300000, // Set timeout to 5 minutes
          });
          // eslint-disable-next-line no-console
          console.log('Response:', response.data);
          this.setState({ text: this.removeExtraSpaces(response.data.text) });
          this.setState({ loading: false });
          this.setState({ scannedImage: '' });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error sending POST request:', error);
          this.setState({ loading: false });
          this.setState({ scannedImage: '' });
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

    const { scannedImages } = await DocumentScanner.scanDocument({
      maxNumDocuments: 1,
    });

    if (scannedImages && scannedImages.length > 0) {
      this.setState({ scannedImage: scannedImages[0], loading: true });
      await this.sendImage(scannedImages[0]);
    }
  };

  render() {
    const { scannedImage, loading, text } = this.state;

    if (scannedImage || loading) {
      return (
        <View className="bg-gray-100 flex flex-col flex-1 justify-center items-center">
          {scannedImage && (
            <Image resizeMode="contain" source={{ uri: scannedImage }} className="w-1/2 -mt-12" />
          )}
          {loading && <ActivityIndicator color="#6844EE" size="large" />}
        </View>
      );
    }

    if (text) {
      return (
        <View className="bg-gray-100 flex flex-col flex-1 justify-start items-center">
          <TextInput
            className="h-[600px] w-full text-black bg-white p-3"
            style={{ textAlignVertical: 'top' }}
            value={text}
            onChangeText={e => this.setState({ text: e })}
            multiline
          />
          <TouchableOpacity
            style={styles.shadow}
            className="border-2 w-4/5 mt-8 bg-primary border-gray-300 rounded-md py-2 flex flex-row justify-center items-center"
            onPress={() => {}}>
            <Text className="text-center text-white font-bold text-xl ml-2">Next</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <View className="bg-gray-100 flex flex-col flex-1 justify-start items-center" />;
  }
}

export default ScanQuestionScreen;
