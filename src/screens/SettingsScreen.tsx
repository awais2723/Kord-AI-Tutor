import { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  doSignOut,
  doPasswordChange,
  doUpdateProfile,
  doSendEmailVerification,
  getErrorMessage,
  doSignInWithEmailAndPassword,
} from '@/firebase/auth';
import { AuthContext, AuthContextType } from '@/context';
import styles from '@/src/styles';

type Props = object;

type State = {
  // Modals
  isLogoutModalVisible: boolean;
  isProfileModalVisible: boolean;
  isPasswordModalVisible: boolean;
  isDeleteAccountModalVisible: boolean;

  // Profile Management
  displayName: string;
  profileLoading: boolean;
  profileMessage: { success: string; error: string };

  // Password Change
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordLoading: boolean;
  passwordMessage: { success: string; error: string };

  // General
  loading: boolean;
};

class SettingsScreen extends Component<Props, State> {
  static contextType = AuthContext;
  declare context: AuthContextType;

  constructor(props: Props) {
    super(props);
    this.state = {
      // Modals
      isLogoutModalVisible: false,
      isProfileModalVisible: false,
      isPasswordModalVisible: false,
      isDeleteAccountModalVisible: false,

      // Profile Management
      displayName: '',
      profileLoading: false,
      profileMessage: { success: '', error: '' },

      // Password Change
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordLoading: false,
      passwordMessage: { success: '', error: '' },

      // General
      loading: false,
    };
  }

  componentDidMount() {
    const { currentUser } = this.context;
    if (currentUser) {
      this.setState({
        displayName: currentUser.displayName || '',
      });
    }
  }

  // Profile Management
  openProfileModal = () => {
    const { currentUser } = this.context;
    this.setState({
      isProfileModalVisible: true,
      displayName: currentUser?.displayName || '',
      profileMessage: { success: '', error: '' },
    });
  };

  closeProfileModal = () => {
    this.setState({
      isProfileModalVisible: false,
      displayName: '',
      profileMessage: { success: '', error: '' },
    });
  };

  handleUpdateProfile = async () => {
    const { displayName, profileLoading } = this.state;
    if (profileLoading) return;

    if (!displayName || displayName.trim().length === 0) {
      this.setState({
        profileMessage: { success: '', error: 'Display name cannot be empty' },
      });
      setTimeout(() => this.setState({ profileMessage: { success: '', error: '' } }), 3000);
      return;
    }

    if (displayName.length < 2) {
      this.setState({
        profileMessage: { success: '', error: 'Display name must be at least 2 characters' },
      });
      setTimeout(() => this.setState({ profileMessage: { success: '', error: '' } }), 3000);
      return;
    }

    this.setState({ profileLoading: true });

    try {
      await doUpdateProfile(displayName.trim());
      this.setState({
        profileMessage: { success: 'Profile updated successfully!', error: '' },
      });
      setTimeout(() => {
        this.closeProfileModal();
        // Reload the component to reflect changes
        this.forceUpdate();
      }, 1500);
    } catch (error: any) {
      this.setState({
        profileMessage: {
          success: '',
          error: getErrorMessage(error.code || 'auth/update-profile-failed'),
        },
      });
    } finally {
      this.setState({ profileLoading: false });
      setTimeout(() => this.setState({ profileMessage: { success: '', error: '' } }), 3000);
    }
  };

  // Password Change
  openPasswordModal = () => {
    this.setState({
      isPasswordModalVisible: true,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordMessage: { success: '', error: '' },
    });
  };

  closePasswordModal = () => {
    this.setState({
      isPasswordModalVisible: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordMessage: { success: '', error: '' },
    });
  };

  handleChangePassword = async () => {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      passwordLoading,
    } = this.state;
    const { currentUser } = this.context;

