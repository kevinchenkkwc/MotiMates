import { View, Text, StyleSheet } from 'react-native';

export default function ErrorBoundary({ error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops, something went wrong</Text>
      <Text style={styles.error}>{error.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
