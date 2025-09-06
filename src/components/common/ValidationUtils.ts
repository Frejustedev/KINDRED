// Utilitaires de validation pour l'interface utilisateur

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationUtils {
  // Validation d'email
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, error: 'L\'email est requis' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format d\'email invalide' };
    }

    // Vérifications supplémentaires
    if (email.length > 254) {
      return { isValid: false, error: 'L\'email est trop long' };
    }

    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) {
      return { isValid: false, error: 'La partie locale de l\'email est trop longue' };
    }

    if (domain.length > 253) {
      return { isValid: false, error: 'Le domaine de l\'email est trop long' };
    }

    return { isValid: true };
  }

  // Validation de PIN
  static validatePIN(pin: string): ValidationResult {
    if (!pin) {
      return { isValid: false, error: 'Le PIN est requis' };
    }

    if (pin.length !== 4) {
      return { isValid: false, error: 'Le PIN doit contenir exactement 4 chiffres' };
    }

    if (!/^\d+$/.test(pin)) {
      return { isValid: false, error: 'Le PIN ne doit contenir que des chiffres' };
    }

    // Vérifier que ce n'est pas un PIN trop simple
    if (pin === '0000' || pin === '1111' || pin === '1234' || pin === '4321') {
      return { isValid: false, error: 'Le PIN ne peut pas être trop simple' };
    }

    return { isValid: true };
  }

  // Validation de confirmation de PIN
  static validateConfirmPIN(confirmPin: string, pin: string): ValidationResult {
    if (!confirmPin) {
      return { isValid: false, error: 'La confirmation du PIN est requise' };
    }

    if (confirmPin !== pin) {
      return { isValid: false, error: 'Les PIN ne correspondent pas' };
    }

    return { isValid: true };
  }

  // Validation de code d'invitation
  static validateInviteCode(code: string): ValidationResult {
    if (!code) {
      return { isValid: false, error: 'Le code d\'invitation est requis' };
    }

    if (code.length < 6) {
      return { isValid: false, error: 'Le code d\'invitation doit contenir au moins 6 caractères' };
    }

    if (code.length > 20) {
      return { isValid: false, error: 'Le code d\'invitation est trop long' };
    }

    // Vérifier que le code contient des caractères valides
    if (!/^[A-Za-z0-9]+$/.test(code)) {
      return { isValid: false, error: 'Le code d\'invitation ne peut contenir que des lettres et chiffres' };
    }

    return { isValid: true };
  }

  // Validation de nom
  static validateName(name: string, fieldName: string = 'Nom'): ValidationResult {
    if (!name) {
      return { isValid: false, error: `${fieldName} est requis` };
    }

    if (name.length < 2) {
      return { isValid: false, error: `${fieldName} doit contenir au moins 2 caractères` };
    }

    if (name.length > 50) {
      return { isValid: false, error: `${fieldName} est trop long` };
    }

    // Vérifier que le nom ne contient que des caractères valides
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
      return { isValid: false, error: `${fieldName} contient des caractères invalides` };
    }

    return { isValid: true };
  }

  // Validation d'âge
  static validateAge(age: number): ValidationResult {
    if (!age || age <= 0) {
      return { isValid: false, error: 'L\'âge doit être un nombre positif' };
    }

    if (age < 13) {
      return { isValid: false, error: 'Vous devez avoir au moins 13 ans' };
    }

    if (age > 120) {
      return { isValid: false, error: 'L\'âge semble invalide' };
    }

    return { isValid: true };
  }

  // Validation de mot de passe
  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, error: 'Le mot de passe est requis' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Le mot de passe est trop long' };
    }

    // Vérifier la complexité
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return { 
        isValid: false, 
        error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' 
      };
    }

    return { isValid: true };
  }

  // Validation de confirmation de mot de passe
  static validateConfirmPassword(confirmPassword: string, password: string): ValidationResult {
    if (!confirmPassword) {
      return { isValid: false, error: 'La confirmation du mot de passe est requise' };
    }

    if (confirmPassword !== password) {
      return { isValid: false, error: 'Les mots de passe ne correspondent pas' };
    }

    return { isValid: true };
  }

  // Validation de numéro de téléphone
  static validatePhoneNumber(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: false, error: 'Le numéro de téléphone est requis' };
    }

    // Supprimer les espaces et caractères spéciaux
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Vérifier que c'est un numéro français valide
    const frenchPhoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!frenchPhoneRegex.test(phone)) {
      return { isValid: false, error: 'Format de numéro de téléphone invalide' };
    }

    return { isValid: true };
  }

  // Validation de date de naissance
  static validateBirthDate(birthDate: Date): ValidationResult {
    if (!birthDate) {
      return { isValid: false, error: 'La date de naissance est requise' };
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return { isValid: false, error: 'Vous devez avoir au moins 13 ans' };
    }

    if (age > 120) {
      return { isValid: false, error: 'La date de naissance semble invalide' };
    }

    if (birthDate > today) {
      return { isValid: false, error: 'La date de naissance ne peut pas être dans le futur' };
    }

    return { isValid: true };
  }

  // Validation de longueur de texte
  static validateTextLength(text: string, minLength: number, maxLength: number, fieldName: string): ValidationResult {
    if (!text) {
      return { isValid: false, error: `${fieldName} est requis` };
    }

    if (text.length < minLength) {
      return { isValid: false, error: `${fieldName} doit contenir au moins ${minLength} caractères` };
    }

    if (text.length > maxLength) {
      return { isValid: false, error: `${fieldName} ne peut pas dépasser ${maxLength} caractères` };
    }

    return { isValid: true };
  }

  // Validation d'URL
  static validateURL(url: string): ValidationResult {
    if (!url) {
      return { isValid: false, error: 'L\'URL est requise' };
    }

    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Format d\'URL invalide' };
    }
  }

  // Validation de code postal français
  static validateFrenchPostalCode(postalCode: string): ValidationResult {
    if (!postalCode) {
      return { isValid: false, error: 'Le code postal est requis' };
    }

    const frenchPostalCodeRegex = /^[0-9]{5}$/;
    if (!frenchPostalCodeRegex.test(postalCode)) {
      return { isValid: false, error: 'Format de code postal invalide' };
    }

    return { isValid: true };
  }

  // Validation en temps réel avec debounce
  static debounceValidation<T>(
    validationFn: (value: T) => ValidationResult,
    delay: number = 500
  ): (value: T, callback: (result: ValidationResult) => void) => void {
    let timeoutId: NodeJS.Timeout;

    return (value: T, callback: (result: ValidationResult) => void) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const result = validationFn(value);
        callback(result);
      }, delay);
    };
  }

  // Validation de formulaire complet
  static validateForm(fields: { [key: string]: ValidationResult }): {
    isValid: boolean;
    errors: { [key: string]: string };
  } {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    Object.entries(fields).forEach(([fieldName, validation]) => {
      if (!validation.isValid) {
        errors[fieldName] = validation.error || 'Champ invalide';
        isValid = false;
      }
    });

    return { isValid, errors };
  }
}
