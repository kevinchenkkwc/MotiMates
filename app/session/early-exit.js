import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { leaveSession } from '../../utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

const dismissKeyboard = () => {
  Keyboard.dismiss();
};

export default function EarlyExit() {
  const router = useRouter();
  const { sessionId, sessionName, reason } = useLocalSearchParams();
  
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId && reflection.trim()) {
        // Save reflection to database
        await supabase.from('reflections').insert({
          session_id: sessionId,
          user_id: userId,
          reflection_text: reflection,
          early_exit: true,
          exit_reason: reason,
        });
      }

      // Leave the session (remove from participants)
      if (sessionId) {
        await leaveSession(sessionId);
        
        // Check if user is host - if so, mark session as ended
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('host_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionData && sessionData.host_id === userId) {
          // Host is leaving - end the session
          await supabase
            .from('sessions')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
        
        // Broadcast participant change
        const channel = supabase.channel(`session:${sessionId}`);
        await channel.send({
          type: 'broadcast',
          event: 'participant_change',
          payload: { userId, action: 'left' },
        });
        await supabase.removeChannel(channel);
      }

      setSubmitted(true);
      setTimeout(() => {
        router.replace('/tabs/3-home');
      }, 2000);
    } catch (e) {
      console.error('Failed to save reflection:', e);
      // Still navigate even if save fails
      router.replace('/tabs/3-home');
    }
  };

  const handleSkip = async () => {
    try {
      // Leave the session even if skipping reflection
      if (sessionId) {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        
        await leaveSession(sessionId);
        
        // Check if user is host - if so, mark session as ended
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('host_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionData && sessionData.host_id === userId) {
          // Host is leaving - end the session
          await supabase
            .from('sessions')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
        
        // Broadcast participant change
        const channel = supabase.channel(`session:${sessionId}`);
        await channel.send({
          type: 'broadcast',
          event: 'participant_change',
          payload: { userId, action: 'left' },
        });
        await supabase.removeChannel(channel);
      }
    } catch (e) {
      console.error('Failed to leave session:', e);
    }
    router.replace('/tabs/3-home');
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/background.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.content}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Thank you!</Text>
            <Text style={styles.successSubtitle}>Your reflection has been saved</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={responsive.keyboardVerticalOffset}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Ionicons name="exit-outline" size={64} color="#FFB84D" />
                <Text style={styles.title}>Early Exit</Text>
                <Text style={styles.sessionName}>{sessionName || 'Study Session'}</Text>
              </View>

              <View style={styles.reasonCard}>
                <Text style={styles.reasonLabel}>Exit Reason:</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>

              <View style={styles.reflectionSection}>
                <Text style={styles.sectionTitle}>Quick Reflection</Text>
                <Text style={styles.sectionSubtitle}>
                  How did this session go? What could you improve next time?
                </Text>
                <TextInput
                  style={styles.reflectionInput}
                  placeholder="I felt productive because..."
                  placeholderTextColor="#999"
                  value={reflection}
                  onChangeText={setReflection}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.motivationalBox}>
                <Ionicons name="bulb-outline" size={24} color="#FFB84D" style={styles.bulbIcon} />
                <Text style={styles.motivationalText}>
                  Life happens! The important thing is getting back to it. Your study mates are still locked in. 💪
                </Text>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Reflection</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.padding.lg,
    paddingTop: responsive.padding.xl * 2,
    paddingBottom: responsive.padding.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.padding.lg,
  },
  title: {
    fontSize: responsive.fontSize.xxxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginTop: responsive.padding.md,
    marginBottom: responsive.padding.xs,
  },
  sessionName: {
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reasonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: responsive.padding.md,
    marginBottom: responsive.padding.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reasonLabel: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.xs,
  },
  reasonText: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  reflectionSection: {
    marginBottom: responsive.padding.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.xs,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: responsive.padding.md,
  },
  reflectionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: responsive.padding.md,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    minHeight: 140,
    textAlignVertical: 'top',
  },
  motivationalBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 30, 30, 0.3)',
    borderRadius: 16,
    padding: responsive.padding.md,
    marginBottom: responsive.padding.lg,
    alignItems: 'center',
  },
  bulbIcon: {
    marginRight: responsive.padding.sm,
  },
  motivationalText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: '#FFB84D',
    borderRadius: 16,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
    marginBottom: responsive.padding.sm,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.padding.lg,
  },
  successTitle: {
    fontSize: responsive.fontSize.xxxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginTop: responsive.padding.md,
    marginBottom: responsive.padding.xs,
  },
  successSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
