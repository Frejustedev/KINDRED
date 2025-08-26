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
      // Vérifier que l'email du partenaire n'est pas celui de l'utilisateur actuel
      const currentUserDoc = await getDoc(doc(db, 'users', userId1));
      if (!currentUserDoc.exists()) {
        throw new Error('Utilisateur actuel non trouvé');
      }
      
      const currentUserData = currentUserDoc.data() as UserProfile;
      if (currentUserData.email.toLowerCase() === partnerEmail.toLowerCase()) {
        throw new Error('Vous ne pouvez pas vous inviter vous-même');
      }

      // Vérifier que l'email du partenaire correspond à un utilisateur existant
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

      // Vérifier que le partenaire n'est pas déjà dans un couple
      if (partnerData.coupledWith) {
        throw new Error('Cette personne est déjà dans un couple');
      }

      // Hasher le PIN
      const hashedPin = await EncryptionService.hashPin(pin);
      
      const coupleData: Partial<Couple> = {
        users: [userId1, partnerId], // Ajouter directement les deux utilisateurs
        pin: hashedPin,
        startDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        topics: ['général', 'voyage', 'budget', 'surprises'],
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
      
      // Mettre à jour les profils des deux utilisateurs
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId1), { coupledWith: coupleRef.id });
      batch.update(doc(db, 'users', partnerId), { coupledWith: coupleRef.id });
      await batch.commit();

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

  // Rejoindre un couple existant
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

  // Quitter un couple
  static async leaveCouple(userId: string, coupleId: string): Promise<void> {
    try {
      const couple = await this.getCouple(coupleId);
      
      // Vérifier que l'utilisateur est bien dans ce couple
      if (!couple.users.includes(userId)) {
        throw new Error('Vous n\'êtes pas membre de ce couple');
      }

      // Si c'est le dernier membre, supprimer le couple
      if (couple.users.length === 1) {
        await deleteDoc(doc(db, 'couples', coupleId));
      } else {
        // Sinon, retirer l'utilisateur du couple
        const updatedUsers = couple.users.filter(id => id !== userId);
        await updateDoc(doc(db, 'couples', coupleId), {
          users: updatedUsers
        });
      }

      // Retirer la référence du couple du profil utilisateur
      await updateDoc(doc(db, 'users', userId), {
        coupledWith: null
      });

    } catch (error) {
      console.error('Error leaving couple:', error);
      throw error;
    }
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
    
    // Vérifier si le topic existe
    if (!currentTopics.includes(topicName)) {
      throw new Error('Topic introuvable');
    }
    
    // Empêcher la suppression du topic principal
    if (topicName === 'général') {
      throw new Error('Le topic principal ne peut pas être supprimé');
    }
    
    // Supprimer le topic
    const updatedTopics = currentTopics.filter((topic: string) => topic !== topicName);
    
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
