import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, CreditCard as Edit3, Globe, Heart, Book, Music } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Alex');
  const [bio, setBio] = useState('A little about me');

  const interests = [
    { icon: '🎨', name: 'Art', selected: true },
    { icon: '✈️', name: 'Travel', selected: true },
    { icon: '📚', name: 'Books', selected: false },
    { icon: '🎵', name: 'Music', selected: true },
    { icon: '🎮', name: 'Gaming', selected: false },
    { icon: '🏃‍♂️', name: 'Fitness', selected: true },
  ];

  const languages = ['English', 'French'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200' }}
              style={styles.profileImage}
            />
            {isEditing && (
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.sectionValue}>{name}</Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.sectionValue}>{bio}</Text>
            )}
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>My Vibe</Text>
            <View style={styles.interestsContainer}>
              {interests.map((interest, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.interestTag,
                    interest.selected && styles.interestTagSelected
                  ]}
                  disabled={!isEditing}
                >
                  <Text style={styles.interestEmoji}>{interest.icon}</Text>
                  <Text style={[
                    styles.interestText,
                    interest.selected && styles.interestTextSelected
                  ]}>
                    {interest.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>I can chat in</Text>
            <View style={styles.languagesContainer}>
              {languages.map((language, index) => (
                <View key={index} style={styles.languageTag}>
                  <Globe size={14} color="#FF6B35" />
                  <Text style={styles.languageText}>{language}</Text>
                </View>
              ))}
              {isEditing && (
                <TouchableOpacity style={styles.addLanguageButton}>
                  <Text style={styles.addLanguageText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Save Button */}
          {isEditing && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 16,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestTagSelected: {
    backgroundColor: '#FFE4D6',
    borderColor: '#FF6B35',
  },
  interestEmoji: {
    marginRight: 4,
  },
  interestText: {
    fontSize: 14,
    color: '#6B7280',
  },
  interestTextSelected: {
    color: '#FF6B35',
    fontWeight: '500',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  addLanguageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addLanguageText: {
    fontSize: 14,
    color: '#FF6B35',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});