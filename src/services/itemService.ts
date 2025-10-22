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
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ArtItem, FilterOptions } from '../types';

export class ItemService {
  private static readonly COLLECTION_NAME = 'items';

  // Criar novo item
  static async createItem(item: Omit<ArtItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const itemData = {
      ...item,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
    return docRef.id;
  }

  // Buscar item por ID
  static async getItemById(id: string): Promise<ArtItem | null> {
    const docRef = doc(db, this.COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ArtItem;
    }
    return null;
  }

  // Buscar todos os itens com filtros
  static async getItems(
    filters: FilterOptions = {}, 
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = 20
  ): Promise<{ items: ArtItem[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      where('isAvailable', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters.condition) {
      q = query(q, where('condition', '==', filters.condition));
    }

    const querySnapshot = await getDocs(q);
    const items: ArtItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const item = { id: doc.id, ...doc.data() } as ArtItem;
      
      // Aplicar filtro de preço no frontend (Firestore não suporta range queries complexas)
      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        if (item.price !== undefined) {
          if (min !== undefined && item.price < min) return;
          if (max !== undefined && item.price > max) return;
        }
      }
      
      items.push(item);
    });

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    return { 
      items, 
      lastDoc: lastVisible 
    };
  }

  // Buscar itens do usuário
  static async getUserItems(userId: string): Promise<ArtItem[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('sellerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const items: ArtItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ArtItem);
    });
    
    return items;
  }

  // Atualizar item
  static async updateItem(id: string, updates: Partial<ArtItem>): Promise<void> {
    const docRef = doc(db, this.COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Deletar item
  static async deleteItem(id: string): Promise<void> {
    const item = await this.getItemById(id);
    if (item) {
      // Deletar imagens do storage
      for (const imageUrl of item.images) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Erro ao deletar imagem:', error);
        }
      }
    }
    
    await deleteDoc(doc(db, this.COLLECTION_NAME, id));
  }

  // Upload de imagem
  static async uploadImage(imageUri: string, itemId: string, imageIndex: number): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, `items/${itemId}/image_${imageIndex}_${Date.now()}`);
    await uploadBytes(imageRef, blob);
    
    return await getDownloadURL(imageRef);
  }

  // Upload múltiplas imagens
  static async uploadImages(imageUris: string[], itemId: string): Promise<string[]> {
    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadImage(uri, itemId, index)
    );
    
    return Promise.all(uploadPromises);
  }

  // Marcar item como indisponível
  static async markAsUnavailable(id: string): Promise<void> {
    await this.updateItem(id, { isAvailable: false });
  }

  // Buscar itens por categoria
  static async getItemsByCategory(category: string): Promise<ArtItem[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('category', '==', category),
      where('isAvailable', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const items: ArtItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ArtItem);
    });
    
    return items;
  }

  // Buscar itens por tipo
  static async getItemsByType(type: 'venda' | 'aluguel' | 'doacao'): Promise<ArtItem[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('type', '==', type),
      where('isAvailable', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const items: ArtItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ArtItem);
    });
    
    return items;
  }
}