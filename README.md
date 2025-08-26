# 💕 Kindred - Application pour Couples

Une application mobile complète conçue pour les couples qui souhaitent partager leur vie ensemble de manière sécurisée et organisée.

## 🚀 Fonctionnalités

### 📱 Interface Principale
- **Page d'accueil personnalisée** avec statistiques du couple
- **Actions rapides** pour accéder rapidement aux fonctionnalités
- **Historique d'amour** avec dates marquantes cliquables
- **Notifications système** pour les actions du partenaire

### 💬 Communication
- **Messages privés** chiffrés de bout en bout
- **Sujets de conversation** organisés
- **Réactions et emojis** pour exprimer les sentiments
- **Messages vocaux** et médias partagés

### 📅 Organisation
- **Agenda partagé** avec événements récurrents
- **Notes collaboratives** en temps réel
- **Listes partagées** (courses, tâches, etc.)
- **Capsules temporelles** pour les souvenirs futurs

### 💰 Gestion Financière
- **Budget partagé** avec catégories personnalisées
- **Suivi des dépenses** en temps réel
- **Statistiques** et graphiques de consommation
- **Objectifs financiers** communs

### 🎯 Dates Marquantes
- **Historique d'amour** complet
- **Dates importantes** (rencontre, mariage, etc.)
- **Calcul de durée** en jours, semaines, mois, années
- **Édition et suppression** des dates

### 🔔 Notifications
- **Système de logs** pour toutes les actions
- **Notifications push** pour les événements importants
- **Badge de notifications** non lues
- **Historique d'activité** détaillé

## 🛠️ Technologies Utilisées

- **React Native** avec Expo
- **TypeScript** pour la sécurité du code
- **Firebase** (Firestore, Auth, Storage)
- **React Navigation** pour la navigation
- **AsyncStorage** pour la persistance locale
- **Expo Notifications** pour les push notifications

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Expo CLI
- Compte Firebase
- Compte Expo

## 🚀 Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/frejusteagboton/kindred-app.git
   cd kindred-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuration Firebase**
   - Créer un projet Firebase
   - Configurer Firestore, Auth et Storage
   - Mettre à jour `src/config/firebase.ts` avec vos clés

4. **Configuration Expo**
   ```bash
   expo login
   expo config
   ```

5. **Lancer l'application**
   ```bash
   expo start
   ```

## 🔧 Configuration

### Firebase
1. Créer un projet Firebase
2. Activer Authentication, Firestore et Storage
3. Configurer les règles de sécurité Firestore
4. Ajouter les index nécessaires

### Variables d'environnement
Créer un fichier `.env` à la racine :
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📱 Utilisation

### Création de compte
1. S'inscrire avec email, mot de passe et informations personnelles
2. Vérifier l'email de confirmation
3. Créer ou rejoindre un couple

### Jumelage
- **Créer un couple** : Inviter le partenaire par email
- **Rejoindre un couple** : Utiliser le code d'invitation
- **Sécurité** : Code PIN pour protéger les conversations

### Fonctionnalités principales
- **Messages** : Communication privée et sécurisée
- **Agenda** : Planification d'événements partagés
- **Budget** : Gestion financière commune
- **Notes** : Collaboration en temps réel
- **Capsules** : Messages pour le futur

## 🔒 Sécurité

- **Chiffrement** des messages de bout en bout
- **Authentification** Firebase sécurisée
- **Code PIN** pour les couples
- **Persistance** d'authentification robuste
- **Validation** des données côté client et serveur

## 📊 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── common/         # Composants génériques
│   └── messages/       # Composants de messages
├── config/             # Configuration Firebase
├── constants/          # Constantes et couleurs
├── hooks/              # Hooks personnalisés
├── navigation/         # Navigation de l'app
├── screens/            # Écrans de l'application
│   ├── auth/          # Authentification
│   ├── main/          # Écrans principaux
│   └── settings/      # Paramètres
├── services/           # Services Firebase
└── types/              # Types TypeScript
```

## 🚀 Déploiement

### Build de production
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Publication
```bash
eas submit --platform android
eas submit --platform ios
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Développeur

**Frejuste Agboton**
- Site web : [frejusteagboton.info](https://frejusteagboton.info)
- Version : 1.0 du 26/08/25

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans l'application
- Contacter le support via l'application

## 🎯 Roadmap

- [ ] Support multi-langues
- [ ] Thèmes personnalisables
- [ ] Intégration calendrier externe
- [ ] Export de données
- [ ] Mode hors ligne
- [ ] Widgets pour l'écran d'accueil

---

**Fait avec ❤️ pour les couples du monde entier**
