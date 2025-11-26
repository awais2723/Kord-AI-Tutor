import { Component } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Image,
  Alert,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { router } from 'expo-router';

type Props = object;

type State = {
  scannedImages: string[];
  currentImage: string;
  loading: boolean;
  processing: boolean;
};

class ScanToPdfScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scannedImages: [],
      currentImage: '',
      loading: true,
      processing: false,
    };
  }

  componentDidMount() {
    this.scanDocument();
  }

  scanDocument = async () => {
    if (
      Platform.OS === 'android' &&
      (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)) !==
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      Alert.alert('Error', 'Camera permission is required for scanning.');
      router.back();
      return;
    }

    const { scannedImages: existingImages } = this.state;

    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        const newImage = scannedImages[0];
        const allImages = [...existingImages, newImage];
        this.setState({
          scannedImages: allImages,
          currentImage: newImage,
          loading: false,
        });

        // Navigate to preview screen with collected images
        const imagesParam = encodeURIComponent(JSON.stringify(allImages));
        router.push(`/pdfPreview?images=${imagesParam}` as never);
      } else {
        // User cancelled scanning
        if (existingImages.length > 0) {
          // If we have images, go to preview
          const imagesParam = encodeURIComponent(JSON.stringify(existingImages));
          router.push(`/pdfPreview?images=${imagesParam}` as never);
        } else {
          // No images, go back
          this.setState({ loading: false });
          router.back();
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Scanning error:', error);
      Alert.alert('Error', 'Failed to scan document');
      this.setState({ loading: false });
      router.back();
    }
  };

  render() {
    const { currentImage, loading } = this.state;

    if (loading || currentImage) {
      return (
        <View className="bg-gray-100 flex flex-col flex-1 justify-center items-center">
          {currentImage && (
            <Image resizeMode="contain" source={{ uri: currentImage }} className="w-4/5 h-96" />
          )}
          {loading && (
            <>
              <ActivityIndicator color="#6844EE" size="large" className="mt-4" />
              <Text className="text-gray-600 mt-4 text-lg">Scanning document...</Text>
            </>
          )}
        </View>
      );
    }

    return <View className="bg-gray-100 flex flex-col flex-1 justify-start items-center" />;
  }
}

export default ScanToPdfScreen;
