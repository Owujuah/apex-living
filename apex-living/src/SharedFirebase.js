// src/firebase/sharedFirebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyABStelKtIFhPWvFWO-59VUBdieuRGc6cw",
  authDomain: "apex-living.firebaseapp.com",
  projectId: "apex-living",
  storageBucket: "apex-living.firebasestorage.app",
  messagingSenderId: "1079683852942",
  appId: "1:1079683852942:web:ed376688f4fdc8b81677df",
  measurementId: "G-BZLWLYH3GY"
};

// SINGLETON PATTERN: Initialize Firebase only once
let app;
let db;
let storage;
let auth;

try {
  // Check if Firebase app is already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App Initialized');
  } else {
    app = getApp(); // Use existing app
    console.log('✅ Firebase App Already Initialized');
  }

  // Initialize services
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Export initialized services
export { db, storage, auth };

// ========== USER MANAGEMENT FUNCTIONS ==========
export const ensureUserDocumentExists = async (userId, userData) => {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const userUpdate = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, {
        ...userUpdate,
        uid: userId,
        email: userData.email || '',
        displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
        totalDeposits: 0,
        activeContracts: 0,
        totalInvested: 0,
        pendingPayments: 0,
        createdAt: serverTimestamp()
      });
      console.log('✅ Created new user document for:', userId);
    } else {
      // Update existing user (only if needed)
      const existingData = userDoc.data();
      const needsUpdate = Object.keys(userUpdate).some(
        key => userUpdate[key] !== existingData[key]
      );
      
      if (needsUpdate) {
        await updateDoc(userRef, userUpdate);
        console.log('✅ Updated existing user document for:', userId);
      }
    }
    
    return { id: userId, ...userUpdate };
  } catch (error) {
    console.error('❌ Error ensuring user document exists:', error);
    throw error;
  }
};

// Auth state change wrapper
export const onAuthChange = (callback) => {
  if (!auth) {
    console.error('Auth not initialized');
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// ========== REAL-TIME LISTENERS ==========
export const listenToUserDashboard = (userId, callback) => {
  if (!userId || !db) {
    console.error('Missing userId or Firestore not initialized');
    return () => {};
  }
  
  console.log('🎯 Setting up real-time listeners for user:', userId);
  
  // Listen to user document
  const userUnsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback('user', { id: doc.id, ...doc.data() });
    }
  }, (error) => {
    console.error('Error listening to user document:', error);
  });
  
  // Listen to user contracts - FIXED QUERY
  const contractsQuery = query(
    collection(db, 'contracts'),
    where('buyerId', '==', userId)
  );
  
  const contractsUnsubscribe = onSnapshot(contractsQuery, (snapshot) => {
    const contracts = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Handle dates safely
      ...(doc.data().createdAt && { createdAt: doc.data().createdAt.toDate() }),
      ...(doc.data().updatedAt && { updatedAt: doc.data().updatedAt.toDate() })
    }));
    callback('contracts', contracts);
  }, (error) => {
    console.error('Error listening to contracts:', error);
  });
  
  // Listen to user transactions
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || new Date()
      };
    });
    callback('transactions', transactions);
  }, (error) => {
    console.error('Error listening to transactions:', error);
  });
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up real-time listeners for user:', userId);
    userUnsubscribe();
    contractsUnsubscribe();
    transactionsUnsubscribe();
  };
};

