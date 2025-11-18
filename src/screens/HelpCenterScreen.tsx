import { Component } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

import styles from '@/src/styles';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type Props = object;

type State = {
  expandedFAQ: string | null;
};

class HelpCenterScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      expandedFAQ: null,
    };
  }

  // WhatsApp phone number
  // Format: country code + number without +, spaces, dashes, or leading zeros
  // Pakistan: +92 309 1015931 -> 923091015931
  WHATSAPP_NUMBER = '923091015931';

  faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I scan a math question?',
      answer:
        'To scan a math question, go to the Home screen and tap on "Scan Question". Allow camera permissions, then point your camera at the math problem and capture the image. The app will automatically process the image and provide a solution.',
    },
    {
      id: '2',
      question: 'Can I type equations instead of scanning?',
      answer:
        'Yes! You can type equations manually by going to the Home screen and selecting "Type Equation". Use the math keyboard to input your equation and get step-by-step solutions.',
    },
    {
      id: '3',
      question: 'How accurate are the solutions?',
      answer:
        'Our AI-powered solver provides highly accurate solutions for a wide range of mathematical problems. However, complex or handwritten equations may require manual verification. Always double-check critical calculations.',
    },
    {
      id: '4',
      question: 'What types of math problems can the app solve?',
      answer:
        'The app can solve various types of math problems including algebra, calculus, geometry, trigonometry, and more. It handles equations, word problems, and multiple-choice questions.',
    },
    {
      id: '5',
      question: 'How do I change my password?',
      answer:
        'To change your password, go to Settings > Security > Change Password. You will need to enter your current password and then set a new password.',
    },
    {
      id: '6',
      question: 'What should I do if I forget my password?',
      answer:
        'If you forget your password, you can reset it from the login screen. Tap on "Forgot Password" and enter your email address. You will receive a password reset link via email.',
    },
    {
      id: '7',
      question: 'How do I verify my email address?',
      answer:
        'Go to Settings > Account Information. If your email is not verified, you will see a "Resend Verification Email" button. Click it and check your inbox for the verification link.',
    },
    {
      id: '8',
      question: 'Can I use the app offline?',
      answer:
        'No, the app requires an internet connection to process math problems and provide solutions. Make sure you have a stable internet connection for the best experience.',
    },
    {
      id: '9',
      question: 'How do I update my profile information?',
      answer:
        'You can update your display name by going to Settings > Profile Management > Edit Name. Enter your new name and save the changes.',
    },
    {
      id: '10',
      question: 'Is my data secure?',
      answer:
        'Yes, we take data security seriously. All user data is encrypted and stored securely. We use Firebase authentication and follow industry best practices to protect your information.',
    },
  ];

  toggleFAQ = (id: string) => {
    this.setState(prevState => ({
      expandedFAQ: prevState.expandedFAQ === id ? null : id,
    }));
  };

  handleWhatsAppContact = async () => {
    const message = encodeURIComponent('Hello! I need help with Kord Snap & Solve app.');
    const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${message}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp Not Available', 'Please install WhatsApp to contact us directly.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open WhatsApp. Please make sure WhatsApp is installed on your device.',
        [{ text: 'OK' }]
      );
    }
  };

  renderFAQItem = (faq: FAQItem) => {
    const isExpanded = this.state.expandedFAQ === faq.id;

    return (
      <View
        key={faq.id}
        style={styles.shadow}
        className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
        <TouchableOpacity
          className="p-4 flex-row items-center justify-between"
          onPress={() => this.toggleFAQ(faq.id)}
          activeOpacity={0.7}>
          <View className="flex-1 mr-3">
            <Text className="text-gray-800 font-semibold text-base">{faq.question}</Text>
          </View>
          <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6366f1" />
        </TouchableOpacity>
        {isExpanded && (
          <View className="px-4 pb-4 border-t border-gray-100">
            <Text className="text-gray-600 text-sm mt-3 leading-6">{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  render() {
    return (
      <ScrollView className="flex-1 bg-gray-50 pb-24" showsVerticalScrollIndicator={true}>
        <View className="p-4">
          {/* Header Section */}
          <View className="mb-6">
            <View className="items-center mb-4">
              <View className="bg-violet-100 rounded-full p-4 mb-3">
                <Feather name="help-circle" size={40} color="#6366f1" />
              </View>
              <Text className="text-gray-800 font-bold text-2xl text-center mb-2">Help Center</Text>
              <Text className="text-gray-600 text-center text-base">
                Find answers to common questions or contact us directly
              </Text>
            </View>
          </View>

          {/* WhatsApp Contact Section */}
          <View className="mb-6">
            <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
              Contact Support
            </Text>
            <TouchableOpacity
              style={styles.shadow}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex-row items-center justify-between"
              onPress={this.handleWhatsAppContact}
              activeOpacity={0.7}>
              <View className="flex-row items-center flex-1 mr-2">
                <MaterialIcons name="chat" size={28} color="#25D366" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-bold text-lg">Chat with Us on WhatsApp</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Get instant help from our support team
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View className="mb-6">
            <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
              Frequently Asked Questions
            </Text>
            {this.faqs.map(faq => this.renderFAQItem(faq))}
          </View>

          {/* Additional Help Section */}
          <View className="mb-6">
            <View
              style={styles.shadow}
              className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <View className="flex-row items-start mb-2">
                <MaterialIcons name="info" size={24} color="#6366f1" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-semibold text-base mb-1">
                    Still Need Help?
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    If you can&apos;t find the answer you&apos;re looking for, feel free to contact
                    us via WhatsApp. Our support team is available to assist you with any questions
                    or issues you may have.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
}

export default HelpCenterScreen;
