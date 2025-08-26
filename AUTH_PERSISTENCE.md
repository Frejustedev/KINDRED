# 🔐 Persistance d'Authentification Profonde - Kindred

## 📋 Vue d'ensemble

La persistance d'authentification dans Kindred utilise une approche multi-couches pour garantir que les utilisateurs restent connectés même après la fermeture de l'application.

## 🏗️ Architecture

### 1. **Firebase Auth avec React Native Persistence**
- Utilise `getReactNativePersistence(AsyncStorage)` pour la persistance native
- Configuration dans `src/config/firebase.ts`
- Fallback vers `browserLocalPersistence` en cas d'erreur

### 2. **Stockage Local AsyncStorage**
- **Profil utilisateur** : `@kindred/user_profile`
- **ID du couple** : `@kindred/couple_id`
- **Hash du PIN** : `@kindred/pin_hash`
- **Métadonnées de session** : `@kindred/session_metadata`
- **Statut de persistance** : `@kindred/auth_persistence`
- **Flags de reconnexion** : `@kindred/needs_reconnect`, `@kindred/reconnecting`

## 🔄 Flux d'Initialisation

### 1. **Démarrage de l'application**
```typescript
// Dans useAuth.tsx
const initializeAuth = async () => {
  // 1. Initialiser la persistance Firebase
  await AuthService.initializeAuthPersistence();
  
  // 2. Vérifier l'état d'authentification
  const { user, profile } = await AuthService.checkAuthState();
  
  // 3. Restaurer l'état si nécessaire
  if (user && profile) {
    setUser(user);
    setProfile(profile);
  }
}
```

### 2. **Vérification de l'état**
```typescript
// Dans AuthService.checkAuthState()
const persistenceStatus = await this.getAuthPersistenceStatus();
const currentUser = auth.currentUser;

if (currentUser) {
  // Utilisateur connecté via Firebase
  const profile = await this.getUserProfile(currentUser.uid);
  return { user: currentUser, profile };
} else if (persistenceStatus.hasLocalProfile) {
  // Profil local disponible, marquer pour reconnexion
  await AsyncStorage.setItem('@kindred/needs_reconnect', 'true');
  return { user: null, profile: localProfile };
}
```

## 🛠️ Méthodes Principales

### **initializeAuthPersistence()**
- Configure la persistance React Native
- Sauvegarde les métadonnées de configuration
- Gère les erreurs avec fallback

### **checkAuthState()**
- Vérifie l'état Firebase et local
- Restaure les sessions interrompues
- Gère la reconnexion automatique

### **forceAuthPersistence()**
- Force la réinitialisation de la persistance
- Tente la reconnexion automatique si nécessaire
- Nettoie les flags de reconnexion

### **getAuthPersistenceStatus()**
- Retourne le statut complet de la persistance
- Inclut les métadonnées de session
- Indique si une reconnexion est nécessaire

## 🔧 Configuration

### **Firebase Config** (`src/config/firebase.ts`)
```typescript
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}
```

### **AsyncStorage Keys**
```typescript
private static readonly STORAGE_KEYS = {
  USER_PROFILE: '@kindred/user_profile',
  COUPLE_ID: '@kindred/couple_id',
  PIN_HASH: '@kindred/pin_hash',
  AUTH_PERSISTENCE: '@kindred/auth_persistence',
};
```

## 🚀 Fonctionnalités Avancées

### **Reconnexion Automatique**
- Détection des sessions interrompues
- Restauration automatique du profil
- Gestion des erreurs de réseau

### **Métadonnées de Session**
```typescript
{
  lastLogin: "2024-01-15T10:30:00.000Z",
  userId: "user123",
  email: "user@example.com",
  emailVerified: true
}
```

### **Nettoyage Complet**
- Suppression de toutes les données lors de la déconnexion
- Nettoyage des métadonnées de session
- Réinitialisation des flags de reconnexion

## 🔍 Debugging

### **Logs de Debug**
```typescript
console.log('Auth persistence initialized - React Native persistence with AsyncStorage');
console.log('Persistence status:', persistenceStatus);
console.log('Attempting automatic reconnection...');
```

### **Statut de Persistance**
```typescript
{
  isActive: true,
  hasLocalProfile: true,
  hasCurrentUser: true,
  hasSessionMetadata: true,
  needsReconnect: false,
  lastLogin: "2024-01-15T10:30:00.000Z"
}
```

## 🛡️ Sécurité

### **Gestion des Erreurs**
- Fallback vers la persistance par défaut
- Nettoyage automatique des données corrompues
- Logs détaillés pour le debugging

### **Validation des Données**
- Vérification de l'intégrité des profils locaux
- Validation des métadonnées de session
- Gestion des données manquantes

## 📱 Utilisation

### **Dans les Composants**
```typescript
const { user, profile, isLoading } = useAuth();

if (isLoading) {
  return <LoadingScreen />;
}

if (!user) {
  return <LoginScreen />;
}
```

### **Forcer la Persistance**
```typescript
await AuthService.forceAuthPersistence();
```

### **Vérifier le Statut**
```typescript
const status = await AuthService.getAuthPersistenceStatus();
console.log('Persistence active:', status.isActive);
```

## 🔄 Cycle de Vie

1. **Installation** → Configuration de la persistance
2. **Première connexion** → Sauvegarde du profil et métadonnées
3. **Fermeture de l'app** → Persistance automatique via Firebase
4. **Réouverture** → Restauration automatique de la session
5. **Déconnexion** → Nettoyage complet des données

## 🎯 Avantages

- ✅ **Persistance robuste** : Multi-couches avec fallback
- ✅ **Reconnexion automatique** : Gestion des sessions interrompues
- ✅ **Performance optimisée** : Chargement rapide des profils locaux
- ✅ **Sécurité renforcée** : Validation et nettoyage automatique
- ✅ **Debugging facilité** : Logs détaillés et statuts complets
