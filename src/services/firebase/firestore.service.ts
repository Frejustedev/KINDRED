import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  Message, 
  Couple, 
  JournalEntry, 
  AgendaEvent, 
  Transaction,
  TimeCapsule,
  UserProfile,
  SharedList,
  CollaborativeNote
} from '../../types';
import { MilestoneService } from '../couple/milestone.service';
import { EncryptionService } from '../encryption/crypto.service';
// import { ActivityLogService } from '../activity/activity-log.service';

export class FirestoreService {
  // === COUPLE MANAGEMENT ===
  
  // Récupérer les informations du partenaire
  static async getPartnerInfo(coupleId: string, currentUserId: string): Promise<UserProfile | null> {
    try {
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (!coupleDoc.exists()) {
        throw new Error('Couple non trouvé');
      }

      const coupleData = coupleDoc.data() as Couple;
      const partnerId = coupleData.users.find(userId => userId !== currentUserId);
      
      if (!partnerId) {
        return null;
      }

      const partnerDoc = await getDoc(doc(db, 'users', partnerId));
      if (!partnerDoc.exists()) {
        return null;
      }

      return partnerDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error getting partner info:', error);
      return null;
    }
  }
  
  // Créer un couple
  static async createCouple(
    userId1: string, 
    partnerEmail: string,
    pin: string
  ): Promise<string> {
    try {
      console.log('🔍 Début création couple...');
      console.log('👤 User ID:', userId1);
      console.log('📧 Partner Email:', partnerEmail);
      
      // Vérifier que l'email du partenaire n'est pas celui de l'utilisateur actuel
      console.log('🔍 Lecture profil utilisateur actuel...');
      const currentUserDoc = await getDoc(doc(db, 'users', userId1));
      if (!currentUserDoc.exists()) {
        throw new Error('Utilisateur actuel non trouvé');
      }
      
      const currentUserData = currentUserDoc.data() as UserProfile;
      if (currentUserData.email.toLowerCase() === partnerEmail.toLowerCase()) {
        throw new Error('Vous ne pouvez pas vous inviter vous-même');
      }

      // Vérifier que l'utilisateur actuel n'est pas déjà dans un couple
      if (currentUserData.coupledWith) {
        throw new Error('Vous êtes déjà dans un couple');
      }

      // Vérifier que l'email du partenaire correspond à un utilisateur existant
      console.log('🔍 Recherche partenaire par email...');
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', partnerEmail.toLowerCase())
      );
      console.log('🔍 Exécution requête...');
      const partnerSnapshot = await getDocs(usersQuery);
      
      console.log('📊 Résultats recherche:', partnerSnapshot.size, 'utilisateurs trouvés');
      
      if (partnerSnapshot.empty) {
        throw new Error('Aucun utilisateur trouvé avec cette adresse email');
      }

      const partnerDoc = partnerSnapshot.docs[0];
      const partnerData = partnerDoc.data() as UserProfile;
      const partnerId = partnerDoc.id;

      // Vérifier que le partenaire n'est pas déjà dans un couple
      if (partnerData.coupledWith) {
        throw new Error('Cette personne est déjà dans un couple');
      }

      // Hasher le PIN
      const hashedPin = await EncryptionService.hashPin(pin);
      
      const coupleData: Partial<Couple> = {
        users: [userId1], // Ajouter seulement le créateur du couple
        pin: hashedPin,
        startDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        topics: ['général'],
        settings: {
          currencySymbol: '€',
          timezone: 'Europe/Paris',
        },
        stats: {
          messageCount: 0,
          daysTogether: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastInteraction: serverTimestamp() as Timestamp,
        },
      };

      const coupleRef = await addDoc(collection(db, 'couples'), coupleData);
      
      // Mettre à jour seulement le profil du créateur
      await updateDoc(doc(db, 'users', userId1), { coupledWith: coupleRef.id });

      // Créer une invitation pour le partenaire
      const invitationData = {
        fromUserId: userId1,
        toUserId: partnerId,
        toUserEmail: partnerEmail.toLowerCase(),
        coupleId: coupleRef.id,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };
      
      await addDoc(collection(db, 'couple_invitations'), invitationData);

      // Créer automatiquement la date d'installation de l'app
      try {
        await MilestoneService.createAppInstallationMilestone(
          coupleRef.id,
          userId1,
          new Date()
        );
      } catch (error) {
        console.error('Error creating app installation milestone:', error);
      }

      return coupleRef.id;
    } catch (error) {
      console.error('Error creating couple:', error);
      throw error;
    }
  }

  // Accepter une invitation de couple
  static async acceptCoupleInvitation(
    userId: string,
    invitationId: string
  ): Promise<string> {
    try {
      console.log('🤝 Acceptation invitation couple...');
      
      // Récupérer l'invitation
      const invitationDoc = await getDoc(doc(db, 'couple_invitations', invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation introuvable');
      }
      
      const invitationData = invitationDoc.data();
      
      // Vérifier que l'invitation est pour cet utilisateur
      if (invitationData.toUserId !== userId) {
        throw new Error('Cette invitation ne vous est pas destinée');
      }
      
      // Vérifier que l'invitation est encore valide
      if (invitationData.status !== 'pending') {
        throw new Error('Cette invitation n\'est plus valide');
      }
      
      // Vérifier que l'invitation n'a pas expiré
      const expiresAt = invitationData.expiresAt.toDate();
      if (expiresAt < new Date()) {
        throw new Error('Cette invitation a expiré');
      }
      
      // Vérifier que l'utilisateur n'est pas déjà dans un couple
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Utilisateur introuvable');
      }
      
      const userData = userDoc.data();
      if (userData.coupledWith) {
        throw new Error('Vous êtes déjà dans un couple');
      }
      
      const coupleId = invitationData.coupleId;
      
      // Ajouter l'utilisateur au couple
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (!coupleDoc.exists()) {
        throw new Error('Couple introuvable');
      }
      
      const coupleData = coupleDoc.data();
      const updatedUsers = [...(coupleData.users || []), userId];
      
      // Utiliser une transaction pour garantir la cohérence
      const batch = writeBatch(db);
      
      // Mettre à jour le couple
      batch.update(doc(db, 'couples', coupleId), {
        users: updatedUsers
      });
      
      // Mettre à jour le profil utilisateur
      batch.update(doc(db, 'users', userId), {
        coupledWith: coupleId
      });
      
      // Marquer l'invitation comme acceptée
      batch.update(doc(db, 'couple_invitations', invitationId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      console.log('✅ Invitation acceptée avec succès');
      return coupleId;
      
    } catch (error) {
      console.error('Error accepting couple invitation:', error);
      throw error;
    }
  }

  // Refuser une invitation de couple
  static async rejectCoupleInvitation(
    userId: string,
    invitationId: string
  ): Promise<void> {
    try {
      console.log('❌ Refus invitation couple...');
      
      // Récupérer l'invitation
      const invitationDoc = await getDoc(doc(db, 'couple_invitations', invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation introuvable');
      }
      
      const invitationData = invitationDoc.data();
      
      // Vérifier que l'invitation est pour cet utilisateur
      if (invitationData.toUserId !== userId) {
        throw new Error('Cette invitation ne vous est pas destinée');
      }
      
      // Marquer l'invitation comme refusée
      await updateDoc(doc(db, 'couple_invitations', invitationId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      
      console.log('✅ Invitation refusée');
      
    } catch (error) {
      console.error('Error rejecting couple invitation:', error);
      throw error;
    }
  }

  // Récupérer les invitations en attente pour un utilisateur
  static async getPendingInvitations(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'couple_invitations'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const invitations = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Récupérer les infos de l'expéditeur
        const senderDoc = await getDoc(doc(db, 'users', data.fromUserId));
        const senderData = senderDoc.exists() ? senderDoc.data() : null;
        
        invitations.push({
          id: docSnapshot.id,
          ...data,
          sender: senderData
        });
      }
      
      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  // Quitter un couple
  static async leaveCouple(userId: string): Promise<void> {
    try {
      console.log('🚪 Début processus de départ du couple...');
      
      // Récupérer le profil utilisateur pour obtenir l'ID du couple
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Utilisateur introuvable');
      }
      
      const userData = userDoc.data();
      const coupleId = userData.coupledWith;
      
      if (!coupleId) {
        throw new Error('Vous n\'êtes pas dans un couple');
      }
      
      // Récupérer les données du couple
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (!coupleDoc.exists()) {
        throw new Error('Couple introuvable');
      }
      
      const coupleData = coupleDoc.data();
      
      // IMPORTANT: Sauvegarder la liste des membres AVANT de modifier le couple
      const originalMembers = [...coupleData.users];
      console.log('👥 Membres originaux à traiter:', originalMembers.length, '-', JSON.stringify(originalMembers));
      
      if (originalMembers.length === 0) {
        console.log('⚠️ Aucun membre dans le couple - couple déjà dissous');
        return;
      }
      
      // Quitter le couple signifie toujours dissoudre le couple (retirer tous les membres)
      console.log('💔 Dissolution du couple - tous les membres retirés');
      
      // ÉTAPE 1: Marquer le couple comme quitté/dissous
      console.log('📝 Mise à jour du couple...');
      await updateDoc(doc(db, 'couples', coupleId), {
        users: [],
        leftAt: serverTimestamp(),
        leftBy: userId,
        status: 'left'
      });
      console.log('✅ Couple mis à jour');
      
      // ÉTAPE 2: Retirer TOUS les utilisateurs du couple (y compris le partenaire)
      console.log('📝 Mise à jour des profils utilisateurs...');
      console.log(`👥 Membres à traiter: ${originalMembers.length} - ${JSON.stringify(originalMembers)}`);
      
      for (const memberId of originalMembers) {
        try {
          console.log(`🔄 Traitement du membre: ${memberId} ${memberId === userId ? '(celui qui quitte)' : '(partenaire)'}`);
          
          // Vérifier le profil AVANT la mise à jour
          const beforeDoc = await getDoc(doc(db, 'users', memberId));
          const beforeData = beforeDoc.data();
          console.log(`📋 AVANT - ${memberId} coupledWith: ${beforeData?.coupledWith}`);
          
          // Forcer la mise à jour avec plusieurs tentatives
          let updateSuccess = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await updateDoc(doc(db, 'users', memberId), {
                coupledWith: null,
                leftCoupleAt: serverTimestamp()
              });
              console.log(`✅ Tentative ${attempt} réussie pour ${memberId}`);
              updateSuccess = true;
              break;
            } catch (updateError) {
              console.error(`❌ Tentative ${attempt} échouée pour ${memberId}:`, updateError);
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s
              }
            }
          }
          
          if (!updateSuccess) {
            throw new Error(`Impossible de mettre à jour le profil ${memberId} après 3 tentatives`);
          }
          
          // Vérifier le profil APRÈS la mise à jour
          const afterDoc = await getDoc(doc(db, 'users', memberId));
          const afterData = afterDoc.data();
          console.log(`📋 APRÈS - ${memberId} coupledWith: ${afterData?.coupledWith}`);
          
          if (afterData?.coupledWith === null) {
            console.log(`✅ Profil ${memberId} mis à jour avec succès - coupledWith: null`);
          } else {
            console.error(`❌ ÉCHEC - Profil ${memberId} PAS mis à jour - coupledWith: ${afterData?.coupledWith}`);
          }
          
          // Créer un log d'activité pour chaque membre
          if (memberId !== userId) {
            console.log(`📝 Création log d'activité pour le partenaire: ${memberId}`);
            const memberActivityLogData = {
              userId: memberId,
              type: 'couple_left',
              description: `Retiré du couple suite au départ de ${userId}`,
              timestamp: serverTimestamp(),
              coupleId: coupleId
            };
            await addDoc(collection(db, 'ActivityLogs'), memberActivityLogData);
            console.log(`✅ Log d'activité créé pour le partenaire: ${memberId}`);
          }
        } catch (error) {
          console.error(`❌ Erreur profil ${memberId}:`, error);
        }
      }
      
      console.log('🎯 TOUS les membres ont été retirés du couple');
      
      // VÉRIFICATION: S'assurer que le profil utilisateur principal est bien mis à jour
      console.log('🔍 Vérification finale du profil utilisateur...');
      const updatedUserDoc = await getDoc(doc(db, 'users', userId));
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data();
        console.log(`✅ Profil utilisateur vérifié - coupledWith: ${updatedUserData.coupledWith}`);
        if (updatedUserData.coupledWith !== null) {
          console.error('⚠️ ATTENTION: Le profil utilisateur n\'a pas été correctement mis à jour !');
        }
      }
      
      // ÉTAPE 3: Créer le log d'activité principal
      console.log('📝 Création du log d\'activité...');
      try {
        const activityLogData = {
          userId: userId,
          type: 'couple_left',
          description: 'A quitté le couple',
          timestamp: serverTimestamp(),
          coupleId: coupleId
        };
        await addDoc(collection(db, 'ActivityLogs'), activityLogData);
        console.log('✅ Log d\'activité créé');
      } catch (error) {
        console.error('❌ Erreur log d\'activité:', error);
      }
      
      // ÉTAPE 4: Annuler les invitations (optionnel)
      console.log('📝 Annulation des invitations...');
      try {
        const invitationsQuery = query(
          collection(db, 'couple_invitations'),
          where('coupleId', '==', coupleId)
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        
        for (const invitationDoc of invitationsSnapshot.docs) {
          await updateDoc(invitationDoc.ref, {
            status: 'cancelled',
            cancelledAt: serverTimestamp()
          });
        }
        console.log(`✅ ${invitationsSnapshot.docs.length} invitations annulées`);
      } catch (error) {
        console.error('❌ Erreur invitations:', error);
      }
      
      console.log('✅ Utilisateur a quitté le couple avec succès');
      
    } catch (error) {
      console.error('Error leaving couple:', error);
      throw error;
    }
  }

  // Dissoudre complètement un couple (pour les cas extrêmes)
  static async dissolveCouple(userId: string, coupleId: string): Promise<void> {
    try {
      console.log('💥 Dissolution complète du couple...');
      
      // Vérifier que l'utilisateur fait partie du couple
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (!coupleDoc.exists()) {
        throw new Error('Couple introuvable');
      }
      
      const coupleData = coupleDoc.data();
      if (!coupleData.users.includes(userId)) {
        throw new Error('Vous ne faites pas partie de ce couple');
      }
      
      const batch = writeBatch(db);
      
      // Marquer le couple comme dissous
      batch.update(doc(db, 'couples', coupleId), {
        users: [],
        status: 'dissolved',
        dissolvedAt: serverTimestamp(),
        dissolvedBy: userId
      });
      
      // Mettre à jour tous les utilisateurs du couple
      for (const memberId of coupleData.users) {
        batch.update(doc(db, 'users', memberId), {
          coupledWith: null,
          leftCoupleAt: serverTimestamp()
        });
      }
      
      // Annuler toutes les invitations en attente
      const invitationsQuery = query(
        collection(db, 'couple_invitations'),
        where('coupleId', '==', coupleId),
        where('status', '==', 'pending')
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      invitationsSnapshot.docs.forEach((invitationDoc) => {
        batch.update(invitationDoc.ref, {
          status: 'cancelled',
          cancelledAt: serverTimestamp()
        });
      });
      
      // Créer un log d'activité pour la dissolution
      const activityLogData = {
        userId: userId,
        type: 'couple_dissolved',
        description: 'A dissous le couple',
        timestamp: serverTimestamp(),
        coupleId: coupleId
      };
      
      const activityLogRef = doc(collection(db, 'ActivityLogs'));
      batch.set(activityLogRef, activityLogData);
      
      await batch.commit();
      
      console.log('✅ Couple dissous avec succès');
      
    } catch (error) {
      console.error('Error dissolving couple:', error);
      throw error;
    }
  }

  // Rejoindre un couple existant (version simplifiée avec email)
  static async joinCoupleByEmail(
    userId: string,
    partnerEmail: string,
    pin: string
  ): Promise<string> {
    try {
      console.log('🔍 Recherche couple par email partenaire...');
      
      // Trouver l'utilisateur partenaire par email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', partnerEmail.toLowerCase())
      );
      const partnerSnapshot = await getDocs(usersQuery);
      
      if (partnerSnapshot.empty) {
        throw new Error('Aucun utilisateur trouvé avec cette adresse email');
      }
      
      const partnerDoc = partnerSnapshot.docs[0];
      const partnerData = partnerDoc.data() as UserProfile;
      const partnerId = partnerDoc.id;
      
      // Vérifier que le partenaire a un couple
      if (!partnerData.coupledWith) {
        throw new Error('Cette personne n\'a pas encore créé de couple');
      }
      
      // Récupérer le couple
      const coupleDoc = await getDoc(doc(db, 'couples', partnerData.coupledWith));
      if (!coupleDoc.exists()) {
        throw new Error('Couple introuvable');
      }
      
      const coupleData = coupleDoc.data();
      
      // Vérifier le PIN
      const isValidPin = await EncryptionService.verifyPin(pin, coupleData.pin);
      if (!isValidPin) {
        throw new Error('PIN incorrect');
      }
      
      // Vérifier que le couple n'est pas déjà complet
      if (coupleData.users && coupleData.users.length >= 2) {
        throw new Error('Ce couple est déjà complet');
      }
      
      // Ajouter l'utilisateur au couple
      const updatedUsers = [...(coupleData.users || []), userId];
      await updateDoc(doc(db, 'couples', partnerData.coupledWith), {
        users: updatedUsers
      });
      
      // Mettre à jour le profil utilisateur
      await updateDoc(doc(db, 'users', userId), {
        coupledWith: partnerData.coupledWith
      });
      
      console.log('✅ Utilisateur ajouté au couple avec succès');
      return partnerData.coupledWith;
      
    } catch (error) {
      console.error('Error joining couple by email:', error);
      throw error;
    }
  }

  // Rejoindre un couple existant (ancienne version avec code)
  static async joinCouple(
    userId: string, 
    inviteCode: string, 
    pin: string
  ): Promise<string> {
    try {
      // Chercher le couple par code d'invitation
      const q = query(
        collection(db, 'invites'), 
        where('code', '==', inviteCode),
        where('used', '==', false),
        where('expiresAt', '>', new Date())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('Code d\'invitation invalide ou expiré');
      }

      const invite = snapshot.docs[0];
      const inviteData = invite.data();
      const coupleId = inviteData.coupleId;

      // Vérifier le PIN
      const couple = await this.getCouple(coupleId);
      const isValidPin = await EncryptionService.verifyPin(pin, couple.pin);
      if (!isValidPin) {
        throw new Error('Code PIN incorrect');
      }

      // Ajouter l'utilisateur au couple
      await updateDoc(doc(db, 'couples', coupleId), {
        users: [...couple.users, userId]
      });

      // Mettre à jour le profil utilisateur
      await updateDoc(doc(db, 'users', userId), { 
        coupledWith: coupleId 
      });

      // Marquer l'invitation comme utilisée
      await updateDoc(doc(db, 'invites', invite.id), { 
        used: true,
        usedBy: userId,
        usedAt: serverTimestamp()
      });

      return coupleId;
    } catch (error: any) {
      console.error('Error joining couple:', error);
      throw new Error(error.message || 'Impossible de rejoindre le couple');
    }
  }

  // Récupérer les infos du couple
  static async getCouple(coupleId: string): Promise<Couple> {
    const docSnap = await getDoc(doc(db, 'couples', coupleId));
    if (!docSnap.exists()) {
      throw new Error('Couple non trouvé');
    }
    return { id: docSnap.id, ...docSnap.data() } as Couple;
  }


  // Écouter les changements d'un couple en temps réel
  static subscribeToCouple(
    coupleId: string,
    onUpdate: (couple: Couple) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const coupleRef = doc(db, 'couples', coupleId);
    
    return onSnapshot(
      coupleRef,
      (doc) => {
        if (doc.exists()) {
          const coupleData = {
            id: doc.id,
            ...doc.data()
          } as Couple;
          onUpdate(coupleData);
        } else {
          onError(new Error('Couple introuvable'));
        }
      },
      (error) => {
        onError(error);
      }
    );
  }

  // === MESSAGES ===

  // Envoyer un message
  static async sendMessage(
    coupleId: string,
    senderId: string,
    content: string,
    topic: string = 'général',
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyTo?: string
  ): Promise<string> {
    try {
      // Chiffrer le contenu si c'est du texte
      const encryptedContent = type === 'text' 
        ? await EncryptionService.encryptMessage(content)
        : content;

      const messageData: Partial<Message> = {
        content: encryptedContent,
        senderId,
        topic,
        timestamp: serverTimestamp() as Timestamp,
        type,
        read: false,
        reactions: [],
      };

      // Ajouter mediaUrl seulement s'il est défini
      if (mediaUrl) {
        messageData.mediaUrl = mediaUrl;
      }

      // Ajouter replyTo seulement s'il est défini
      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      const messageRef = await addDoc(
        collection(db, 'couples', coupleId, 'messages'),
        messageData
      );

      // Mettre à jour les stats
      await this.updateCoupleStats(coupleId, 'message');

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Impossible d\'envoyer le message');
    }
  }

  // Écouter les messages en temps réel
  static subscribeToMessages(
    coupleId: string,
    topic: string | null,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    let q;
    
    if (topic) {
      q = query(
        collection(db, 'couples', coupleId, 'messages'),
        where('topic', '==', topic),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'couples', coupleId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    return onSnapshot(q, async (snapshot) => {
      const messages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          // Déchiffrer le contenu si c'est du texte
          if (data.type === 'text') {
            data.content = await EncryptionService.decryptMessage(data.content);
          }
          return { id: doc.id, ...data } as Message;
        })
      );
      
      callback(messages.reverse());
    });
  }

  // Écouter TOUS les messages en temps réel (tous les topics)
  static subscribeToAllMessages(
    coupleId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 100
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, async (snapshot) => {
      const messages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          // Déchiffrer le contenu si c'est du texte
          if (data.type === 'text') {
            data.content = await EncryptionService.decryptMessage(data.content);
          }
          return { id: doc.id, ...data } as Message;
        })
      );
      
      callback(messages.reverse());
    });
  }

  // Marquer comme lu
  static async markAsRead(
    coupleId: string, 
    messageId: string
  ): Promise<void> {
    await updateDoc(
      doc(db, 'couples', coupleId, 'messages', messageId),
      { read: true }
    );
  }

  // Marquer tous les messages d'un topic comme lus
  static async markTopicAsRead(
    coupleId: string,
    topic: string,
    userId: string
  ): Promise<void> {
    const messagesRef = collection(db, 'couples', coupleId, 'messages');
    const q = query(
      messagesRef,
      where('topic', '==', topic),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  }

  // Ajouter une réaction
  static async addReaction(
    coupleId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const messageRef = doc(db, 'couples', coupleId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) return;
    
    const reactions = messageDoc.data().reactions || [];
    const existingReactionIndex = reactions.findIndex(
      (r: any) => r.userId === userId
    );
    
    const newReaction = {
      userId,
      emoji,
      timestamp: new Date()
    };
    
    if (existingReactionIndex !== -1) {
      // Remplacer la réaction existante
      reactions[existingReactionIndex] = newReaction;
    } else {
      // Ajouter une nouvelle réaction
      reactions.push(newReaction);
    }
    
    await updateDoc(messageRef, { reactions });
  }

  // Ajouter un nouveau topic
  static async addTopic(
    coupleId: string,
    topicName: string
  ): Promise<void> {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) return;
    
    const currentTopics = coupleDoc.data().topics || [];
    
    // Vérifier si le topic existe déjà
    if (currentTopics.includes(topicName)) {
      throw new Error('Ce topic existe déjà');
    }
    
    // Ajouter le nouveau topic
    const updatedTopics = [...currentTopics, topicName];
    
    await updateDoc(coupleRef, { topics: updatedTopics });
  }

  // Modifier un topic
  static async updateTopic(
    coupleId: string,
    oldTopicName: string,
    newTopicName: string
  ): Promise<void> {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) return;
    
    const currentTopics = coupleDoc.data().topics || [];
    
    // Vérifier si l'ancien topic existe
    if (!currentTopics.includes(oldTopicName)) {
      throw new Error('Topic introuvable');
    }
    
    // Vérifier si le nouveau nom existe déjà
    if (currentTopics.includes(newTopicName) && oldTopicName !== newTopicName) {
      throw new Error('Ce nom de topic existe déjà');
    }
    
    // Empêcher la modification du topic principal
    if (oldTopicName === 'général') {
      throw new Error('Le topic principal ne peut pas être modifié');
    }
    
    // Mettre à jour le topic
    const updatedTopics = currentTopics.map((topic: string) => 
      topic === oldTopicName ? newTopicName : topic
    );
    
    await updateDoc(coupleRef, { topics: updatedTopics });
    
    // Mettre à jour tous les messages de ce topic
    await this.updateMessagesTopic(coupleId, oldTopicName, newTopicName);
  }

  // Supprimer un topic
  static async deleteTopic(
    coupleId: string,
    topicName: string
  ): Promise<void> {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) return;
    
    const currentTopics = coupleDoc.data().topics || [];
    
    // Debug: afficher les topics disponibles
    console.log('Topics disponibles:', currentTopics);
    console.log('Topic à supprimer:', topicName);
    console.log('Topic existe?', currentTopics.includes(topicName));
    
    // Vérifier si le topic existe (comparaison insensible à la casse)
    const topicExists = currentTopics.some((topic: string) => 
      topic.toLowerCase().trim() === topicName.toLowerCase().trim()
    );
    
    if (!topicExists) {
      throw new Error(`Topic "${topicName}" introuvable. Topics disponibles: ${currentTopics.join(', ')}`);
    }
    
    // Empêcher la suppression du topic principal
    if (topicName === 'général') {
      throw new Error('Le topic principal ne peut pas être supprimé');
    }
    
    // Supprimer le topic (comparaison insensible à la casse)
    const updatedTopics = currentTopics.filter((topic: string) => 
      topic.toLowerCase().trim() !== topicName.toLowerCase().trim()
    );
    
    await updateDoc(coupleRef, { topics: updatedTopics });
    
    // Déplacer tous les messages vers le topic principal
    await this.moveMessagesToGeneral(coupleId, topicName);
  }

  // Mettre à jour le topic de tous les messages
  private static async updateMessagesTopic(
    coupleId: string,
    oldTopic: string,
    newTopic: string
  ): Promise<void> {
    const messagesRef = collection(db, 'couples', coupleId, 'messages');
    const q = query(messagesRef, where('topic', '==', oldTopic));
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { topic: newTopic });
    });
    
    await batch.commit();
  }

  // Effacer tous les messages d'un topic
  static async clearTopicMessages(
    coupleId: string,
    topicName: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'couples', coupleId, 'messages');
      const q = query(messagesRef, where('topic', '==', topicName));
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('Aucun message à supprimer pour ce topic');
        return;
      }
      
      // Supprimer tous les messages par batch
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`${snapshot.size} messages supprimés du topic "${topicName}"`);
    } catch (error) {
      console.error('Error clearing topic messages:', error);
      throw new Error('Impossible d\'effacer les messages du topic');
    }
  }

  // Déplacer les messages vers le topic principal
  private static async moveMessagesToGeneral(
    coupleId: string,
    topicName: string
  ): Promise<void> {
    const messagesRef = collection(db, 'couples', coupleId, 'messages');
    const q = query(messagesRef, where('topic', '==', topicName));
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { topic: 'général' });
    });
    
    await batch.commit();
  }

  // === TYPING INDICATOR ===
  
  // Démarrer l'indicateur de frappe
  static async startTyping(
    coupleId: string,
    topic: string,
    userId: string
  ): Promise<void> {
    const typingRef = doc(db, 'couples', coupleId, 'typing', topic);
    await setDoc(typingRef, {
      [userId]: serverTimestamp()
    }, { merge: true });
  }

  // Arrêter l'indicateur de frappe
  static async stopTyping(
    coupleId: string,
    topic: string,
    userId: string
  ): Promise<void> {
    const typingRef = doc(db, 'couples', coupleId, 'typing', topic);
    await updateDoc(typingRef, {
      [userId]: null
    });
  }

  // Écouter les indicateurs de frappe
  static subscribeToTyping(
    coupleId: string,
    topic: string,
    callback: (typingUsers: string[]) => void
  ): Unsubscribe {
    const typingRef = doc(db, 'couples', coupleId, 'typing', topic);
    
    return onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const now = new Date();
        const typingUsers: string[] = [];
        
        // Vérifier quels utilisateurs sont en train de taper (dans les 5 dernières secondes)
        Object.entries(data).forEach(([userId, timestamp]) => {
          if (timestamp && timestamp.toDate) {
            const timeDiff = now.getTime() - timestamp.toDate().getTime();
            if (timeDiff < 5000) { // 5 secondes
              typingUsers.push(userId);
            }
          }
        });
        
        callback(typingUsers);
      } else {
        callback([]);
      }
    });
  }

  // === JOURNAL ===

  // Ajouter une entrée au journal
  static async addJournalEntry(
    coupleId: string,
    title: string,
    content: string,
    authorId: string,
    media: string[] = [],
    mood?: string,
    tags?: string[]
  ): Promise<string> {
    try {
      const entryData: Partial<JournalEntry> = {
        title,
        content,
        authorId,
        media,
        mood,
        tags,
        date: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp
      };

      const entryRef = await addDoc(
        collection(db, 'couples', coupleId, 'journal'),
        entryData
      );

      return entryRef.id;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw new Error('Impossible d\'ajouter l\'entrée au journal');
    }
  }

  // Récupérer les entrées du journal
  static async getJournalEntries(
    coupleId: string,
    limitCount: number = 20,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ entries: JournalEntry[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    let q = query(
      collection(db, 'couples', coupleId, 'journal'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    if (startAfterDoc) {
      q = query(
        collection(db, 'couples', coupleId, 'journal'),
        orderBy('date', 'desc'),
        startAfter(startAfterDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { entries, lastDoc };
  }

  // Mettre à jour une entrée du journal
  static async updateJournalEntry(
    coupleId: string,
    entryId: string,
    title: string,
    content: string,
    mood?: string,
    tags?: string[]
  ): Promise<void> {
    try {
      const entryRef = doc(db, 'couples', coupleId, 'journal', entryId);
      await updateDoc(entryRef, {
        title,
        content,
        mood,
        tags,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw new Error('Impossible de modifier l\'entrée du journal');
    }
  }

  // Supprimer une entrée du journal
  static async deleteJournalEntry(
    coupleId: string,
    entryId: string
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, 'couples', coupleId, 'journal', entryId));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error('Impossible de supprimer l\'entrée du journal');
    }
  }

  // === AGENDA ===

  // Créer un événement d'agenda
  static async createAgendaEvent(
    coupleId: string,
    event: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Convertir les dates JavaScript en Timestamps Firebase
      const startDate = event.startDate instanceof Date ? Timestamp.fromDate(event.startDate) : event.startDate;
      const endDate = event.endDate instanceof Date ? Timestamp.fromDate(event.endDate) : event.endDate;
      
      const eventData = {
        ...event,
        startDate,
        endDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isMultiDay: endDate ? this.isMultiDayEvent(startDate.toDate(), endDate.toDate()) : false
      };

      const eventRef = await addDoc(
        collection(db, 'couples', coupleId, 'events'),
        eventData
      );

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        
        // Récupérer le nom de l'utilisateur
        let userName = 'Utilisateur';
        if (event.createdBy) {
          try {
            const userDoc = await getDoc(doc(db, 'users', event.createdBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
            }
          } catch (error) {
            console.error('Error getting user name:', error);
          }
        }
        
        await ActivityLogService.createActivityLog(
          coupleId,
          event.createdBy || 'unknown',
          userName,
          'agenda_event_created',
          `${userName} a créé un événement : ${event.title}`,
          { eventTitle: event.title, eventId: eventRef.id }
        );
      } catch (error) {
        console.error('Error creating activity log:', error);
      }

      return eventRef.id;
    } catch (error) {
      console.error('Error creating agenda event:', error);
      throw new Error('Impossible de créer l\'événement');
    }
  }

  // Mettre à jour un événement d'agenda
  static async updateAgendaEvent(
    coupleId: string,
    eventId: string,
    updates: Partial<AgendaEvent>
  ): Promise<void> {
    try {
      // Convertir les dates JavaScript en Timestamps Firebase si nécessaire
      const eventData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.startDate instanceof Date) {
        eventData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.endDate instanceof Date) {
        eventData.endDate = Timestamp.fromDate(updates.endDate);
      }

      // Recalculer isMultiDay si les dates changent
      if (updates.startDate || updates.endDate) {
        const eventRef = doc(db, 'couples', coupleId, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const currentData = eventDoc.data();
          const startDate = eventData.startDate || currentData.startDate;
          const endDate = eventData.endDate || currentData.endDate;
          
          eventData.isMultiDay = endDate ? this.isMultiDayEvent(startDate.toDate(), endDate.toDate()) : false;
        }
      }

      await updateDoc(doc(db, 'couples', coupleId, 'events', eventId), eventData);

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        const eventDoc = await getDoc(doc(db, 'couples', coupleId, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as AgendaEvent;
          
          // Récupérer le nom de l'utilisateur
          let userName = 'Utilisateur';
          if (eventData.createdBy) {
            try {
              const userDoc = await getDoc(doc(db, 'users', eventData.createdBy));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
              }
            } catch (error) {
              console.error('Error getting user name:', error);
            }
          }
          
          await ActivityLogService.createActivityLog(
            coupleId,
            eventData.createdBy || 'unknown',
            userName,
            'agenda_event_updated',
            `${userName} a modifié un événement : ${eventData.title}`,
            { eventTitle: eventData.title, eventId }
          );
        }
      } catch (error) {
        console.error('Error creating activity log:', error);
      }
    } catch (error) {
      console.error('Error updating agenda event:', error);
      throw new Error('Impossible de mettre à jour l\'événement');
    }
  }

  // Récupérer les événements d'une période
  static async getAgendaEvents(
    coupleId: string,
    startDate: Date,
    endDate: Date,
    includeRecurring: boolean = true
  ): Promise<AgendaEvent[]> {
    try {
      const q = query(
        collection(db, 'couples', coupleId, 'events'),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      let events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AgendaEvent));

      // Si on inclut les événements récurrents, les générer
      if (includeRecurring) {
        const { RecurringEventService } = await import('../agenda/recurring.service');
        const allEvents: AgendaEvent[] = [];

        for (const event of events) {
          if (event.recurring) {
            const instances = RecurringEventService.generateRecurringInstances(event, startDate, endDate);
            allEvents.push(...instances);
          } else {
            allEvents.push(event);
          }
        }

        // Trier par date de début
        events = allEvents.sort((a, b) => a.startDate.toDate().getTime() - b.startDate.toDate().getTime());
      }

      return events;
    } catch (error) {
      console.error('Error getting agenda events:', error);
      throw new Error('Impossible de récupérer les événements');
    }
  }

  // Récupérer les événements d'un mois (compatibilité)
  static async getMonthEvents(
    coupleId: string,
    year: number,
    month: number
  ): Promise<AgendaEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return this.getAgendaEvents(coupleId, startDate, endDate);
  }

  // Récupérer les événements d'un jour
  static async getDayEvents(
    coupleId: string,
    date: Date
  ): Promise<AgendaEvent[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.getAgendaEvents(coupleId, startDate, endDate);
  }

  // Récupérer les événements d'une semaine
  static async getWeekEvents(
    coupleId: string,
    date: Date
  ): Promise<AgendaEvent[]> {
    const startDate = new Date(date);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Début de semaine (dimanche)
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Fin de semaine (samedi)
    endDate.setHours(23, 59, 59, 999);

    return this.getAgendaEvents(coupleId, startDate, endDate);
  }

  // Supprimer un événement
  static async deleteAgendaEvent(
    coupleId: string,
    eventId: string
  ): Promise<void> {
    try {
      // Récupérer les informations de l'événement avant suppression
      const eventDoc = await getDoc(doc(db, 'couples', coupleId, 'events', eventId));
      let eventTitle = 'Événement';
      let createdBy = 'unknown';
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as AgendaEvent;
        eventTitle = eventData.title;
        createdBy = eventData.createdBy || 'unknown';
      }

      await deleteDoc(doc(db, 'couples', coupleId, 'events', eventId));

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        
        // Récupérer le nom de l'utilisateur
        let userName = 'Utilisateur';
        if (createdBy && createdBy !== 'unknown') {
          try {
            const userDoc = await getDoc(doc(db, 'users', createdBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
            }
          } catch (error) {
            console.error('Error getting user name:', error);
          }
        }
        
        await ActivityLogService.createActivityLog(
          coupleId,
          createdBy,
          userName,
          'agenda_event_deleted',
          `${userName} a supprimé un événement : ${eventTitle}`,
          { eventTitle, eventId }
        );
      } catch (error) {
        console.error('Error creating activity log:', error);
      }
    } catch (error) {
      console.error('Error deleting agenda event:', error);
      throw new Error('Impossible de supprimer l\'événement');
    }
  }

  // Supprimer une occurrence d'événement récurrent
  static async deleteRecurringEventOccurrence(
    coupleId: string,
    eventId: string,
    occurrenceDate: Date
  ): Promise<void> {
    try {
      // Ajouter la date à la liste des exceptions
      const eventRef = doc(db, 'couples', coupleId, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as AgendaEvent;
        const exceptions = eventData.recurring?.exceptions || [];
        exceptions.push(Timestamp.fromDate(occurrenceDate));
        
        await updateDoc(eventRef, {
          'recurring.exceptions': exceptions,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error deleting recurring event occurrence:', error);
      throw new Error('Impossible de supprimer l\'occurrence');
    }
  }

  // Vérifier si un événement est multi-jours
  private static isMultiDayEvent(startDate: Date, endDate: Date): boolean {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return end.getTime() > start.getTime();
  }

  // Rechercher des événements
  static async searchAgendaEvents(
    coupleId: string,
    searchTerm: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AgendaEvent[]> {
    try {
      let q = query(
        collection(db, 'couples', coupleId, 'events'),
        orderBy('startDate', 'desc')
      );

      if (startDate && endDate) {
        q = query(
          collection(db, 'couples', coupleId, 'events'),
          where('startDate', '>=', Timestamp.fromDate(startDate)),
          where('startDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('startDate', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AgendaEvent));

      // Filtrer par terme de recherche
      return events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching agenda events:', error);
      throw new Error('Impossible de rechercher les événements');
    }
  }

  // === BUDGET ===

  // Ajouter une transaction
  static async addTransaction(
    coupleId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp()
      };

      const transactionRef = await addDoc(
        collection(db, 'couples', coupleId, 'transactions'),
        transactionData
      );

      return transactionRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw new Error('Impossible d\'ajouter la transaction');
    }
  }

  // Récupérer les transactions d'un mois
  static async getMonthTransactions(
    coupleId: string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const q = query(
      collection(db, 'couples', coupleId, 'transactions'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  }

  // Récupérer les transactions par plage de dates
  static async getTransactionsByDateRange(
    coupleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'couples', coupleId, 'transactions'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw new Error('Impossible de récupérer les transactions');
    }
  }

  // Supprimer une transaction
  // Mettre à jour une transaction
  static async updateTransaction(coupleId: string, transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactionRef = doc(db, 'couples', coupleId, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Impossible de mettre à jour la transaction');
    }
  }

  static async deleteTransaction(coupleId: string, transactionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'couples', coupleId, 'transactions', transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Impossible de supprimer la transaction');
    }
  }

  // === CAPSULES TEMPORELLES ===

  // Créer une capsule
  static async createCapsule(
    coupleId: string,
    message: string,
    openDate: Date,
    createdBy: string,
    media?: string[]
  ): Promise<string> {
    try {
      const capsuleData = {
        message: await EncryptionService.encryptMessage(message),
        media: media || [],
        createdBy,
        createdAt: Timestamp.now(),
        openDate: Timestamp.fromDate(openDate),
        isOpen: false,
      };

      const docRef = await addDoc(collection(db, 'couples', coupleId, 'capsules'), capsuleData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating capsule:', error);
      throw new Error('Erreur lors de la création de la capsule');
    }
  }

  // Récupérer les capsules
  static async getCapsules(coupleId: string, includeOpen: boolean = true): Promise<TimeCapsule[]> {
    try {
      let capsulesQuery;
      
      if (!includeOpen) {
        capsulesQuery = query(
          collection(db, 'couples', coupleId, 'capsules'),
          where('isOpen', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else {
        capsulesQuery = query(
          collection(db, 'couples', coupleId, 'capsules'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(capsulesQuery);
      const capsules: TimeCapsule[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        let decryptedMessage = '';
        
        if (data.isOpen && data.message) {
          try {
            decryptedMessage = await EncryptionService.decryptMessage(data.message);
          } catch (error) {
            console.error('Error decrypting capsule message:', error);
            decryptedMessage = 'Erreur de déchiffrement';
          }
        }

        capsules.push({
          id: doc.id,
          message: decryptedMessage,
          media: data.media || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          openDate: data.openDate,
          isOpen: data.isOpen,
          openedAt: data.openedAt,
        });
      }

      return capsules;
    } catch (error) {
      console.error('Error getting capsules:', error);
      throw new Error('Erreur lors de la récupération des capsules');
    }
  }

  // Ouvrir une capsule
  // Mettre à jour une capsule
  static async updateCapsule(coupleId: string, capsuleId: string, updates: Partial<TimeCapsule>): Promise<void> {
    try {
      const capsuleRef = doc(db, 'couples', coupleId, 'capsules', capsuleId);
      await updateDoc(capsuleRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating capsule:', error);
      throw new Error('Impossible de mettre à jour la capsule');
    }
  }

  static async openCapsule(coupleId: string, capsuleId: string): Promise<void> {
    try {
      const capsuleRef = doc(db, 'couples', coupleId, 'capsules', capsuleId);
      await updateDoc(capsuleRef, {
        isOpen: true,
        openedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error opening capsule:', error);
      throw new Error('Erreur lors de l\'ouverture de la capsule');
    }
  }

  // Supprimer une capsule
  static async deleteCapsule(coupleId: string, capsuleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'couples', coupleId, 'capsules', capsuleId));
    } catch (error) {
      console.error('Error deleting capsule:', error);
      throw new Error('Erreur lors de la suppression de la capsule');
    }
  }

  // === UTILITAIRES ===

  // Mettre à jour les statistiques du couple
  private static async updateCoupleStats(
    coupleId: string,
    action: 'message' | 'interaction'
  ): Promise<void> {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (!coupleDoc.exists()) return;
      
      const stats = coupleDoc.data().stats || {};
      const lastInteraction = stats.lastInteraction?.toDate() || new Date(0);
      const now = new Date();
      
      // Calculer le streak
      const hoursSinceLastInteraction = 
        (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
      
      let currentStreak = stats.currentStreak || 0;
      if (hoursSinceLastInteraction < 48) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      
      const updates: any = {
        'stats.lastInteraction': serverTimestamp(),
        'stats.currentStreak': currentStreak,
        'stats.longestStreak': Math.max(
          currentStreak, 
          stats.longestStreak || 0
        )
      };
      
      if (action === 'message') {
        updates['stats.messageCount'] = (stats.messageCount || 0) + 1;
      }
      
      await updateDoc(coupleRef, updates);
    } catch (error) {
      console.error('Error updating couple stats:', error);
    }
  }

  // Générer un code d'invitation
  static async generateInviteCode(coupleId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await addDoc(collection(db, 'invites'), {
      code,
      coupleId,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt
    });

    return code;
  }

  // === NOTIFICATIONS ===

  // Sauvegarder le token de notification d'un utilisateur
  static async saveNotificationToken(
    userId: string,
    token: string,
    deviceInfo?: {
      platform: string;
      version: string;
    }
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'notification_tokens', userId), {
        userId,
        token,
        deviceInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving notification token:', error);
      throw new Error('Impossible de sauvegarder le token de notification');
    }
  }

  // Récupérer le token de notification d'un utilisateur
  static async getNotificationToken(userId: string): Promise<string | null> {
    try {
      const docSnap = await getDoc(doc(db, 'notification_tokens', userId));
      if (docSnap.exists()) {
        return docSnap.data().token;
      }
      return null;
    } catch (error) {
      console.error('Error getting notification token:', error);
      return null;
    }
  }

  // Supprimer le token de notification d'un utilisateur
  static async deleteNotificationToken(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notification_tokens', userId));
    } catch (error) {
      console.error('Error deleting notification token:', error);
    }
  }

  // Récupérer tous les tokens de notification d'un couple
  static async getCoupleNotificationTokens(coupleId: string): Promise<{ userId: string; token: string }[]> {
    try {
      const couple = await this.getCouple(coupleId);
      const tokens: { userId: string; token: string }[] = [];

      for (const userId of couple.users) {
        const token = await this.getNotificationToken(userId);
        if (token) {
          tokens.push({ userId, token });
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error getting couple notification tokens:', error);
      return [];
    }
  }

  // === LISTES PARTAGÉES ===

  // Créer une liste partagée
  static async createSharedList(coupleId: string, listData: Omit<SharedList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const listRef = await addDoc(collection(db, 'couples', coupleId, 'lists'), {
        ...listData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return listRef.id;
    } catch (error) {
      console.error('Error creating shared list:', error);
      throw new Error('Impossible de créer la liste');
    }
  }

  // Récupérer toutes les listes partagées
  static async getSharedLists(coupleId: string): Promise<SharedList[]> {
    try {
      const listsRef = collection(db, 'couples', coupleId, 'lists');
      const q = query(listsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedList));
    } catch (error) {
      console.error('Error getting shared lists:', error);
      return [];
    }
  }

  // Mettre à jour une liste partagée
  static async updateSharedList(coupleId: string, listId: string, updates: Partial<SharedList>): Promise<void> {
    try {
      const listRef = doc(db, 'couples', coupleId, 'lists', listId);
      await updateDoc(listRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating shared list:', error);
      throw new Error('Impossible de mettre à jour la liste');
    }
  }

  // Supprimer une liste partagée
  static async deleteSharedList(coupleId: string, listId: string): Promise<void> {
    try {
      const listRef = doc(db, 'couples', coupleId, 'lists', listId);
      await deleteDoc(listRef);
    } catch (error) {
      console.error('Error deleting shared list:', error);
      throw new Error('Impossible de supprimer la liste');
    }
  }

  // === NOTES COLLABORATIVES ===

  // Créer une note collaborative
  static async createCollaborativeNote(coupleId: string, noteData: Omit<CollaborativeNote, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
    try {
      const noteRef = await addDoc(collection(db, 'couples', coupleId, 'notes'), {
        ...noteData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1,
      });
      return noteRef.id;
    } catch (error) {
      console.error('Error creating collaborative note:', error);
      throw new Error('Impossible de créer la note');
    }
  }

  // Récupérer toutes les notes collaboratives
  static async getCollaborativeNotes(coupleId: string): Promise<CollaborativeNote[]> {
    try {
      const notesRef = collection(db, 'couples', coupleId, 'notes');
      const q = query(notesRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollaborativeNote));
    } catch (error) {
      console.error('Error getting collaborative notes:', error);
      return [];
    }
  }

  // Mettre à jour une note collaborative
  static async updateCollaborativeNote(coupleId: string, noteId: string, updates: Partial<CollaborativeNote>): Promise<void> {
    try {
      const noteRef = doc(db, 'couples', coupleId, 'notes', noteId);
      const currentNote = await getDoc(noteRef);
      const currentVersion = currentNote.data()?.version || 1;
      
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        version: currentVersion + 1,
      });
    } catch (error) {
      console.error('Error updating collaborative note:', error);
      throw new Error('Impossible de mettre à jour la note');
    }
  }

  // Supprimer une note collaborative
  static async deleteCollaborativeNote(coupleId: string, noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, 'couples', coupleId, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting collaborative note:', error);
      throw new Error('Impossible de supprimer la note');
    }
  }

  // === SYNCHRONISATION TEMPS RÉEL BUDGET ===

  // Écouter les transactions en temps réel
  static subscribeToTransactions(
    coupleId: string,
    year: number,
    month: number,
    callback: (transactions: Transaction[]) => void
  ): Unsubscribe {
    const transactionsRef = collection(db, 'couples', coupleId, 'transactions');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const q = query(
      transactionsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      
      callback(transactions);
    });
  }

  // Récupérer les catégories personnalisées
  static async getCustomCategories(coupleId: string): Promise<string[]> {
    try {
      const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
      if (coupleDoc.exists()) {
        const data = coupleDoc.data();
        return data.customCategories || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting custom categories:', error);
      return [];
    }
  }

  // Ajouter une catégorie personnalisée
  static async addCustomCategory(coupleId: string, category: string): Promise<void> {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (coupleDoc.exists()) {
        const data = coupleDoc.data();
        const customCategories = data.customCategories || [];
        
        if (!customCategories.includes(category)) {
          await updateDoc(coupleRef, {
            customCategories: [...customCategories, category],
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error adding custom category:', error);
      throw new Error('Impossible d\'ajouter la catégorie');
    }
  }

  // Mettre à jour une catégorie
  static async updateCategory(coupleId: string, oldCategory: string, newCategory: string): Promise<void> {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (coupleDoc.exists()) {
        const data = coupleDoc.data();
        const customCategories = data.customCategories || [];
        const updatedCategories = customCategories.map((cat: string) => 
          cat === oldCategory ? newCategory : cat
        );
        
        await updateDoc(coupleRef, {
          customCategories: updatedCategories,
          updatedAt: serverTimestamp()
        });

        // Mettre à jour toutes les transactions avec cette catégorie
        const transactionsRef = collection(db, 'couples', coupleId, 'transactions');
        const q = query(transactionsRef, where('category', '==', oldCategory));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { category: newCategory });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Impossible de mettre à jour la catégorie');
    }
  }

  // Supprimer une catégorie
  static async deleteCategory(coupleId: string, category: string): Promise<void> {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (coupleDoc.exists()) {
        const data = coupleDoc.data();
        const customCategories = data.customCategories || [];
        const updatedCategories = customCategories.filter((cat: string) => cat !== category);
        
        await updateDoc(coupleRef, {
          customCategories: updatedCategories,
          updatedAt: serverTimestamp()
        });

        // Mettre à jour toutes les transactions avec cette catégorie vers 'general'
        const transactionsRef = collection(db, 'couples', coupleId, 'transactions');
        const q = query(transactionsRef, where('category', '==', category));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { category: 'general' });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Impossible de supprimer la catégorie');
    }
  }

  // === SYNCHRONISATION TEMPS RÉEL AGENDA ===

  // Écouter les événements en temps réel
  static subscribeToEvents(
    coupleId: string,
    callback: (events: AgendaEvent[]) => void
  ): Unsubscribe {
    const eventsRef = collection(db, 'couples', coupleId, 'events');
    const q = query(eventsRef, orderBy('startDate', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AgendaEvent));
      
      callback(events);
    });
  }

  // === SYNCHRONISATION TEMPS RÉEL LISTES ===

  // Écouter les listes partagées en temps réel
  static subscribeToSharedLists(
    coupleId: string,
    callback: (lists: SharedList[]) => void
  ): Unsubscribe {
    const listsRef = collection(db, 'couples', coupleId, 'lists');
    const q = query(listsRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SharedList));
      
      callback(lists);
    });
  }

  // === SYNCHRONISATION TEMPS RÉEL NOTES ===

  // Écouter les notes collaboratives en temps réel
  static subscribeToCollaborativeNotes(
    coupleId: string,
    callback: (notes: CollaborativeNote[]) => void
  ): Unsubscribe {
    const notesRef = collection(db, 'couples', coupleId, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CollaborativeNote));
      
      callback(notes);
    });
  }

  // === SYNCHRONISATION TEMPS RÉEL CAPSULES ===

  // Écouter les capsules en temps réel
  static subscribeToTimeCapsules(
    coupleId: string,
    callback: (capsules: TimeCapsule[]) => void
  ): Unsubscribe {
    const capsulesRef = collection(db, 'couples', coupleId, 'capsules');
    const q = query(capsulesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const capsules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TimeCapsule));
      
      callback(capsules);
    });
  }
}
