import { init, track } from '@amplitude/analytics-react-native';

// TODO: Replace with your Amplitude API key
const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';

let isInitialized = false;

export const initAnalytics = async (userId) => {
  if (!AMPLITUDE_API_KEY || isInitialized) return;
  
  try {
    await init(AMPLITUDE_API_KEY, userId);
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing analytics:', error);
  }
};

export const trackEvent = async (eventName, eventProperties = {}) => {
  if (!isInitialized) return;
  
  try {
    await track(eventName, eventProperties);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Event constants
export const EVENTS = {
  // Session events
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  SESSION_ABANDONED: 'session_abandoned',
  
  // Friend events
  FRIEND_REQUEST_SENT: 'friend_request_sent',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
};
