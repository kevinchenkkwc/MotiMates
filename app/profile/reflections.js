import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const reflections = [
  {
    id: 1,
    title: 'Late night grind with Derek',
    date: 'Nov 10, 2025',
    duration: '1h 30min',
    reflection: 'Felt super locked in on my problem set once I killed notifications.',
  },
  {
    id: 2,
    title: 'Afternoon library sprint',
    date: 'Nov 7, 2025',
    duration: '50min',
    reflection: 'Got through all the readings I was procrastinating on.',
  },
  {
    id: 3,
    title: 'Solo focus block',
    date: 'Nov 3, 2025',
    duration: '25min',
    reflection: 'Short but solid – wrote an outline for my essay.',
  },
];

export default function PastReflections() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Past Reflections</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {reflections.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.date} • {item.duration}</Text>
              <Text style={styles.cardBody}>{item.reflection}</Text>
            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
});
