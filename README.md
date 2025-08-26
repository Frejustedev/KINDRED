# Kindred - Application de Couple

Une application mobile complète pour couples, construite avec React Native et Expo, offrant des fonctionnalités de communication sécurisée, de partage de moments et de gestion de couple.

## 🚀 Fonctionnalités

### 💬 Communication
- **Chat en temps réel** avec messages chiffrés
- **Topics de conversation** (général, voyage, budget, surprises)
- **Réactions aux messages** avec emojis
- **Statut de lecture** des messages

### 📅 Organisation
- **Calendrier partagé** avec événements
- **Journal intime** avec humeurs et tags
- **Gestion de budget** commune
- **Capsules temporelles** (messages pour le futur)

### 🔒 Sécurité
- **Coffre sensible** pour médias auto-destructifs (24h)
- **Chiffrement** des messages et données sensibles
- **Authentification** Firebase sécurisée
- **Codes PIN** pour l'accès au couple

### 📱 Interface
- **Design moderne** avec gradients et animations
- **Navigation intuitive** par onglets
- **Thème cohérent** dans toute l'application
- **Responsive** pour tous les écrans

## 🛠️ Technologies

- **React Native** avec Expo SDK 53
- **TypeScript** pour la sécurité des types
- **Firebase** (Auth, Firestore, Storage)
- **React Navigation** pour la navigation
- **Expo Linear Gradient** pour les effets visuels
- **Expo Notifications** pour les alertes
- **Expo Image Picker** pour la sélection de médias

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI
- Compte Firebase
- Appareil mobile ou émulateur

## 🔧 Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd kindred-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Firebase**
   - Créer un projet Firebase
   - Activer Authentication, Firestore et Storage
   - Copier les clés de configuration dans `src/config/firebase.ts`

4. **Déployer les règles Firestore**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Lancer l'application**
   ```bash
   npx expo start
   ```

## 📱 Utilisation

### Première utilisation
1. **Créer un compte** avec email/mot de passe
2. **Créer ou rejoindre un couple** avec code d'invitation
3. **Configurer le PIN** de sécurité
4. **Personnaliser les paramètres** de notification

### Fonctionnalités principales
- **Messages** : Chat en temps réel avec votre partenaire
- **Calendrier** : Planifiez vos événements ensemble
- **Journal** : Partagez vos moments et humeurs
- **Budget** : Gérez vos finances communes
- **Coffre** : Partagez des médias sensibles (auto-destructifs)
- **Capsules** : Créez des messages pour le futur

## 🔐 Sécurité

- **Chiffrement** : Tous les messages sensibles sont chiffrés
- **Authentification** : Firebase Auth avec validation email
- **Autorisations** : Règles Firestore strictes par couple
- **TTL** : Suppression automatique des médias sensibles
- **PIN** : Protection supplémentaire pour l'accès au couple

## 📊 Architecture

```
src/
├── components/          # Composants réutilisables
├── config/             # Configuration Firebase
├── constants/          # Constantes et thèmes
├── hooks/              # Hooks personnalisés
├── navigation/         # Configuration de navigation
├── screens/            # Écrans de l'application
│   ├── auth/          # Authentification
│   ├── main/          # Écrans principaux
│   └── settings/      # Paramètres
├── services/           # Services métier
│   ├── encryption/    # Chiffrement
│   ├── firebase/      # Services Firebase
│   └── notifications/ # Notifications
├── store/             # État global (si nécessaire)
├── types/             # Types TypeScript
└── utils/             # Utilitaires
```

## 🚀 Déploiement

### Development Build
```bash
npx expo install expo-dev-client
eas build --profile development --platform all
```

### Production Build
```bash
eas build --profile production --platform all
```

### Publication
```bash
eas submit --platform all
```

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env` :
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Configuration Firebase
1. Activer Authentication (Email/Password)
2. Créer une base Firestore avec les règles fournies
3. Configurer Storage avec les règles de sécurité
4. Activer les notifications push

## 📈 Fonctionnalités avancées

### Notifications
- Notifications push pour nouveaux messages
- Rappels d'événements du calendrier
- Notifications de capsules temporelles
- Rappels quotidiens personnalisables

### Médias
- Upload d'images et vidéos
- Compression automatique
- Stockage sécurisé
- Suppression automatique (coffre)

### Statistiques
- Nombre de messages échangés
- Streak de communication
- Jours ensemble
- Activité du couple

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation Firebase
- Vérifier les logs Expo

## 🔮 Roadmap

- [ ] Mode sombre
- [ ] Support multilingue
- [ ] Intégration calendrier externe
- [ ] Rappels vocaux
- [ ] Mode hors ligne
- [ ] Sauvegarde locale
- [ ] Widgets iOS/Android
- [ ] Intégration Apple Health/Google Fit

---

**Kindred** - Connectez-vous plus profondément avec votre partenaire 💕
