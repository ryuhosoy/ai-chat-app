import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Users, Mic, Bot } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const currentActivities = [
    {
      id: '1',
      name: 'Alex',
      role: 'AI Moderator: Ava',
      avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      time: '2m ago'
    },
    {
      id: '2', 
      name: 'Sarah',
      role: 'AI Moderator: Ben',
      avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      time: '5m ago'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Voice Chat</Text>
            <Text style={styles.subtitleText}>Connect with people worldwide</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Bot size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Start Chat Button */}
        <TouchableOpacity 
          style={styles.startChatButton}
          onPress={() => router.push('/matching')}
        >
          <Mic size={24} color="#FFFFFF" />
          <Text style={styles.startChatText}>Start New Chat</Text>
        </TouchableOpacity>

        {/* Current Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Activity</Text>
          
          {currentActivities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <Image 
                source={{ uri: activity.avatarUrl }}
                style={styles.avatar}
              />
              <View style={styles.activityDetails}>
                <Text style={styles.activityName}>Chat with {activity.name}</Text>
                <Text style={styles.activityRole}>{activity.role}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTime}>{activity.time}</Text>
                <View style={styles.onlineIndicator} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={20} color="#FF6B35" />
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Online Users</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={20} color="#FF6B35" />
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Active Chats</Text>
          </View>
        </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startChatButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  activityItem: {
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
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});