export const listenToAdminDashboard = (callback) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }
  
  console.log('🎯 Setting up admin real-time listeners');
  
  // Listen to all users
  const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      totalDeposits: doc.data().totalDeposits || 0,
      activeContracts: doc.data().activeContracts || 0,
      totalInvested: doc.data().totalInvested || 0,
      pendingPayments: doc.data().pendingPayments || 0
    }));
    callback('users', users);
  });
  
  // Listen to all contracts
  const contractsQuery = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));
  const contractsUnsubscribe = onSnapshot(contractsQuery, (snapshot) => {
    const contracts = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      totalAmount: doc.data().totalAmount || 0,
      amountPaid: doc.data().amountPaid || 0
    }));
    callback('contracts', contracts);
  });
  
  // Listen to all transactions
  const transactionsQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        amount: data.amount || 0,
        createdAt: data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || new Date()
      };
    });
    callback('transactions', transactions);
  });
  
  // Listen to all properties
  const propertiesUnsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
    const properties = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      price: doc.data().price || 0,
      status: doc.data().status || 'Open'
    }));
    callback('properties', properties);
  });
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up admin real-time listeners');
    usersUnsubscribe();
    contractsUnsubscribe();
    transactionsUnsubscribe();
    propertiesUnsubscribe();
  };
};

// ========== CRUD OPERATIONS ==========
export const getAllUsers = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return [];
  }
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    totalDeposits: doc.data().totalDeposits || 0,
    activeContracts: doc.data().activeContracts || 0,
    totalInvested: doc.data().totalInvested || 0,
    pendingPayments: doc.data().pendingPayments || 0
  }));
};

export const getUserById = async (userId) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return null;
  }
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
};

export const createOrUpdateUser = async (userId, userData) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return null;
  }
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const userUpdate = {
    ...userData,
    updatedAt: serverTimestamp()
  };
  
  if (!userDoc.exists()) {
    // Create new user document
    await setDoc(userRef, {
      ...userUpdate,
      uid: userId,
      email: userData.email || '',
      displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
      totalDeposits: 0,
      activeContracts: 0,
      totalInvested: 0,
      pendingPayments: 0,
      createdAt: serverTimestamp()
    });
  } else {
    // Update existing user
    await updateDoc(userRef, userUpdate);
  }
  
  return { id: userId, ...userUpdate };
};

export const updateUserFinancials = async (userId, updates) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return null;
  }
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  if (!userDoc.exists()) {
    // Create user document if it doesn't exist
    await setDoc(userRef, {
      ...updateData,
      uid: userId,
      email: updates.email || '',
      displayName: updates.displayName || updates.email?.split('@')[0] || 'User',
      totalDeposits: updates.totalDeposits || 0,
      activeContracts: updates.activeContracts || 0,
      totalInvested: updates.totalInvested || 0,
      pendingPayments: updates.pendingPayments || 0,
      createdAt: serverTimestamp()
    });
  } else {
    // Update existing user
    await updateDoc(userRef, updateData);
  }
  
  // Update dashboard stats
  await updateDashboardStats();
  return updateData;
};

// ========== PROPERTY MANAGEMENT ==========
export const getAllProperties = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return [];
  }
  
  const propertiesRef = collection(db, 'properties');
  const snapshot = await getDocs(propertiesRef);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    price: doc.data().price || 0,
    status: doc.data().status || 'Open',
    installmentPlan: doc.data().installmentPlan || '5'
  }));
};

export const getPropertyById = async (propertyId) => {
  if (!db || !propertyId) {
    console.error('Firestore not initialized or missing propertyId');
    return null;
  }
  
  const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
  if (propertyDoc.exists()) {
    return { id: propertyDoc.id, ...propertyDoc.data() };
  }
  return null;
};

