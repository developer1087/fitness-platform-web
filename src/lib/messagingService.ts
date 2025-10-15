import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'trainer' | 'trainee';
  recipientId: string;
  recipientName: string;
  content: string;
  type: 'text' | 'image' | 'workout' | 'session_update' | 'progress_share';
  timestamp: string;
  isRead: boolean;
  metadata?: {
    workoutId?: string;
    sessionId?: string;
    imageUrl?: string;
    progressData?: any;
  };
}

export interface Conversation {
  id: string;
  trainerId: string;
  trainerName: string;
  traineeId: string;
  traineeName: string;
  lastMessage: Message | null;
  unreadCount: number;
  lastActivity: string;
  isActive: boolean;
}

class MessagingService {
  private readonly CONVERSATIONS_COLLECTION = 'conversations';
  private readonly MESSAGES_COLLECTION = 'messages';

  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<Message> {
    try {
      const timestamp = new Date().toISOString();
      const message: Omit<Message, 'id'> = {
        ...messageData,
        timestamp,
        isRead: false
      };

      // Save message to Firestore
      const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
      const messageRef = await addDoc(messagesCollection, message);

      const savedMessage = { ...message, id: messageRef.id };

      // Update or create conversation
      await this.updateConversation(savedMessage);

      console.log('✅ Message sent:', messageRef.id);
      return savedMessage;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  private async updateConversation(message: Message): Promise<void> {
    try {
      const conversation: Conversation = {
        id: message.conversationId,
        trainerId: message.senderType === 'trainer' ? message.senderId : message.recipientId,
        trainerName: message.senderType === 'trainer' ? message.senderName : message.recipientName,
        traineeId: message.senderType === 'trainee' ? message.senderId : message.recipientId,
        traineeName: message.senderType === 'trainee' ? message.senderName : message.recipientName,
        lastMessage: message,
        unreadCount: 0,
        lastActivity: message.timestamp,
        isActive: true
      };

      // Update or create conversation in Firestore
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, message.conversationId);
      await setDoc(conversationRef, conversation, { merge: true });

      console.log('✅ Conversation updated:', message.conversationId);
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
      const q = query(
        messagesCollection,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const messagesSnapshot = await getDocs(q);

      const messages: Message[] = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      return messages;
    } catch (error) {
      console.error('❌ Error getting conversation messages:', error);
      return [];
    }
  }

  /**
   * Listen to new messages in real-time
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
    const q = query(
      messagesCollection,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        callback(messages);
      },
      (error) => {
        console.error('❌ Error listening to messages:', error);
      }
    );

    return unsubscribe;
  }

  async getUserConversations(userId: string, userType: 'trainer' | 'trainee'): Promise<Conversation[]> {
    try {
      const field = userType === 'trainer' ? 'trainerId' : 'traineeId';

      const conversationsCollection = collection(db, this.CONVERSATIONS_COLLECTION);
      const q = query(
        conversationsCollection,
        where(field, '==', userId),
        orderBy('lastActivity', 'desc')
      );
      const conversationsSnapshot = await getDocs(q);

      const conversations: Conversation[] = conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation));

      // Calculate unread counts for each conversation
      for (const conv of conversations) {
        const unreadCount = await this.getUnreadCount(conv.id, userId);
        conv.unreadCount = unreadCount;
      }

      return conversations;
    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Listen to conversations in real-time
   */
  subscribeToConversations(
    userId: string,
    userType: 'trainer' | 'trainee',
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const field = userType === 'trainer' ? 'trainerId' : 'traineeId';

    const conversationsCollection = collection(db, this.CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsCollection,
      where(field, '==', userId),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Conversation));

        // Calculate unread counts
        for (const conv of conversations) {
          const unreadCount = await this.getUnreadCount(conv.id, userId);
          conv.unreadCount = unreadCount;
        }

        callback(conversations);
      },
      (error) => {
        console.error('❌ Error listening to conversations:', error);
      }
    );

    return unsubscribe;
  }

  private async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
      const q = query(
        messagesCollection,
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      const unreadSnapshot = await getDocs(q);

      return unreadSnapshot.size;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Get unread messages for this user
      const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
      const q = query(
        messagesCollection,
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      const unreadSnapshot = await getDocs(q);

      // Batch update all unread messages
      const batch = writeBatch(db);
      unreadSnapshot.docs.forEach(document => {
        batch.update(document.ref, { isRead: true });
      });

      await batch.commit();
      console.log(`✅ Marked ${unreadSnapshot.size} messages as read`);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const messagesCollection = collection(db, this.MESSAGES_COLLECTION);
      const q = query(
        messagesCollection,
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      const unreadSnapshot = await getDocs(q);

      return unreadSnapshot.size;
    } catch (error) {
      console.error('❌ Error getting total unread count:', error);
      return 0;
    }
  }

  async createConversation(
    trainerId: string,
    trainerName: string,
    traineeId: string,
    traineeName: string
  ): Promise<string> {
    const conversationId = `conv_${trainerId}_${traineeId}`;

    const conversation: Conversation = {
      id: conversationId,
      trainerId,
      trainerName,
      traineeId,
      traineeName,
      lastMessage: null,
      unreadCount: 0,
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
    await setDoc(conversationRef, conversation, { merge: true });

    console.log('✅ Conversation created:', conversationId);
    return conversationId;
  }
}

export const messagingService = new MessagingService();
