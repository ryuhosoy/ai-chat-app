import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  interests: string[];
  languages: string[];
  createdAt: Date;
  lastActive: Date;
}

class AuthService {
  async register(email: string, password: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile
    await updateProfile(user, { displayName: name });
    
    // Create user document in Firestore
    const userProfile: UserProfile = {
      id: user.uid,
      name,
      email,
      interests: [],
      languages: ['English'],
      createdAt: new Date(),
      lastActive: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active
    await this.updateLastActive(userCredential.user.uid);
    
    return userCredential.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    
    return null;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { ...updates, lastActive: new Date() }, { merge: true });
  }

  private async updateLastActive(userId: string): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { lastActive: new Date() }, { merge: true });
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export const authService = new AuthService();