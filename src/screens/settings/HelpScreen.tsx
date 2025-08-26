import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Ionicons } from '@expo/vector-icons';

interface HelpScreenProps {
  navigation: any;
}

interface FAQItem {
  question: string;
  answer: string;
  icon: string;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "Comment créer un compte ?",
      answer: "Pour créer un compte, cliquez sur 'Créer un compte' sur l'écran de connexion. Remplissez votre email, mot de passe et prénom. Un email de vérification vous sera envoyé pour activer votre compte.",
      icon: "person-add-outline"
    },
    {
      question: "Comment inviter mon partenaire ?",
      answer: "Allez dans 'Paramètres' > 'Informations du couple' et cliquez sur 'Inviter mon partenaire'. Un code d'invitation sera généré que vous pouvez partager avec votre partenaire.",
      icon: "people-outline"
    },
    {
      question: "Comment ajouter des dates marquantes ?",
      answer: "Sur la page d'accueil, cliquez sur 'Dates marquantes' dans la section 'Votre histoire d'amour', puis sur le bouton '+' pour ajouter une nouvelle date importante.",
      icon: "calendar-outline"
    },
    {
      question: "Comment créer un événement dans l'agenda ?",
      answer: "Accédez à l'onglet 'Agenda' et cliquez sur le bouton '+' en bas à droite. Remplissez les détails de votre événement et sauvegardez.",
      icon: "calendar"
    },
    {
      question: "Comment envoyer un message ?",
      answer: "Allez dans l'onglet 'Messages' et sélectionnez une conversation ou créez-en une nouvelle. Tapez votre message et appuyez sur l'icône d'envoi.",
      icon: "chatbubble-outline"
    },
    {
      question: "Comment gérer le budget ?",
      answer: "Dans l'onglet 'Budget', vous pouvez ajouter des transactions, créer des catégories et suivre vos dépenses communes. Utilisez les statistiques pour analyser vos finances.",
      icon: "wallet-outline"
    },
    {
      question: "Comment créer une capsule temporelle ?",
      answer: "Allez dans l'onglet 'Capsules' et cliquez sur '+'. Choisissez une date d'ouverture future et ajoutez votre contenu (texte, photos, etc.).",
      icon: "time-outline"
    },
    {
      question: "Comment utiliser les listes partagées ?",
      answer: "Dans l'onglet 'Organisation' > 'Listes', créez une nouvelle liste et ajoutez des éléments. Votre partenaire pourra voir et modifier la liste en temps réel.",
      icon: "list-outline"
    },
    {
      question: "Comment activer les notifications ?",
      answer: "Allez dans 'Paramètres' > 'Notifications' et activez les types de notifications souhaités. Assurez-vous que les notifications système sont activées sur votre appareil.",
      icon: "notifications-outline"
    },
    {
      question: "Comment changer mon mot de passe ?",
      answer: "Dans 'Paramètres' > 'Sécurité', vous pouvez changer votre mot de passe en fournissant votre mot de passe actuel.",
      icon: "lock-closed-outline"
    }
  ];

  const features = [
    {
      title: "🏠 Page d'Accueil",
      description: "Votre tableau de bord personnel avec un aperçu de votre relation, les actions rapides et votre histoire d'amour.",
      details: [
        "Salutation personnalisée selon l'heure",
        "Actions rapides pour accéder rapidement aux fonctionnalités",
        "Votre histoire d'amour avec les dates marquantes",
        "Statistiques de votre couple",
        "Notifications système des actions de votre partenaire"
      ]
    },
    {
      title: "💬 Messages",
      description: "Communiquez en privé avec votre partenaire avec des messages texte, photos et emojis.",
      details: [
        "Messages en temps réel",
        "Envoi de photos et emojis",
        "Indicateurs de lecture",
        "Historique complet des conversations",
        "Notifications push pour nouveaux messages"
      ]
    },
    {
      title: "📅 Agenda",
      description: "Gérez vos événements et rendez-vous ensemble avec un calendrier partagé.",
      details: [
        "Création d'événements avec titre, description et lieu",
        "Rappels personnalisables",
        "Vue calendrier mensuelle",
        "Événements récurrents",
        "Synchronisation avec votre partenaire"
      ]
    },
    {
      title: "💰 Budget",
      description: "Suivez vos finances communes et gérez vos dépenses partagées.",
      details: [
        "Ajout de transactions avec catégories",
        "Statistiques de dépenses",
        "Catégories personnalisables",
        "Vue mensuelle et annuelle",
        "Partage automatique avec votre partenaire"
      ]
    },
    {
      title: "⏰ Capsules Temporelles",
      description: "Créez des souvenirs pour l'avenir qui s'ouvriront à une date spécifique.",
      details: [
        "Création de capsules avec texte et photos",
        "Date d'ouverture personnalisable",
        "Notifications de rappel",
        "Partage avec votre partenaire",
        "Historique des capsules ouvertes"
      ]
    },
    {
      title: "📝 Notes Collaboratives",
      description: "Prenez des notes ensemble et partagez vos idées en temps réel.",
      details: [
        "Édition collaborative en temps réel",
        "Formatage de texte riche",
        "Historique des modifications",
        "Partage automatique",
        "Recherche dans les notes"
      ]
    },
    {
      title: "📋 Listes Partagées",
      description: "Créez et gérez des listes ensemble (courses, tâches, etc.).",
      details: [
        "Listes avec éléments cochables",
        "Ajout/suppression en temps réel",
        "Catégorisation des listes",
        "Partage automatique",
        "Notifications de mises à jour"
      ]
    },
    {
      title: "🎯 Dates Marquantes",
      description: "Célébrez les moments importants de votre relation avec des dates spéciales.",
      details: [
        "Dates prédéfinies (rencontre, mariage, etc.)",
        "Dates personnalisées",
        "Compteurs de temps (jours, semaines, mois, années)",
        "Notifications de rappel",
        "Historique complet de votre relation"
      ]
    },
    {
      title: "📊 Statistiques",
      description: "Découvrez des statistiques intéressantes sur votre couple.",
      details: [
        "Temps passé ensemble",
        "Nombre de messages échangés",
        "Événements créés",
        "Dates marquantes célébrées",
        "Activité générale du couple"
      ]
    },
    {
      title: "🔔 Notifications",
      description: "Restez informé des activités de votre partenaire en temps réel.",
      details: [
        "Notifications système personnalisées",
        "Actions de votre partenaire en temps réel",
        "Historique des activités",
        "Marquage comme lu",
        "Filtrage par type d'activité"
      ]
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const renderFAQItem = (item: FAQItem, index: number) => {
    const isExpanded = expandedFAQ === index;
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.faqItem}
        onPress={() => toggleFAQ(index)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <View style={styles.faqIconContainer}>
            <Ionicons name={item.icon as any} size={20} color={colors.primary} />
          </View>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFeature = (feature: any, index: number) => (
    <View key={index} style={styles.featureCard}>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
      <View style={styles.featureDetails}>
        {feature.details.map((detail: string, detailIndex: number) => (
          <View key={detailIndex} style={styles.detailItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Centre d'Aide"
        icon="help-circle"
        subtitle="Guide complet de Kindred"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.introCard}>
            <Ionicons name="heart" size={48} color={colors.primary} />
            <Text style={styles.introTitle}>Bienvenue sur Kindred</Text>
            <Text style={styles.introDescription}>
              Kindred est votre application de couple complète, conçue pour renforcer votre relation 
              et faciliter votre vie quotidienne ensemble. Découvrez toutes les fonctionnalités 
              disponibles pour créer des moments inoubliables.
            </Text>
          </View>
        </View>

        {/* Fonctionnalités principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Fonctionnalités Principales</Text>
          {features.map(renderFeature)}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Questions Fréquentes</Text>
          {faqData.map(renderFAQItem)}
        </View>

        {/* Conseils d'utilisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Conseils d'Utilisation</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={24} color={colors.warning} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Personnalisez votre expérience</Text>
                <Text style={styles.tipText}>
                  Allez dans les paramètres pour personnaliser les notifications, 
                  le thème et les préférences selon vos besoins.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="sync-outline" size={24} color={colors.info} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Synchronisation automatique</Text>
                <Text style={styles.tipText}>
                  Toutes vos données sont synchronisées en temps réel avec votre partenaire. 
                  Assurez-vous d'avoir une connexion internet stable.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Sécurité et confidentialité</Text>
                <Text style={styles.tipText}>
                  Vos données sont chiffrées et sécurisées. Seul votre partenaire 
                  peut accéder aux informations que vous partagez.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Restez connectés</Text>
                <Text style={styles.tipText}>
                  Activez les notifications pour ne manquer aucune activité 
                  de votre partenaire et rester proches même à distance.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Besoin d'Aide ?</Text>
          <View style={styles.supportCard}>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => Linking.openURL('mailto:support@kindred-app.com')}
            >
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
              <Text style={styles.supportButtonText}>Nous Contacter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => Linking.openURL('https://kindred-app.com/faq')}
            >
              <Ionicons name="globe-outline" size={24} color={colors.primary} />
              <Text style={styles.supportButtonText}>Site Web</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View style={styles.section}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...colors.shadow,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...colors.shadow,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featureDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    ...colors.shadow,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    ...colors.shadow,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
});
