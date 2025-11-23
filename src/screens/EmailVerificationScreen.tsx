import { Component } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';

import { auth } from '@/firebase/config';
import { doSendEmailVerification, doSignOut } from '@/firebase/auth';

type Props = object;

type State = {
  loading: boolean;
  resending: boolean;
  message: { success: string; error: string };
  countdown: number;
  canResend: boolean;
  userEmail: string;
};

class EmailVerificationScreen extends Component<Props, State> {
  countdownInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      resending: false,
      message: { success: '', error: '' },
      countdown: 0,
      canResend: true,
      userEmail: auth.currentUser?.email || '',
    };
  }

  componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown = () => {
    this.setState({ canResend: false, countdown: 60 });
    this.countdownInterval = setInterval(() => {
      this.setState(
        prevState => ({ countdown: prevState.countdown - 1 }),
        () => {
          if (this.state.countdown <= 0) {
            this.setState({ canResend: true });
            if (this.countdownInterval) {
              clearInterval(this.countdownInterval);
            }
          }
        }
      );
    }, 1000);
  };

  handleCheckVerification = async () => {
    const { loading } = this.state;
    if (loading) return;

    this.setState({ loading: true, message: { success: '', error: '' } });

    try {
      // Reload the current user to get fresh data
      await auth.currentUser?.reload();

      // Check if email is now verified
      if (auth.currentUser?.emailVerified) {
        this.setState({
          message: {
            success: 'Email verified successfully! Redirecting...',
            error: '',
          },
        });

        setTimeout(() => {
          router.replace('/home');
        }, 1500);
      } else {
        this.setState({
          message: {
            success: '',
            error:
              'Email not verified yet. Please check your inbox and click the verification link.',
          },
        });
      }
    } catch (error: any) {
      this.setState({
        message: {
          success: '',
          error: 'Failed to check verification status. Please try again.',
        },
      });
    } finally {
      this.setState({ loading: false });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 5000);
    }
  };

  handleResendEmail = async () => {
    const { resending, canResend } = this.state;
    if (resending || !canResend) return;

    this.setState({ resending: true, message: { success: '', error: '' } });

    try {
      await doSendEmailVerification();
      this.setState({
        message: {
          success: 'Verification email sent! Please check your inbox.',
          error: '',
        },
      });
      this.startCountdown();
    } catch (error: any) {
      this.setState({
        message: {
          success: '',
          error: 'Failed to resend verification email. Please try again.',
        },
      });
    } finally {
      this.setState({ resending: false });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 5000);
    }
  };

  handleBackToLogin = async () => {
    try {
      await doSignOut();
      router.replace('/login');
    } catch (error) {
      router.replace('/login');
    }
  };

  render() {
    const { loading, resending, message, countdown, canResend, userEmail } = this.state;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 justify-center">
          {/* Header Icon */}
          <View className="items-center mb-8">
            <View className="bg-violet-100 rounded-full p-6 mb-4">
              <MaterialIcons name="email" size={80} color="#7c3aed" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 text-center">Verify Your Email</Text>
          </View>

          {/* Email Display */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-600 text-center text-base mb-1">
              We sent a verification email to:
            </Text>
            <Text className="text-violet-700 text-center font-bold text-lg">{userEmail}</Text>
          </View>

          {/* Instructions */}
          <View className="mb-6 bg-blue-50 rounded-lg p-4">
            <Text className="text-gray-700 text-base mb-3 font-semibold">
              📧 Check your email and click the verification link
            </Text>
            <Text className="text-gray-600 text-sm mb-2">
              • The email should arrive within a few minutes
            </Text>
            <Text className="text-gray-600 text-sm mb-2">
              • Don&apos;t forget to check your spam/junk folder
            </Text>
            <Text className="text-gray-600 text-sm">
              • After clicking the link, return here and tap &quot;I&apos;ve Verified My Email&quot;
            </Text>
          </View>

          {/* Messages */}
          {message.success !== '' && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <Text className="text-green-700 text-center font-medium">{message.success}</Text>
            </View>
          )}
          {message.error !== '' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-700 text-center font-medium">{message.error}</Text>
            </View>
          )}

          {/* Verification Check Button */}
          <TouchableOpacity
            className="bg-violet-700 rounded-lg py-4 mb-3 flex-row justify-center items-center"
            onPress={this.handleCheckVerification}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  I&apos;ve Verified My Email
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Email Button */}
          <TouchableOpacity
            className={`border-2 ${canResend ? 'border-violet-700' : 'border-gray-300'} rounded-lg py-4 mb-3 flex-row justify-center items-center`}
            onPress={this.handleResendEmail}
            disabled={resending || !canResend}>
            {resending ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={20} color={canResend ? '#7c3aed' : '#9ca3af'} />
                <Text
                  className={`font-bold text-lg ml-2 ${canResend ? 'text-violet-700' : 'text-gray-400'}`}>
                  {canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            className="py-3 flex-row justify-center items-center"
            onPress={this.handleBackToLogin}>
            <Feather name="arrow-left" size={18} color="#7c3aed" />
            <Text className="text-violet-700 font-semibold text-base ml-2">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

export default EmailVerificationScreen;
