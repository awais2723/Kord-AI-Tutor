import { Component } from 'react';
import { Link, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { doSignInWithEmailAndPassword, getErrorMessage, doPasswordReset } from '@/firebase/auth';

type Props = object;

type State = {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  message: { success: string; error: string };
  isKeyboardVisible: boolean;
};

class LoginScreen extends Component<Props, State> {
  keyboardDidShowListener: any;
  keyboardDidHideListener: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      showPassword: false,
      loading: false,
      message: { success: '', error: '' },
      isKeyboardVisible: false,
    };
  }

  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardDidShowListener?.remove();
    this.keyboardDidHideListener?.remove();
  }

  _keyboardDidShow = () => {
    this.setState({ isKeyboardVisible: true });
  };

  _keyboardDidHide = () => {
    this.setState({ isKeyboardVisible: false });
  };

  forgotPassword = async () => {
    const { email, loading } = this.state;
    if (loading) return;

    if (!email) {
      this.setState({
        message: { success: '', error: 'Please enter your email address first' },
      });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 3000);
      return;
    }

    this.setState({ loading: true });

    try {
      await doPasswordReset(email);
      this.setState({
        message: {
          success: 'Password reset email sent. Please check your inbox.',
          error: '',
        },
      });
    } catch (error: any) {
      const errorMessage = error?.code
        ? getErrorMessage(error.code)
        : 'An error occurred. Please try again.';

      this.setState({
        message: { success: '', error: errorMessage },
      });
    } finally {
      this.setState({ loading: false });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 3000);
    }
  };

  handleLogin = async () => {
    const { email, password, loading } = this.state;
    if (loading) return;

    if (!email || !password) {
      this.setState({
        message: { success: '', error: 'Both fields are required' },
      });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 3000);
      return;
    }

    this.setState({ loading: true, showPassword: false });

    try {
      const response = await doSignInWithEmailAndPassword(email, password);
      const user = response.user;

      if (!user.emailVerified) {
        // Redirect to email verification screen
        this.setState({
          loading: false,
          message: {
            success: 'Please verify your email first. Redirecting...',
            error: '',
          },
        });

        setTimeout(() => {
          router.replace('/email-verification');
        }, 1500);
        return;
      }

      // Email verified — allow login
      this.setState({
        email: '',
        password: '',
        message: { success: 'Login Successfully', error: '' },
      });

      setTimeout(() => router.replace('/home'), 500);
    } catch (error: any) {
      const errorMessage = error?.code
        ? getErrorMessage(error.code)
        : 'Invalid email or password. Please try again.';

      this.setState({
        message: { success: '', error: getErrorMessage(error.code) },
        showPassword: true,
      });
    } finally {
      this.setState({ loading: false });
      setTimeout(() => this.setState({ message: { success: '', error: '' } }), 3000);
    }
  };

  render() {
    const { email, password, showPassword, loading, message, isKeyboardVisible } = this.state;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-around">
          {!isKeyboardVisible && (
            <View className="flex flex-row justify-center">
              <Image
                className="w-40 h-40 mb-1 mt-8 rounded-full"
                source={require('../assets/images/logo.png')}
                resizeMode="contain"
              />
            </View>
          )}

          <View className="px-8 pt-2">
            <View className="form space-y-2">
              <Text className="text-lg font-bold text-violet-700 leading-9">Email Address</Text>
              <TextInput
                placeholder="Enter Email"
                value={email}
                onChangeText={text => this.setState({ email: text })}
                className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-2"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text className="text-lg font-bold text-violet-700 leading-9">Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter Password"
                  value={password}
                  onChangeText={text => this.setState({ password: text })}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-2 mb-4"
                />
                <TouchableOpacity
                  className="absolute right-0 top-[18%] mr-3"
                  onPress={() => this.setState({ showPassword: !showPassword })}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                </TouchableOpacity>
              </View>

              {message.success !== '' && (
                <Text className="text-green-500 my-2">{message.success}</Text>
              )}
              {message.error !== '' && <Text className="text-red-500 my-2">{message.error}</Text>}

              <TouchableOpacity className="flex items-end mb-12" onPress={this.forgotPassword}>
                <Text className="text-violet-700 font-bold text-xl">Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="border-2 bg-violet-700 text-gray-700 border-gray-300 rounded-lg px-4 py-2"
                onPress={this.handleLogin}>
                {loading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <Text className="text-center font-bold text-white text-xl">Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-center mt-2">
            <Text className="font-bold text-xl">Don&apos;t have an account?</Text>
            <Link href="/signup" asChild className="pl-2">
              <Text className="text-center text-violet-700 font-bold text-xl">Signup</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

export default LoginScreen;
