// Session Reactions Component
// Allows participants to send quick encouragement to each other

import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';

const REACTIONS = [
  { id: 'fire', emoji: '🔥', label: 'On fire!' },
  { id: 'thumbs', emoji: '👍', label: 'Nice work!' },
  { id: 'coffee', emoji: '☕', label: 'Break time?' },
  { id: 'rocket', emoji: '🚀', label: 'Keep going!' },
];

export default function SessionReactions({ sessionId, currentUserId }) {
  const [reactions, setReactions] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subscribe to real-time reactions
    const channel = supabase
      .channel(`reactions:${sessionId}`)
      .on(
        'broadcast',
        { event: 'reaction' },
        (payload) => {
          if (payload.payload.userId !== currentUserId) {
            showReaction(payload.payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUserId]);

  const sendReaction = async (reaction) => {
    const channel = supabase.channel(`reactions:${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'reaction',
      payload: {
        userId: currentUserId,
        reaction: reaction.emoji,
        label: reaction.label,
        timestamp: Date.now(),
      },
    });
  };

  const showReaction = (reactionData) => {
    setReactions(prev => [...prev, { id: Date.now(), ...reactionData }]);
    
    // Animate in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReactions(prev => prev.slice(1));
    });
  };

  return (
    <View style={styles.container}>
      {/* Reaction buttons */}
      <View style={styles.reactionButtons}>
        {REACTIONS.map(reaction => (
          <TouchableOpacity
            key={reaction.id}
            style={styles.reactionButton}
            onPress={() => sendReaction(reaction)}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating reaction notifications */}
      {reactions.length > 0 && (
        <Animated.View style={[styles.notification, { opacity: fadeAnim }]}>
          <Text style={styles.notificationEmoji}>{reactions[0].reaction}</Text>
          <Text style={styles.notificationText}>{reactions[0].label}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  notification: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
