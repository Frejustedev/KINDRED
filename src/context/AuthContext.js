import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCouple, setCurrentCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Générer un code couple unique
  const generateCoupleCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Créer un compte utilisateur
  const signup = async (email, password, firstName, lastName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Mettre à jour le profil utilisateur
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        createdAt: new Date(),
        coupleId: null,
        isInCouple: false,
        profilePicture: null,
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Connexion utilisateur
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Créer un nouveau couple
  const createCouple = async (coupleName, secretCode) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');

    try {
      const coupleCode = generateCoupleCode();
      const coupleId = `couple_${Date.now()}`;

      // Créer le document couple
      await setDoc(doc(db, 'couples', coupleId), {
        id: coupleId,
        name: coupleName,
        secretCode: secretCode,
        inviteCode: coupleCode,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        members: [currentUser.uid],
        memberCount: 1,
        startDate: new Date(),
        isActive: true,
      });

      // Mettre à jour l'utilisateur
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coupleId: coupleId,
        isInCouple: true,
        role: 'creator',
      });

      // Sauvegarder le code localement
      // await AsyncStorage.setItem('coupleSecretCode', secretCode);
      // await AsyncStorage.setItem('coupleId', coupleId);

      // Charger les données du couple
      await loadCoupleData(coupleId);

      return { coupleId, inviteCode: coupleCode };
    } catch (error) {
      throw error;
    }
  };

  // Rejoindre un couple existant
  const joinCouple = async (inviteCode, secretCode) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');

    try {
      // Chercher le couple avec le code d'invitation
      const couplesRef = collection(db, 'couples');
      const q = query(couplesRef, where('inviteCode', '==', inviteCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Code d\'invitation invalide');
      }

      const coupleDoc = querySnapshot.docs[0];
      const coupleData = coupleDoc.data();

      // Vérifier le code secret
      if (coupleData.secretCode !== secretCode) {
        throw new Error('Code secret incorrect');
      }

      // Vérifier que le couple n'a qu'un seul membre
      if (coupleData.memberCount >= 2) {
        throw new Error('Ce couple est déjà complet');
      }

      const coupleId = coupleDoc.id;

      // Ajouter l'utilisateur au couple
      await updateDoc(doc(db, 'couples', coupleId), {
        members: [...coupleData.members, currentUser.uid],
        memberCount: coupleData.memberCount + 1,
      });

      // Mettre à jour l'utilisateur
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coupleId: coupleId,
        isInCouple: true,
        role: 'member',
      });

      // Sauvegarder le code localement
      // await AsyncStorage.setItem('coupleSecretCode', secretCode);
      // await AsyncStorage.setItem('coupleId', coupleId);

      // Charger les données du couple
      await loadCoupleData(coupleId);

      return coupleId;
    } catch (error) {
      throw error;
    }
  };

  // Charger les données du couple
  const loadCoupleData = async (coupleId) => {
    try {
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (coupleDoc.exists()) {
        const coupleData = coupleDoc.data();
        setCurrentCouple(coupleData);

        // Calculer les jours ensemble
        const startDate = coupleData.startDate.toDate();
        const today = new Date();
        const daysTimeTogether = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        setCurrentCouple(prev => ({
          ...prev,
          daysTogether: daysTimeTogether,
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du couple:', error);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await signOut(auth);
      // await AsyncStorage.removeItem('coupleSecretCode');
      // await AsyncStorage.removeItem('coupleId');
      setCurrentUser(null);
      setCurrentCouple(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  // Charger les données utilisateur depuis Firestore
  const loadUserData = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser({ ...user, ...userData });

        // Si l'utilisateur est dans un couple, charger les données du couple
        if (userData.coupleId) {
          await loadCoupleData(userData.coupleId);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  // Surveiller l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserData(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setCurrentCouple(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    currentCouple,
    isAuthenticated,
    loading,
    signup,
    login,
    logout,
    createCouple,
    joinCouple,
    loadCoupleData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 