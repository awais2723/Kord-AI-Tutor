import React, { useState, useEffect } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Image,
  Alert,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// --- Icons ---
const SelectIcon = () => (
  <View className="w-6 h-6 rounded-full border-2 border-white bg-blue-500" />
);
const UnselectIcon = () => (
  <View className="w-6 h-6 rounded-full border-2 border-white bg-transparent/50" />
);

export default function ScanToPdfScreen() {
  const router = useRouter();

  // --- State ---
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false); // For scanning
  const [generatingPdf, setGeneratingPdf] = useState(false); // For PDF creation

  // Modal State for Renaming
  const [isNameModalVisible, setNameModalVisible] = useState(false);
  const [pdfName, setPdfName] = useState('Scanned_Document');

  // Initial Scan
  useEffect(() => {
    startScan();
  }, []);

  // --- 1. Scanning Logic ---
  const startScan = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan.');
        return;
      }
    }

    try {
      setLoading(true);
      // Increased quality slightly to ensure good PDF output
      const { scannedImages: newScans } = await DocumentScanner.scanDocument({
        maxNumDocuments: 50,
        responseType: 'imageFilePath',
      });

      if (newScans && newScans.length > 0) {
        setScannedImages(prev => [...prev, ...newScans]);
        setSelectedImages(prev => [...prev, ...newScans]);
      }
    } catch (error) {
      console.error('Scanning error:', error);
      Alert.alert('Error', 'Failed to scan document.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Selection Logic ---
  const toggleSelection = (uri: string) => {
    if (selectedImages.includes(uri)) {
      setSelectedImages(selectedImages.filter(i => i !== uri));
    } else {
      setSelectedImages([...selectedImages, uri]);
    }
  };

  // --- 3. Prepare PDF (Open Modal) ---
  const handleSharePress = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Selection', 'Please select at least one image to share.');
      return;
    }
    setNameModalVisible(true);
  };

  // --- 4. Generate & Share PDF (FIXED SIZING) ---
  const generateAndSharePDF = async () => {
    setNameModalVisible(false);

    try {
      setGeneratingPdf(true);

      // STEP A: Convert to Base64 (Kept from previous fix)
      const base64Promises = selectedImages.map(async uri => {
        try {
          // Using FileSystem.readAsStringAsync is reliable for cross-platform HTML injection
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          // Determine MIME type roughly based on extension, default to jpeg
          const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          return `data:${mimeType};base64,${base64}`;
        } catch (e) {
          console.error('Error converting image', e);
          return null;
        }
      });

      const base64Images = (await Promise.all(base64Promises)).filter(Boolean);

      // STEP B: Create HTML with CSS for exact fitting
      // We wrap each image in a container that is exactly 1 viewport height (100vh)
      // We use CSS flexbox to center the image inside that container.
      const imagesHtml = base64Images
        .map(
          (src, index) => `
        <div class="page-container ${index === base64Images.length - 1 ? 'last-page' : ''}">
          <img src="${src}" class="fitted-image" />
        </div>
      `
        )
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
            /* 1. Reset default browser margins */
            @page {
              margin: 0mm; 
            }
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              background-color: #ffffff;
            }

            /* 2. The container for exactly one PDF page */
            .page-container {
              width: 100vw;  /* 100% viewport width */
              height: 100vh; /* 100% viewport height - Critical for stopping spillover */
              display: flex;
              justify-content: center; /* Center horizontally */
              align-items: center;     /* Center vertically */
              page-break-after: always; /* Force new page after this container */
              overflow: hidden; /* Ensure absolutely nothing spills out */
              box-sizing: border-box;
            }

            /* 3. Don't force a blank page after the very last image */
            .last-page {
              page-break-after: auto;
            }

            /* 4. The image styling */
            .fitted-image {
              /* Ensure the image never exceeds its container dimensions */
              max-width: 100%;
              max-height: 100%;
              /* 'contain' ensures the whole image is visible without distortion or cropping */
              object-fit: contain; 
              display: block;
              /* Optional: adds a subtle shadow to make the image pop off the white paper */
              box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
            }
          </style>
        </head>
        <body>
          ${imagesHtml}
        </body>
        </html>
      `;

      // STEP C: Generate PDF
      // We don't pass width/height here, letting the CSS @page margin:0 handle it.
      const { uri: tempUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // STEP D: Rename File
      const cleanName = pdfName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Doc';
      const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
      // Use cacheDirectory for temporary files before sharing, it's cleaner
      const newPath = `${FileSystem.cacheDirectory}${finalName}`;

      await FileSystem.moveAsync({
        from: tempUri,
        to: newPath,
      });

      // STEP E: Share
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        setGeneratingPdf(false);
        return;
      }

      await Sharing.shareAsync(newPath, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share ${finalName}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not generate or share PDF.');
      console.error(error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // --- Render Item (Grid) ---
  const renderItem = ({ item }: { item: string }) => {
    const isSelected = selectedImages.includes(item);
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item)}
        className={`flex-1 m-1 aspect-[3/4] rounded-lg overflow-hidden border-2 relative ${
          isSelected ? 'border-blue-500' : 'border-transparent'
        }`}>
        <Image source={{ uri: item }} className="w-full h-full bg-gray-200" resizeMode="cover" />

        <View className="absolute top-2 right-2">
          {isSelected ? <SelectIcon /> : <UnselectIcon />}
        </View>
      </TouchableOpacity>
    );
  };

  // --- Render Empty State ---
  if (!loading && scannedImages.length === 0) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center p-4">
        <Text className="text-gray-500 text-lg mb-4">No documents scanned yet.</Text>
        <TouchableOpacity onPress={startScan} className="bg-indigo-600 px-6 py-3 rounded-full">
          <Text className="text-white font-bold">Start Scanning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="p-4 bg-white shadow-sm flex-row justify-between items-center z-10">
        <Text className="text-xl font-bold text-gray-800">Selected ({selectedImages.length})</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-gray-500 font-medium text-base">Close</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Images */}
      <FlatList
        data={scannedImages}
        renderItem={renderItem}
        keyExtractor={item => item}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
      />

      {/* Bottom Action Bar */}
      <View className="p-4 bg-white border-t border-gray-200 flex-row gap-3">
        {/* Add Button */}
        <TouchableOpacity
          onPress={startScan}
          disabled={generatingPdf}
          className="flex-1 bg-gray-200 py-4 rounded-xl items-center justify-center">
          <Text className="text-gray-800 font-bold text-base">Add Page</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleSharePress}
          disabled={generatingPdf || selectedImages.length === 0}
          className={`flex-1 py-4 rounded-xl items-center justify-center flex-row gap-2 ${
            selectedImages.length > 0 ? 'bg-indigo-600' : 'bg-gray-400'
          }`}>
          {generatingPdf ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Share PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Rename PDF Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNameModalVisible}
        onRequestClose={() => setNameModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl">
            <Text className="text-xl font-bold text-gray-800 mb-2">Name your PDF</Text>
            <Text className="text-sm text-gray-500 mb-5">
              Enter a name for the file before sharing.
            </Text>

            <TextInput
              value={pdfName}
              onChangeText={setPdfName}
              placeholder="Enter file name"
              className="border border-gray-300 rounded-lg p-3 mb-6 text-lg bg-gray-50"
              autoFocus
              selectTextOnFocus
            />

            <View className="flex-row justify-end gap-4">
              <TouchableOpacity onPress={() => setNameModalVisible(false)} className="py-2 px-2">
                <Text className="text-gray-500 font-semibold text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={generateAndSharePDF}
                className="bg-indigo-600 py-2 px-6 rounded-lg">
                <Text className="text-white font-bold text-lg">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
