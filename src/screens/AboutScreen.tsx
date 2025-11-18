import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

const AboutScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.card}>
      <Image
        source={require('../assets/images/big_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>About Kord Snap & Solve</Text>
      <Text style={styles.description}>
        <Text style={styles.bold}>Kord Snap & Solve</Text> is a powerful React Native Expo
        application designed to help users solve mathematical questions step by step. Simply upload
        or snap a photo of your math question, and the app will analyze and provide a detailed
        solution.{'\n\n'}
        <Text style={styles.bold}>Key Features:</Text>
        {'\n'}• Snap or upload images of math questions{'\n'}• Step-by-step solutions{'\n'}•
        Supports a variety of math topics{'\n'}• User-friendly interface{'\n'}• Built with Expo,
        React Native, and Firebase{'\n\n'}
        This project is open source and maintained by a dedicated team. We welcome contributions and
        feedback from the community!
      </Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 48, // Add extra bottom padding for tab bar
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    maxWidth: 420,
    marginBottom: 48, // Ensure card closes above the tab bar
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 18,
    borderRadius: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#1a237e',
    textAlign: 'center',
    letterSpacing: 1,
  },
  description: {
    fontSize: 17,
    color: '#333',
    textAlign: 'left',
    lineHeight: 26,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1a237e',
  },
});

export default AboutScreen;