export const createProperty = async (propertyData, imageFile) => {
  if (!db) {
    console.error('Firestore not initialized');
    throw new Error('Firestore not initialized');
  }
  
  try {
    let imageUrl = '';
    if (imageFile) {
      const storageRef = ref(storage, `properties/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const propertyWithImage = {
      title: propertyData.title || '',
      description: propertyData.description || '',
      location: propertyData.location || '',
      price: parseFloat(propertyData.price) || 0,
      propertyType: propertyData.propertyType || 'house',
      category: propertyData.category || 'residential',
      bedrooms: parseInt(propertyData.bedrooms) || 0,
      bathrooms: parseInt(propertyData.bathrooms) || 0,
      area: parseFloat(propertyData.area) || 0,
      status: propertyData.status || 'Open',
      installmentPlan: propertyData.installmentPlan || '5',
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'properties'), propertyWithImage);
    
    // Update stats
    await updateDashboardStats();
    
    return { id: docRef.id, ...propertyWithImage };
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

export const updateProperty = async (propertyId, updates) => {
  if (!db || !propertyId) {
    console.error('Firestore not initialized or missing propertyId');
    throw new Error('Firestore not initialized or missing propertyId');
  }
  
  const propertyRef = doc(db, 'properties', propertyId);
  await updateDoc(propertyRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  // Update stats
  await updateDashboardStats();
};

export const deleteProperty = async (propertyId) => {
  if (!db || !propertyId) {
    console.error('Firestore not initialized or missing propertyId');
    throw new Error('Firestore not initialized or missing propertyId');
  }
  
  const propertyRef = doc(db, 'properties', propertyId);
  await deleteDoc(propertyRef);
  
  // Update stats
  await updateDashboardStats();
};

// ========== CONTRACT MANAGEMENT ==========
export const createContract = async (contractData) => {
  if (!db) {
    console.error('Firestore not initialized');
    throw new Error('Firestore not initialized');
  }
  
  const contractsRef = collection(db, 'contracts');
  
  const contractToCreate = {
    ...contractData,
    status: 'active',
    amountPaid: contractData.amountPaid || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(contractsRef, contractToCreate);
  
  // Update user's active contracts count
  if (contractData.buyerId) {
    const userRef = doc(db, 'users', contractData.buyerId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentContracts = userDoc.data().activeContracts || 0;
      await updateDoc(userRef, {
        activeContracts: currentContracts + 1,
        updatedAt: serverTimestamp()
      });
    }
  }
  
  // Update dashboard stats
  await updateDashboardStats();
  
  return { id: docRef.id, ...contractToCreate };
};

export const getUserContracts = async (userId) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return [];
  }
  
  const contractsRef = collection(db, 'contracts');
  const q = query(contractsRef, where('buyerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    totalAmount: doc.data().totalAmount || 0,
    amountPaid: doc.data().amountPaid || 0
  }));
};

export const updateContract = async (contractId, updates) => {
  if (!db || !contractId) {
    console.error('Firestore not initialized or missing contractId');
    throw new Error('Firestore not initialized or missing contractId');
  }
  
  const contractRef = doc(db, 'contracts', contractId);
  await updateDoc(contractRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  // Update dashboard stats
  await updateDashboardStats();
};

// ========== TRANSACTION MANAGEMENT ==========
export const createTransaction = async (transactionData) => {
  if (!db) {
    console.error('Firestore not initialized');
    throw new Error('Firestore not initialized');
  }
  
  const transactionsRef = collection(db, 'transactions');
  
  const transactionToCreate = {
    ...transactionData,
    status: transactionData.status || 'completed',
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp()
  };
  
  // Use batch write for atomic operations
  const batch = writeBatch(db);
  const transactionRef = doc(transactionsRef);
  
  batch.set(transactionRef, transactionToCreate);
  
  // If this is a deposit, update user's total deposits
  if (transactionData.type === 'deposit') {
    const userId = transactionData.userId;
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentDeposits = userDoc.data().totalDeposits || 0;
      batch.update(userRef, {
        totalDeposits: currentDeposits + (transactionData.amount || 0),
        updatedAt: serverTimestamp()
      });
    } else {
      batch.set(userRef, {
        uid: userId,
        email: transactionData.userEmail || '',
        totalDeposits: transactionData.amount || 0,
        activeContracts: 0,
        totalInvested: 0,
        pendingPayments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
  
  // If this is an installment, update contract
  if (transactionData.type === 'installment' && transactionData.contractId) {
    const contractRef = doc(db, 'contracts', transactionData.contractId);
    const contractDoc = await getDoc(contractRef);
    
    if (contractDoc.exists()) {
      const contractData = contractDoc.data();
      const newAmountPaid = (contractData.amountPaid || 0) + (transactionData.amount || 0);
      
      // Update installment status
      const updatedInstallments = contractData.installments?.map(installment => {
        if (installment.id === transactionData.installmentId) {
          return { 
            ...installment, 
            status: 'paid', 
            paidAt: new Date().toISOString().split('T')[0] 
          };
        }
        return installment;
      }) || [];
      
      batch.update(contractRef, {
        amountPaid: newAmountPaid,
        installments: updatedInstallments,
        updatedAt: serverTimestamp()
      });
      
      // Update user's total invested
      const userRef = doc(db, 'users', transactionData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentInvested = userDoc.data().totalInvested || 0;
        batch.update(userRef, {
          totalInvested: currentInvested + (transactionData.amount || 0),
          updatedAt: serverTimestamp()
        });
      }
    }
  }
  
  await batch.commit();
  
  // Update dashboard stats
  await updateDashboardStats();
  
  return { id: transactionRef.id, ...transactionToCreate };
};

export const getUserTransactions = async (userId) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return [];
  }
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      amount: data.amount || 0,
      timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
    };
  });
};

export const getAllTransactions = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return [];
  }
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      amount: data.amount || 0,
      timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
    };
  });
};

// ========== INSTALLMENT MANAGEMENT ==========
export const createInstallmentPlan = async (contractId, propertyId, totalAmount, paymentType) => {
  if (!db || !contractId) {
    console.error('Firestore not initialized or missing contractId');
    throw new Error('Firestore not initialized or missing contractId');
  }
  
  const installments = [];
  const installmentCount = 5; // Always 5 installments
  
  if (paymentType === 'installment') {
    const installmentAmount = totalAmount / installmentCount;
    const currentDate = new Date();
    
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      installments.push({
        id: `inst-${Date.now()}-${i}`,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: i === 0 ? 'pending' : 'upcoming',
        paidAt: null,
        createdAt: new Date().toISOString()
      });
    }
    
    // Update contract with installments
    const contractRef = doc(db, 'contracts', contractId);
    await updateDoc(contractRef, {
      installments,
      paymentType: 'installment',
      totalAmount: totalAmount,
      propertyId,
      amountPaid: 0,
      updatedAt: serverTimestamp()
    });
  }
  
  return installments;
};

// ========== VEHICLE MANAGEMENT ==========
export const getAllVehicles = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return [];
  }
  
  const vehiclesRef = collection(db, 'vehicles');
  const snapshot = await getDocs(vehiclesRef);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    price: doc.data().price || 0,
    status: doc.data().status || 'available'
  }));
};

export const getVehicleById = async (vehicleId) => {
  if (!db || !vehicleId) {
    console.error('Firestore not initialized or missing vehicleId');
    return null;
  }
  
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (vehicleDoc.exists()) {
    return { id: vehicleDoc.id, ...vehicleDoc.data() };
  }
  return null;
};

export const createVehicle = async (vehicleData, imageFile) => {
  if (!db) {
    console.error('Firestore not initialized');
    throw new Error('Firestore not initialized');
  }
  
  try {
    let imageUrl = '';
    if (imageFile) {
      const storageRef = ref(storage, `vehicles/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const vehicleWithImage = {
      brand: vehicleData.brand || '',
      model: vehicleData.model || '',
      year: parseInt(vehicleData.year) || 2024,
      price: parseFloat(vehicleData.price) || 0,
      mileage: parseFloat(vehicleData.mileage) || 0,
      fuelType: vehicleData.fuelType || 'petrol',
      transmission: vehicleData.transmission || 'manual',
      vehicleType: vehicleData.vehicleType || 'car',
      status: vehicleData.status || 'available',
      color: vehicleData.color || '',
      description: vehicleData.description || '',
      location: vehicleData.location || '',
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'vehicles'), vehicleWithImage);
    
    // Update stats
    await updateDashboardStats();
    
    return { id: docRef.id, ...vehicleWithImage };
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
};

// ========== DASHBOARD STATS FUNCTIONS ==========
export const getAdminStats = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return {
      totalProperties: 0,
      totalUsers: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      activeUsers: 0,
      totalDeposits: 0,
      averagePrice: 0,
      activeContracts: 0,
      totalInvested: 0,

      totalVehicles: 0, 
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Get all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    totalDeposits: doc.data().totalDeposits || 0
  }));
  
  // Get all contracts
  const contractsSnapshot = await getDocs(collection(db, 'contracts'));
  const contracts = contractsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    amountPaid: doc.data().amountPaid || 0
  }));

    // Get all vehicles
  const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
  const vehicles = vehiclesSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    price: doc.data().price || 0
  }));
  
  // Get all properties
  const propertiesSnapshot = await getDocs(collection(db, 'properties'));
  const properties = propertiesSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    price: doc.data().price || 0
  }));
  
  // Calculate stats
  const totalUsers = users.length;
  const totalProperties = properties.length;
  
  const totalRevenue = contracts.reduce((sum, contract) => sum + (contract.amountPaid || 0), 0);
  const totalDeposits = users.reduce((sum, user) => sum + (user.totalDeposits || 0), 0);
  
  const pendingPayments = contracts.reduce((sum, contract) => {
    const pending = contract.installments?.filter(i => i.status === 'pending').length || 0;
    return sum + pending;
  }, 0);
  
  const activeUsers = users.filter(user => user.totalDeposits > 0).length;
  
  const averagePrice = properties.length > 0 
    ? properties.reduce((sum, prop) => sum + (prop.price || 0), 0) / properties.length 
    : 0;

  // Get active contracts count
  const activeContracts = contracts.filter(contract => contract.status === 'active').length;
  
  // Get total invested
  const totalInvested = contracts.reduce((sum, contract) => sum + (contract.amountPaid || 0), 0);
  const totalVehicles = vehicles.length;
  return {
    totalProperties,
    totalUsers,
    totalRevenue,
    pendingPayments,
    activeUsers,
    totalDeposits,
    averagePrice,
    activeContracts,
    totalInvested,
    totalVehicles, 
    lastUpdated: new Date().toISOString()
  };
};

