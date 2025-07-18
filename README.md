# 💕 KINDRED

Kindred est une messagerie ultra-privée, chiffrée de bout en bout, qui offre à votre couple un espace exclusif pour dialoguer, planifier et conserver vos souvenirs en toute sécurité.

![Kindred App](https://img.shields.io/badge/React%20Native-Expo-blue)
![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)

## ✨ Fonctionnalités

### 💬 **Chat Principal avec Topics**
- Interface de messagerie moderne avec dégradés
- **Compteur de fidélité** : affiche les jours ensemble et le streak quotidien
- **Topics glissants** : Général, Voyage, Budget, Idées Surprises, Plans, Rêves
- Messages en temps réel avec design moderne

### 🔒 **Coffre Sensible**
- Photos qui **disparaissent automatiquement après 24h**
- **Protection par code secret** (4-6 chiffres) partagé
- Interface verrouillée avec déverrouillage sécurisé
- Compteur temps restant pour chaque photo

### 📖 **Journal Partagé**
- Conservation des **photos marquantes, souvenirs, messages forts**
- Catégories : Étapes, Aventures, Amour, Drôle, Spécial
- Interface d'ajout complète avec sélection de photos

### 📅 **Calendrier Collaboratif**
- **Planification d'anniversaires, rendez-vous et projets**
- Types d'événements avec couleurs personnalisées
- Événements récurrents annuels
- Compteur de jours jusqu'aux événements

### 🎯 **Objectifs à Deux**
- **Fixez des défis partagés** avec suivi des progrès
- Catégories : Finance, Santé, Loisirs, Voyage, Maison
- Barres de progression visuelles

### 📊 **Mini-Sondages Express**
- **Prenez des décisions à deux** de façon ludique
- Création de sondages personnalisés
- Système de votes avec résultats visuels

## 🛠️ Installation

### Prérequis
- Node.js (v16 ou plus récent)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Un projet Firebase configuré

### 1. Cloner le repository
```bash
git clone https://github.com/Frejustedev/KINDRED.git
cd KINDRED
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration Firebase

#### Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Activez **Authentication** avec Email/Password
4. Activez **Firestore Database**

#### Configurer les clés Firebase
1. Dans votre projet Firebase, allez dans **Paramètres du projet**
2. Dans l'onglet **Général**, ajoutez une application Web
3. Copiez les clés de configuration
4. Remplacez les valeurs dans `src/config/firebase.js` :

```javascript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};
```

#### Configurer Firestore
1. Dans Firebase Console, allez dans **Firestore Database**
2. Créez la base de données en mode **test** pour commencer
3. Les collections seront créées automatiquement :
   - `users` : Informations des utilisateurs
   - `couples` : Données des couples
   - `messages` : Messages du chat (à implémenter)

### 4. Lancer l'application
```bash
npm start
```

Scannez le QR code avec **Expo Go** sur votre téléphone ou utilisez un émulateur.

## 🎨 Design & UX

- **Interface ultra-moderne** avec dégradés et animations
- **Couleurs romantiques** : roses, violets, bleus
- **Icônes cohérentes** avec Ionicons
- **Ombres et élévations** pour la profondeur
- **Typography soignée** et navigation intuitive

## 🔐 Sécurité & Confidentialité

- ✅ **Chiffrement de bout en bout** Firebase
- ✅ **Code secret commun** pour le coffre sensible
- ✅ **Photos auto-destructrices** après 24h
- ✅ **Limite stricte à 2 personnes** par couple
- ✅ **Espace numérique exclusif** protégé

## 📱 Technologies

- **Frontend** : React Native + Expo
- **Navigation** : React Navigation v6
- **Backend** : Firebase (Auth + Firestore)
- **Styling** : StyleSheet + LinearGradient
- **Icons** : Expo Vector Icons

## 🚀 Structure du Projet

```
KINDRED/
├── src/
│   ├── config/
│   │   └── firebase.js          # Configuration Firebase
│   ├── context/
│   │   └── AuthContext.js       # Gestion de l'authentification
│   ├── screens/
│   │   ├── auth/               # Écrans d'authentification
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── CoupleSetupScreen.js
│   │   ├── ChatScreen.js       # Chat principal avec Topics
│   │   ├── VaultScreen.js      # Coffre sensible
│   │   ├── JournalScreen.js    # Journal partagé
│   │   ├── CalendarScreen.js   # Calendrier collaboratif
│   │   └── ProfileScreen.js    # Profil et paramètres
│   └── components/             # Composants réutilisables
├── assets/                     # Images et icônes
├── App.js                      # Point d'entrée principal
└── package.json
```

## 👥 Utilisation

### Premier lancement
1. **Créer un compte** avec email/mot de passe
2. **Configurer votre couple** :
   - Créer un nouveau couple (génère un code d'invitation)
   - OU rejoindre un couple existant avec le code
3. **Définir le code secret commun** (4-6 chiffres)
4. **Commencer à utiliser l'application** !

### Fonctionnalités principales
- **Chat** : Communiquez par Topics pour organiser vos conversations
- **Coffre** : Partagez des photos intimes qui disparaissent après 24h
- **Journal** : Conservez vos plus beaux souvenirs ensemble
- **Calendrier** : Planifiez vos événements et anniversaires
- **Profil** : Gérez vos objectifs et sondages

## 🔄 Roadmap

- [ ] Messages en temps réel avec WebSocket
- [ ] Notifications push
- [ ] Sauvegarde automatique des photos
- [ ] Mode sombre complet
- [ ] Partage de localisation temporaire
- [ ] Jeux de couple intégrés

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 💖 Créé avec amour

Kindred est conçu pour les couples qui veulent un espace numérique privé et sécurisé pour cultiver leur relation.

---

**Made with ❤️ for couples everywhere** 