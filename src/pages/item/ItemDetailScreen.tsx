import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ItemService } from '../../services/itemService';
import { ChatService } from '../../services/chatService';
import { ArtItem } from '../../types';
import { useAuth } from '../../AuthContext';

const { width } = Dimensions.get('window');

const ItemDetailScreen = () => {
  const [item, setItem] = useState<ArtItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const { itemId } = route.params as { itemId: string };

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      const itemData = await ItemService.getItemById(itemId);
      setItem(itemData);
    } catch (error) {
      console.error('Erro ao carregar item:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do item');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!item || !user) return;

    try {
      const chatId = await ChatService.getOrCreateChat(
        user.id,
        item.sellerId,
        item.id,
        item.title
      );
      
      navigation.navigate('Chat' as never, { 
        chatId, 
        itemTitle: item.title 
      } as never);
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'venda': return 'Venda';
      case 'aluguel': return 'Aluguel';
      case 'doacao': return 'Doação';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'venda': return '#4caf50';
      case 'aluguel': return '#ff9800';
      case 'doacao': return '#2196f3';
      default: return '#666';
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'novo': return 'Novo';
      case 'usado': return 'Usado';
      case 'precisa_restauro': return 'Precisa Restauro';
      default: return condition;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>Item não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === item.sellerId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Galeria de imagens */}
        <View style={styles.imageContainer}>
          <FlatList
            data={item.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item: imageUrl }) => (
              <Image
                source={{ uri: imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          
          {item.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Header do item */}
          <View style={styles.itemHeader}>
            <View style={styles.typeContainer}>
              <Text style={[
                styles.typeText, 
                { backgroundColor: getTypeColor(item.type) }
              ]}>
                {getTypeLabel(item.type)}
              </Text>
            </View>
            {item.price !== undefined && (
              <Text style={styles.priceText}>
                R$ {item.price.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Título e descrição */}
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {/* Informações do item */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Informações</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="grid-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Categoria:</Text>
              <Text style={styles.infoValue}>{getCategoryLabel(item.category)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Estado:</Text>
              <Text style={styles.infoValue}>{getConditionLabel(item.condition)}</Text>
            </View>
          </View>

          {/* Informações do vendedor */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>
                  {item.sellerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{item.sellerName}</Text>
                {item.sellerPhone && (
                  <Text style={styles.sellerPhone}>{item.sellerPhone}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Data de publicação */}
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>
              Publicado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botão de ação */}
      {!isOwner && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSeller}
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Falar com Vendedor</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  itemImage: {
    width: width,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sellerSection: {
    marginBottom: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 14,
    color: '#666',
  },
  dateSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contactButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ItemDetailScreen;