// Update dashboard stats globally
export const updateDashboardStats = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }
  
  const stats = await getAdminStats();
  
  // Update a global stats document if needed
  const statsRef = doc(db, 'stats', 'global');
  await setDoc(statsRef, {
    ...stats,
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return stats;
};

// Get user dashboard stats
export const getUserDashboardStats = async (userId) => {
  if (!db || !userId) {
    console.error('Firestore not initialized or missing userId');
    return {
      totalDeposits: 0,
      activeContracts: 0,
      totalInvested: 0,
      pendingPayments: 0,
      contracts: [],
      transactions: []
    };
  }
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.exists() ? userDoc.data() : {};
  
  const contracts = await getUserContracts(userId);
  const transactions = await getUserTransactions(userId);
  
  const totalDeposits = userData.totalDeposits || 0;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const totalInvested = contracts.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
  const pendingPayments = contracts.reduce((sum, c) => {
    const pending = c.installments?.filter(i => i.status === 'pending').length || 0;
    return sum + pending;
  }, 0);
  
  return {
    totalDeposits,
    activeContracts,
    totalInvested,
    pendingPayments,
    contracts,
    transactions
  };
};

// Real-time stats listener for admin
export const listenToStats = (callback) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }
  
  const statsRef = doc(db, 'stats', 'global');
  
  return onSnapshot(statsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      // If stats document doesn't exist, create it
      updateDashboardStats();
    }
  });
};