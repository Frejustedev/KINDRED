import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ValidationUtils } from './ValidationUtils';

interface PartnerSearchProps {
  onPartnerSelect: (email: string) => void;
  placeholder?: string;
  style?: any;
}

interface SearchResult {
  email: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
}

export const PartnerSearch: React.FC<PartnerSearchProps> = ({
  onPartnerSelect,
  placeholder = "Rechercher un partenaire...",
  style,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  // Validation en temps réel
  useEffect(() => {
    const validateEmail = ValidationUtils.debounceValidation(
      ValidationUtils.validateEmail,
      300
    );

    if (query) {
      validateEmail(query, (result) => {
        if (!result.isValid) {
          setError(result.error || '');
        } else {
          setError('');
          searchPartners(query);
        }
      });
    } else {
      setError('');
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const searchPartners = async (searchQuery: string) => {
    if (searchQuery.length < 3) return;

    try {
      setLoading(true);
      
      // Simuler une recherche (remplacer par une vraie requête Firestore)
      const mockResults: SearchResult[] = [
        {
          email: 'partenaire1@example.com',
          firstName: 'Marie',
          lastName: 'Dupont',
          isOnline: true,
        },
        {
          email: 'partenaire2@example.com',
          firstName: 'Jean',
          lastName: 'Martin',
          isOnline: false,
        },
        {
          email: 'partenaire3@example.com',
          firstName: 'Sophie',
          lastName: 'Bernard',
          isOnline: true,
        },
      ].filter(partner => 
        partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
      setShowResults(mockResults.length > 0);
      
      // Animation d'apparition
      if (mockResults.length > 0) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (err) {
      console.error('Error searching partners:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSelect = (partner: SearchResult) => {
    onPartnerSelect(partner.email);
    setQuery(partner.email);
    setShowResults(false);
    setResults([]);
  };

  const renderPartnerItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.partnerItem}
      onPress={() => handlePartnerSelect(item)}
    >
      <View style={styles.partnerInfo}>
        <View style={styles.partnerNameContainer}>
          <Text style={styles.partnerName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.isOnline ? colors.success : colors.textSecondary }
          ]} />
        </View>
        <Text style={styles.partnerEmail}>{item.email}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderEmptyResults = () => (
    <View style={styles.emptyResults}>
      <Ionicons name="search" size={40} color={colors.textSecondary} />
      <Text style={styles.emptyText}>Aucun partenaire trouvé</Text>
      <Text style={styles.emptySubtext}>
        Essayez avec un autre email ou nom
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="search"
          />
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.loadingIndicator}
            />
          )}
          {query && !loading && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
                setError('');
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {showResults && (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <FlatList
            data={results}
            renderItem={renderPartnerItem}
            keyExtractor={(item) => item.email}
            ListEmptyComponent={renderEmptyResults}
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
    zIndex: 1001,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingVertical: 8,
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  partnerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
