import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Chat, ChatMessage } from '../types';

export class ChatService {
  private static readonly CHATS_COLLECTION = 'chats';
  private static readonly MESSAGES_COLLECTION = 'messages';

  static async getOrCreateChat(user1Id: string, user2Id: string, itemId: string, itemTitle: string): Promise<string> {
    const participants = [user1Id, user2Id].sort();
    
    const q = query(
      collection(db, this.CHATS_COLLECTION),
      where('participants', '==', participants),
      where('itemId', '==', itemId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    const chatData: Omit<Chat, 'id'> = {
      participants,
      itemId,
      itemTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, this.CHATS_COLLECTION), chatData);
    return docRef.id;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    const q = query(
      collection(db, this.CHATS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const chats: Chat[] = [];
    
    querySnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as Chat);
    });
    
    return chats;
  }

  static async sendMessage(
    chatId: string, 
    senderId: string, 
    receiverId: string, 
    message: string
  ): Promise<string> {
    const messageData: Omit<ChatMessage, 'id'> = {
      chatId,
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
      isRead: false,
    };
    
    const docRef = await addDoc(collection(db, this.MESSAGES_COLLECTION), messageData);
    
    await updateDoc(doc(db, this.CHATS_COLLECTION, chatId), {
      updatedAt: new Date(),
      lastMessage: messageData,
    });
    
    return docRef.id;
  }

  static async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    
    return messages;
  }

  static subscribeToChatMessages(
    chatId: string, 
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      callback(messages);
    });
  }

  static subscribeToUserChats(
    userId: string, 
    callback: (chats: Chat[]) => void
  ): () => void {
    const q = query(
      collection(db, this.CHATS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const chats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      callback(chats);
    });
  }

  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(updatePromises);
  }

  static async deleteChat(chatId: string): Promise<void> {
    const messagesQuery = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('chatId', '==', chatId)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const deleteMessagePromises = messagesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deleteMessagePromises);
    
    await deleteDoc(doc(db, this.CHATS_COLLECTION, chatId));
  }

  static async getChatById(chatId: string): Promise<Chat | null> {
    const docRef = doc(db, this.CHATS_COLLECTION, chatId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Chat;
    }
    return null;
  }

  static async getUnreadMessageCount(userId: string): Promise<number> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }
}