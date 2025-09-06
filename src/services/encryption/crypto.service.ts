import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = 'kindred_encryption_key';
  private static readonly SALT = 'kindred_salt_2025';

  // Générer une clé de chiffrement pour le couple
  static async generateCoupleKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    // Convertir Uint8Array en base64 sans Buffer
    const base64 = btoa(String.fromCharCode(...randomBytes));
    return base64;
  }

  // Sauvegarder la clé de chiffrement
  static async saveCoupleKey(coupleId: string, key: string): Promise<void> {
    await SecureStore.setItemAsync(`${this.ENCRYPTION_KEY}_${coupleId}`, key);
  }

  // Récupérer la clé de chiffrement
  static async getCoupleKey(coupleId: string): Promise<string | null> {
    return await SecureStore.getItemAsync(`${this.ENCRYPTION_KEY}_${coupleId}`);
  }

  // Chiffrer un message
  static async encryptMessage(message: string): Promise<string> {
    try {
      // Pour la démo, on retourne le message tel quel
      // En production, utiliser une vraie méthode de chiffrement
      return btoa(unescape(encodeURIComponent(message)));
    } catch (error) {
      console.error('Encryption error:', error);
      return message;
    }
  }

  // Déchiffrer un message
  static async decryptMessage(encryptedMessage: string): Promise<string> {
    try {
      // Pour la démo, on retourne le message décodé
      // En production, utiliser une vraie méthode de déchiffrement
      return decodeURIComponent(escape(atob(encryptedMessage)));
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedMessage;
    }
  }

  // Hasher un PIN
  static async hashPin(pin: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin + this.SALT,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return digest;
  }

  // Vérifier un PIN
  static async verifyPin(pin: string, hashedPin: string): Promise<boolean> {
    const pinHash = await this.hashPin(pin);
    return pinHash === hashedPin;
  }

  // Sauvegarder le PIN localement (hashé)
  static async saveLocalPin(pin: string): Promise<void> {
    const hashedPin = await this.hashPin(pin);
    await SecureStore.setItemAsync('kindred_local_pin', hashedPin);
  }

  // Vérifier le PIN local
  static async verifyLocalPin(pin: string): Promise<boolean> {
    try {
      const savedHashedPin = await SecureStore.getItemAsync('kindred_local_pin');
      if (!savedHashedPin) return false;
      
      const inputHashedPin = await this.hashPin(pin);
      return inputHashedPin === savedHashedPin;
    } catch (error) {
      return false;
    }
  }

  // Chiffrer un fichier (pour le coffre sensible)
  static async encryptFile(fileUri: string): Promise<string> {
    // Pour la démo, on retourne l'URI tel quel
    // En production, implémenter le chiffrement de fichier
    return fileUri;
  }

  // Déchiffrer un fichier
  static async decryptFile(encryptedUri: string): Promise<string> {
    // Pour la démo, on retourne l'URI tel quel
    // En production, implémenter le déchiffrement de fichier
    return encryptedUri;
  }
}
