import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Loader } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function MatchingScreen() {
  const [isSearching, setIsSearching] = useState(false);

  const handleStartSearch = () => {
    setIsSearching(true);
    // Simulate matching process
    setTimeout(() => {
      setIsSearching(false);
      router.push('/chat');
    }, 3000);
  };

  if (isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchingContainer}>
          <Loader size={48} color="#FF6B35" />
          <Text style={styles.searchingTitle}>Finding your duo...</Text>
          <Text style={styles.searchingSubtitle}>
            We're on the hunt for the perfect human + AI pair for you! It's usually super quick!
          </Text>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setIsSearching(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finding your duo...</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300' }}
          style={styles.illustration}
        />
        
        <Text style={styles.title}>Hold tight!</Text>
        <Text style={styles.subtitle}>
          We're on the hunt for the perfect human + AI pair for you with AI. It's usually super quick!
        </Text>

        <View style={styles.matchingInfo}>
          <View style={styles.infoItem}>
            <Users size={20} color="#FF6B35" />
            <Text style={styles.infoText}>Matching with humans worldwide</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.aiIcon}>🤖</Text>
            <Text style={styles.infoText}>AI moderator will join to help</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartSearch}
        >
          <Text style={styles.startButtonText}>Start Matching</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Auto-pilot: Matches are always sure we all have a good time!
        </Text>
      </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 200,
    height: 150,
    borderRadius: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  matchingInfo: {
    width: '100%',
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  aiIcon: {
    fontSize: 20,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  cancelButton: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});