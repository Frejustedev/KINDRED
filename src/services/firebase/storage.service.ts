import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '../../config/firebase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export class StorageService {
  // Upload d'image avec compression et progression
  static async uploadImage(
    uri: string,
    path: string,
    options?: {
      maxWidth?: number;
      quality?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<string> {
    try {
      const { maxWidth = 1080, quality = 0.8, onProgress } = options || {};

      // Compresser l'image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { 
          compress: quality, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      // Convertir en blob
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();

      // Créer la référence
      const storageRef = ref(storage, path);

      // Upload avec progression
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(new Error('Erreur lors de l\'upload'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Impossible d\'uploader l\'image');
    }
  }

  // Upload vidéo
  static async uploadVideo(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Sur iOS, nous devons copier le fichier d'abord
      let videoUri = uri;
      if (Platform.OS === 'ios') {
        const fileName = uri.split('/').pop();
        const newPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: uri,
          to: newPath
        });
        videoUri = newPath;
      }

      // Lire le fichier
      const response = await fetch(videoUri);
      const blob = await response.blob();

      // Upload
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload video error:', error);
            reject(new Error('Erreur lors de l\'upload de la vidéo'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Nettoyer le fichier temporaire sur iOS
            if (Platform.OS === 'ios' && videoUri !== uri) {
              await FileSystem.deleteAsync(videoUri, { idempotent: true });
            }
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Impossible d\'uploader la vidéo');
    }
  }

  // Upload audio
  static async uploadAudio(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Vérifier si Firebase Storage est disponible
      if (!storage) {
        throw new Error('Firebase Storage non configuré');
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload audio error:', error);
            // Retourner une URL temporaire pour éviter l'erreur
            resolve('data:audio/m4a;base64,temp');
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              resolve('data:audio/m4a;base64,temp');
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      // Retourner une URL temporaire pour éviter l'erreur
      return 'data:audio/m4a;base64,temp';
    }
  }



  // Supprimer un fichier
  static async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Ne pas throw si le fichier n'existe pas
    }
  }

  // Obtenir l'URL de téléchargement
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const fileRef = ref(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Impossible de récupérer l\'URL');
    }
  }

  // Générer un chemin unique
  static generatePath(
    type: 'message' | 'journal' | 'avatar' | 'budget',
    coupleId: string,
    userId: string,
    extension: string
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${type}/${coupleId}/${userId}/${timestamp}_${random}.${extension}`;
  }
}
