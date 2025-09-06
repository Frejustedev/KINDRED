import React, { useEffect } from 'react';
import { CouplingWizardScreen } from './CouplingWizardScreen';

interface CouplingScreenProps {
  navigation: any;
}

export const CouplingScreen: React.FC<CouplingScreenProps> = ({ navigation }) => {
  useEffect(() => {
    // Rediriger automatiquement vers le wizard
    navigation.replace('CouplingWizard');
  }, [navigation]);

  // Retourner le wizard directement
  return <CouplingWizardScreen navigation={navigation} />;
};
