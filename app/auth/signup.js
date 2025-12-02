import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { responsive } from '../../utils/responsive';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { signUpWithEmail } from '../../utils/api';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignup = async () => {
    // Simulated signup - navigate to home tab
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfo('');

      const data = await signUpWithEmail({
        email,
        password,
        displayName: username,
      });

      const hasSession = !!data?.session;
      if (hasSession) {
        router.replace('/tabs/3-home');
      } else {
        setInfo('✉️ Verification email sent! Check your inbox, tap the link (it may not work in-browser), then return here to log in.');
      }
    } catch (e) {
      setError(e.message || 'Unable to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/background.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(255, 184, 77, 0.3)', 'rgba(255, 107, 53, 0.3)', 'rgba(93, 46, 31, 0.4)']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.curvedContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>MotiMates</Text>
            <Text style={styles.tagline}>Lock in together.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
              <Text style={styles.signupButtonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {info ? <Text style={styles.infoText}>{info}</Text> : null}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </ImageBackground>
      </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  curvedContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: responsive.isTablet ? 60 : 40,
    borderTopRightRadius: responsive.isTablet ? 60 : 40,
    paddingTop: responsive.padding.xl,
    paddingHorizontal: responsive.contentPadding * 1.5,
    paddingBottom: responsive.padding.xl * 2,
    minHeight: '70%',
    width: '100%',
    maxWidth: responsive.maxWidth,
  },
  title: {
    fontSize: responsive.fontSize.huge,
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: responsive.padding.sm,
  },
  tagline: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    marginBottom: responsive.padding.xl,
  },
  inputContainer: {
    marginBottom: responsive.padding.lg,
  },
  label: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    marginBottom: responsive.padding.sm,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: responsive.padding.md,
    paddingVertical: responsive.padding.md,
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
  },
  signupButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
    marginTop: responsive.padding.md,
    marginBottom: responsive.padding.md,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_600SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  loginLink: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
  },
  errorText: {
    marginTop: responsive.padding.sm,
    marginBottom: responsive.padding.sm,
    textAlign: 'center',
    color: '#B71C1C',
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
  },
  infoText: {
    marginTop: responsive.padding.sm,
    marginBottom: responsive.padding.sm,
    paddingHorizontal: responsive.padding.sm,
    textAlign: 'center',
    color: '#2196F3',
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: responsive.fontSize.md * 1.4,
  },
});
