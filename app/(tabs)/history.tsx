import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const chatHistory = [
    {
      id: '1',
      name: 'Alex',
      avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      date: 'Dec 30, 2023',
      duration: '15 min'
    },
    {
      id: '2',
      name: 'Sarah',
      avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      date: 'Dec 26, 2023',
      duration: '22 min'
    },
    {
      id: '3',
      name: 'David',
      avatarUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      date: 'Dec 23, 2023',
      duration: '8 min'
    },
    {
      id: '4',
      name: 'Emily',
      avatarUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      date: 'Dec 22, 2023',
      duration: '31 min'
    },
    {
      id: '5',
      name: 'Michael',
      avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      date: 'Dec 20, 2023',
      duration: '12 min'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {chatHistory.map((chat) => (
          <TouchableOpacity key={chat.id} style={styles.chatItem}>
            <Image 
              source={{ uri: chat.avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.chatDetails}>
              <Text style={styles.chatName}>Chat with {chat.name}</Text>
              <Text style={styles.chatDate}>{chat.date}</Text>
            </View>
            <View style={styles.chatMeta}>
              <View style={styles.durationContainer}>
                <Clock size={14} color="#9CA3AF" />
                <Text style={styles.duration}>{chat.duration}</Text>
              </View>
              <TouchableOpacity style={styles.optionsButton}>
                <Text style={styles.optionsText}>···</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  optionsButton: {
    padding: 4,
  },
  optionsText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});