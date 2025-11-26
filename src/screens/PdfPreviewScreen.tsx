import { Component } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DocumentScanner from 'react-native-document-scanner-plugin';

// Lazy load expo-print and expo-sharing to avoid errors if not available
let Print: any = null;
let Sharing: any = null;
let FileSystem: any = null;

// Check if modules are available
let modulesAvailable = false;

try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
  FileSystem = require('expo-file-system');
  modulesAvailable = true;
} catch (error) {
  // Modules not available in Expo Go - silent fail
  modulesAvailable = false;
}

type Props = {
  images: string;
};

type State = {
  scannedImages: string[];
  generating: boolean;
};

class PdfPreviewScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const images = JSON.parse(props.images || '[]');
    this.state = {
      scannedImages: images,
      generating: false,
    };
  }

  addMoreImages = async () => {
    if (
      Platform.OS === 'android' &&
      (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)) !==
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      Alert.alert('Error', 'Camera permission is required for scanning.');
      return;
    }

    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        const newImage = scannedImages[0];
        this.setState(prevState => ({
          scannedImages: [...prevState.scannedImages, newImage],
        }));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Scanning error:', error);
      Alert.alert('Error', 'Failed to scan document');
    }
  };

  removeImage = (index: number) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          this.setState(prevState => ({
            scannedImages: prevState.scannedImages.filter((_, i) => i !== index),
          }));
        },
      },
    ]);
  };

  shareImages = async () => {
    const { scannedImages } = this.state;

    if (scannedImages.length === 0) {
      Alert.alert('Error', 'No images to share');
      return;
    }

    try {
      // Share first image (React Native Share API has limitations)
      if (scannedImages.length === 1) {
        await Share.share({
          message: 'Scanned document image',
          url: scannedImages[0],
        });
      } else {
        // For multiple images, show info
        Alert.alert(
          'Share Images',
          `You have ${scannedImages.length} images. To share all images, please build the app with PDF support.\n\nFor now, you can share individual images by tapping on them.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share images');
    }
  };

  generatePDF = async () => {
    const { scannedImages } = this.state;

    if (scannedImages.length === 0) {
      Alert.alert('Error', 'No images to convert to PDF');
      return;
    }

    // Check if modules are available
    if (!Print || !Sharing || !FileSystem) {
      Alert.alert(
        'Feature Not Available in Expo Go',
        'PDF generation is not available in Expo Go.\n\nTo use this feature, you need to:\n\n1. Build a development build:\n   npx expo run:android\n\n2. Or use EAS Build:\n   npx eas build --profile development\n\nAlternatively, you can share individual images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Images', onPress: this.shareImages },
        ]
      );
      return;
    }

    this.setState({ generating: true });

    try {
      // Convert images to base64
      const imagePromises = scannedImages.map(async uri => {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/png;base64,${base64}`;
      });

      const base64Images = await Promise.all(imagePromises);

      // Create HTML with images
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                margin: 0;
                padding: 0;
              }
              .page {
                page-break-after: always;
                padding: 0;
                margin: 0;
              }
              img {
                width: 100%;
                height: auto;
                display: block;
              }
            </style>
          </head>
          <body>
            ${base64Images.map(img => `<div class="page"><img src="${img}" /></div>`).join('')}
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });

      this.setState({ generating: false });

      // Share or save PDF
      Alert.alert('PDF Created Successfully', 'What would you like to do?', [
        {
          text: 'Share',
          onPress: async () => {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri);
            } else {
              Alert.alert('Error', 'Sharing is not available on this device');
            }
          },
        },
        {
          text: 'Save',
          onPress: async () => {
            const fileName = `scan_${Date.now()}.pdf`;
            const destUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.copyAsync({
              from: uri,
              to: destUri,
            });
            Alert.alert('Success', `PDF saved as ${fileName}`, [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PDF generation error:', error);
      this.setState({ generating: false });
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  render() {
    const { scannedImages, generating } = this.state;

    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-primary pt-12 pb-4 px-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Scanned Documents</Text>
            <TouchableOpacity
              onPress={this.generatePDF}
              disabled={generating || scannedImages.length === 0}
              className="p-2">
              <MaterialIcons name="picture-as-pdf" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-center mt-2">
            {scannedImages.length} {scannedImages.length === 1 ? 'page' : 'pages'}
          </Text>
          {!modulesAvailable && (
            <View className="bg-yellow-500 mt-2 p-2 rounded">
              <Text className="text-center text-xs text-gray-800">
                Running in Expo Go - PDF generation limited. Build app for full features.
              </Text>
            </View>
          )}
        </View>

        {/* Images Grid */}
        <ScrollView className="flex-1 p-4">
          {scannedImages.map((uri, index) => (
            <View key={index} className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <View className="flex-row justify-between items-center bg-gray-200 px-4 py-2">
                <Text className="text-gray-700 font-semibold">Page {index + 1}</Text>
                <TouchableOpacity onPress={() => this.removeImage(index)}>
                  <MaterialIcons name="delete" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri }} className="w-full h-80" resizeMode="contain" />
            </View>
          ))}

          {scannedImages.length === 0 && (
            <View className="flex-1 justify-center items-center py-20">
              <MaterialIcons name="insert-drive-file" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg mt-4">No pages scanned</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View className="border-t border-gray-200 p-4">
          <TouchableOpacity
            onPress={this.addMoreImages}
            disabled={generating}
            className="bg-primary rounded-lg py-4 mb-3 flex-row justify-center items-center">
            <MaterialIcons name="add-a-photo" size={24} color="white" />
            <Text className="text-white text-lg font-bold ml-2">Add More Pages</Text>
          </TouchableOpacity>

          {generating ? (
            <View className="bg-green-600 rounded-lg py-4 flex-row justify-center items-center">
              <ActivityIndicator color="white" />
              <Text className="text-white text-lg font-bold ml-2">Generating PDF...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={this.generatePDF}
                disabled={scannedImages.length === 0}
                className={`${scannedImages.length === 0 ? 'bg-gray-400' : 'bg-green-600'} rounded-lg py-4 flex-row justify-center items-center mb-3`}>
                <MaterialIcons name="picture-as-pdf" size={24} color="white" />
                <Text className="text-white text-lg font-bold ml-2">
                  {modulesAvailable ? 'Generate PDF' : 'Try Generate PDF (Expo Go)'}
                </Text>
              </TouchableOpacity>

              {!modulesAvailable && scannedImages.length > 0 && (
                <TouchableOpacity
                  onPress={this.shareImages}
                  className="bg-blue-600 rounded-lg py-4 flex-row justify-center items-center">
                  <MaterialIcons name="share" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">Share Images</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  }
}

// Wrapper component to use hooks
export default function PdfPreviewScreenWrapper() {
  const params = useLocalSearchParams();
  return <PdfPreviewScreen images={params.images as string} />;
}
