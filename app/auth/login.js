import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { signInWithEmail } from '../../utils/api';
import { responsive } from '../../utils/responsive';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Simulated login - navigate to home tab
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signInWithEmail({ email, password });
      router.replace('/tabs/3-home');
    } catch (e) {
      setError(e.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
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
            <Text style={styles.tagline}>Friends don't let friends doomscroll.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
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

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: responsive.isTablet ? 60 : 40,
    borderTopRightRadius: responsive.isTablet ? 60 : 40,
    paddingTop: responsive.padding.xl,
    paddingHorizontal: responsive.contentPadding * 1.5,
    paddingBottom: responsive.padding.xl * 2,
    minHeight: '65%',
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
  loginButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
    marginTop: responsive.padding.md,
    marginBottom: responsive.padding.md,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_600SemiBold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  signupLink: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
  },
  errorText: {
    marginTop: responsive.padding.sm,
    textAlign: 'center',
    color: '#B71C1C',
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
  },
});