    if (passwordLoading) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.setState({
        passwordMessage: { success: '', error: 'All fields are required' },
      });
      setTimeout(() => this.setState({ passwordMessage: { success: '', error: '' } }), 3000);
      return;
    }

    if (newPassword.length < 6) {
      this.setState({
        passwordMessage: { success: '', error: 'Password must be at least 6 characters' },
      });
      setTimeout(() => this.setState({ passwordMessage: { success: '', error: '' } }), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      this.setState({
        passwordMessage: { success: '', error: 'New passwords do not match' },
      });
      setTimeout(() => this.setState({ passwordMessage: { success: '', error: '' } }), 3000);
      return;
    }

    if (currentPassword === newPassword) {
      this.setState({
        passwordMessage: { success: '', error: 'New password must be different from current password' },
      });
      setTimeout(() => this.setState({ passwordMessage: { success: '', error: '' } }), 3000);
      return;
    }

    this.setState({ passwordLoading: true });

    try {
      // Verify current password by attempting to sign in
      if (currentUser?.email) {
        await doSignInWithEmailAndPassword(currentUser.email, currentPassword);
        // If sign in successful, update password
        await doPasswordChange(newPassword);
        this.setState({
          passwordMessage: { success: 'Password changed successfully!', error: '' },
        });
        setTimeout(() => {
          this.closePasswordModal();
        }, 1500);
      }
    } catch (error: any) {
      this.setState({
        passwordMessage: {
          success: '',
          error: getErrorMessage(error.code || 'auth/password-change-failed'),
        },
      });
    } finally {
      this.setState({ passwordLoading: false });
      setTimeout(() => this.setState({ passwordMessage: { success: '', error: '' } }), 3000);
    }
  };

  // Email Verification
  handleResendVerification = async () => {
    try {
      await doSendEmailVerification();
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error.code || 'auth/verification-failed'));
    }
  };

  // Logout
  handleConfirmLogout = async () => {
    this.setState({ isLogoutModalVisible: false, loading: true });
    try {
      await doSignOut();
      this.context.resetAuth();
      router.push('/login');
    } catch (error) {
      this.setState({ loading: false });
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Delete Account (placeholder - would need additional implementation)
  handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This feature requires additional implementation. Please contact support for account deletion.',
      [{ text: 'OK' }]
    );
  };

  renderSettingItem = (
    icon: string,
    title: string,
    onPress: () => void,
    iconLib: 'Feather' | 'Ionicons' | 'MaterialIcons' = 'Feather',
    rightContent?: React.ReactNode
  ) => {
    const IconComponent = iconLib === 'Ionicons' ? Ionicons : iconLib === 'MaterialIcons' ? MaterialIcons : Feather;

    return (
      <TouchableOpacity
        style={styles.shadow}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center justify-between"
        onPress={onPress}
        activeOpacity={0.7}>
        <View className="flex-row items-center flex-1 mr-2">
          <IconComponent name={icon as any} size={22} color="#6366f1" />
          <Text className="text-gray-800 font-semibold text-lg ml-3" style={{ flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        {rightContent || <Feather name="chevron-right" size={20} color="#9ca3af" />}
      </TouchableOpacity>
    );
  };

  render() {
    const {
      isLogoutModalVisible,
      isProfileModalVisible,
      isPasswordModalVisible,
      displayName,
      profileLoading,
      profileMessage,
      currentPassword,
      newPassword,
      confirmPassword,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      passwordLoading,
      passwordMessage,
      loading,
    } = this.state;

    const { currentUser } = this.context;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          className="flex-1 bg-gray-50"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}>
          <View className="p-4">
            {/* Account Information Section */}
            <View className="mb-6">
              <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
                Account Information
              </Text>
              <View style={styles.shadow} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Display Name</Text>
                  <Text className="text-gray-800 font-semibold text-base capitalize flex-1 text-right ml-2">
                    {currentUser?.displayName || 'Not set'}
                  </Text>
                </View>
                <View className="border-t border-gray-200 my-2" />
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Email</Text>
                  <Text className="text-gray-800 font-semibold text-base flex-1 text-right ml-2" numberOfLines={1} ellipsizeMode="tail">
                    {currentUser?.email}
                  </Text>
                </View>
                <View className="border-t border-gray-200 my-2" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-sm">Email Verified</Text>
                  <View className="flex-row items-center">
                    {currentUser?.emailVerified ? (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                        <Text className="text-green-600 font-semibold text-sm ml-1">Verified</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                        <Text className="text-red-600 font-semibold text-sm ml-1">Not Verified</Text>
                      </>
                    )}
                  </View>
                </View>
                {!currentUser?.emailVerified && (
                  <>
                    <View className="border-t border-gray-200 my-2" />
                    <TouchableOpacity
                      onPress={this.handleResendVerification}
                      className="bg-violet-100 py-2 px-3 rounded-md mt-2">
                      <Text className="text-violet-700 font-semibold text-center text-sm">
                        Resend Verification Email
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Profile Management Section */}
            <View className="mb-6">
              <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
                Profile Management
              </Text>
              {this.renderSettingItem('user', 'Edit Name', this.openProfileModal)}
            </View>

            {/* Security Section */}
            <View className="mb-6">
              <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
                Security
              </Text>
              {this.renderSettingItem('lock', 'Change Password', this.openPasswordModal)}
            </View>

            {/* Account Actions Section */}
            <View className="mb-8">
              <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
                Account Actions
              </Text>
              <TouchableOpacity
                style={styles.shadow}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-between"
                onPress={() => this.setState({ isLogoutModalVisible: true })}
                activeOpacity={0.7}>
                <View className="flex-row items-center flex-1 mr-2">
                  <Feather name="log-out" size={22} color="#ef4444" />
                  <Text className="text-red-600 font-semibold text-lg ml-3">Logout</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Profile Edit Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isProfileModalVisible}
              onRequestClose={this.closeProfileModal}>
              <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View className="bg-white rounded-2xl p-6 mx-4" style={styles.shadow}>
                  <Text className="text-2xl font-bold text-gray-800 mb-4">Edit Profile</Text>
                  <Text className="text-gray-600 mb-4">Update your display name</Text>

                  <Text className="text-lg font-semibold text-gray-700 mb-2">Display Name</Text>
                  <TextInput
                    placeholder="Enter display name"
                    value={displayName}
                    onChangeText={text => this.setState({ displayName: text })}
                    className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-3 mb-4"
                    autoCapitalize="words"
                    maxLength={30}
                  />

                  {profileMessage.success !== '' && (
                    <Text className="text-green-500 mb-2">{profileMessage.success}</Text>
                  )}
                  {profileMessage.error !== '' && (
                    <Text className="text-red-500 mb-2">{profileMessage.error}</Text>
                  )}

                  <View className="flex-row justify-end gap-x-3 mt-2">
                    <TouchableOpacity
                      className="bg-gray-300 py-3 px-6 rounded-md"
                      onPress={this.closeProfileModal}
                      disabled={profileLoading}>
                      <Text className="text-gray-800 font-semibold text-center">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-violet-700 py-3 px-6 rounded-md"
                      onPress={this.handleUpdateProfile}
                      disabled={profileLoading}>
                      {profileLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>

            {/* Change Password Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isPasswordModalVisible}
              onRequestClose={this.closePasswordModal}>
              <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ justifyContent: 'center', paddingVertical: 20 }}>
                  <View className="bg-white rounded-2xl p-6 mx-4" style={styles.shadow}>
                    <Text className="text-2xl font-bold text-gray-800 mb-4">Change Password</Text>
                    <Text className="text-gray-600 mb-4">Enter your current password and choose a new one</Text>

                    <Text className="text-lg font-semibold text-gray-700 mb-2">Current Password</Text>
                    <View className="relative mb-4">
                      <TextInput
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={text => this.setState({ currentPassword: text })}
                        secureTextEntry={!showCurrentPassword}
                        className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-3 pr-12"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() =>
                          this.setState({ showCurrentPassword: !showCurrentPassword })
                        }>
                        <Feather
                          name={showCurrentPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-lg font-semibold text-gray-700 mb-2">New Password</Text>
                    <View className="relative mb-4">
                      <TextInput
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={text => this.setState({ newPassword: text })}
                        secureTextEntry={!showNewPassword}
                        className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-3 pr-12"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() => this.setState({ showNewPassword: !showNewPassword })}>
                        <Feather
                          name={showNewPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-lg font-semibold text-gray-700 mb-2">Confirm New Password</Text>
                    <View className="relative mb-4">
                      <TextInput
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={text => this.setState({ confirmPassword: text })}
                        secureTextEntry={!showConfirmPassword}
                        className="border-2 text-gray-700 border-violet-700 rounded-md px-4 py-3 pr-12"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() =>
                          this.setState({ showConfirmPassword: !showConfirmPassword })
                        }>
                        <Feather
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>
                    </View>

                    {passwordMessage.success !== '' && (
                      <Text className="text-green-500 mb-2">{passwordMessage.success}</Text>
                    )}
                    {passwordMessage.error !== '' && (
                      <Text className="text-red-500 mb-2">{passwordMessage.error}</Text>
                    )}

                    <View className="flex-row justify-end gap-x-3 mt-2">
                      <TouchableOpacity
                        className="bg-gray-300 py-3 px-6 rounded-md"
                        onPress={this.closePasswordModal}
                        disabled={passwordLoading}>
                        <Text className="text-gray-800 font-semibold text-center">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-violet-700 py-3 px-6 rounded-md"
                        onPress={this.handleChangePassword}
                        disabled={passwordLoading}>
                        {passwordLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white font-semibold text-center">Change Password</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </Modal>

            {/* Logout Confirmation Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isLogoutModalVisible}
              onRequestClose={() => this.setState({ isLogoutModalVisible: false })}>
              <View className="flex items-center justify-center h-full bg-black/50">
                <View className="bg-white rounded-2xl p-6 mx-4" style={styles.shadow}>
                  <Text className="text-2xl font-bold text-gray-800 mb-4">
                    Are you sure you want to logout?
                  </Text>
                  <View className="flex-row justify-end gap-x-4">
                    <TouchableOpacity
                      className="bg-gray-300 py-3 px-6 rounded-md"
                      onPress={() => this.setState({ isLogoutModalVisible: false })}
                      disabled={loading}>
                      <Text className="text-gray-800 font-semibold text-center">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-600 py-3 px-6 rounded-md"
                      onPress={this.handleConfirmLogout}
                      disabled={loading}>
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">Yes, Logout</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

export default SettingsScreen;
