
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration - REPLACE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
    apiKey: "AIzaSyABStelKtIFhPWvFWO-59VUBdieuRGc6cw",
    authDomain: "apex-living.firebaseapp.com",
    projectId: "apex-living",
    storageBucket: "apex-living.firebasestorage.app",
    messagingSenderId: "1079683852942",
    appId: "1:1079683852942:web:ed376688f4fdc8b81677df",
    measurementId: "G-BZLWLYH3FY"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth Helper Functions
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: userData.fullName
    });

    // Create user document in Firestore using modular syntax
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      fullName: userData.fullName,
      phone: userData.phone,
      role: userData.role || 'buyer',
      totalDeposits: 0,
      walletAddress: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('apex_user');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const setupAuthListener = (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase Auth State Changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const completeUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              ...userData
            };
            
            console.log('Setting user in localStorage:', completeUser.email);
            localStorage.setItem('apex_user', JSON.stringify(completeUser));
            callback(completeUser);
          } else {
            console.log('User document not found in Firestore');
            localStorage.removeItem('apex_user');
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('apex_user');
          callback(null);
        }
      } else {
        console.log('No Firebase user found');
        localStorage.removeItem('apex_user');
        callback(null);
      }
    });
  };

// Firestore Helper Functions
export const addProperty = async (propertyData) => {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getProperties = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'properties'));
    const properties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, properties };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProperties = async (userId) => {
  try {
    const q = query(collection(db, 'properties'), where('sellerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const properties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, properties };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserDeposit = async (userId, amount) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const currentDeposits = userDoc.data().totalDeposits || 0;
      await updateDoc(userDocRef, {
        totalDeposits: currentDeposits + amount,
        updatedAt: new Date()
      });
      return { success: true };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};