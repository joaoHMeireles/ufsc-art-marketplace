import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ItemService } from '../../services/itemService';
import { ArtItem } from '../../types';
import { useAuth } from '../../AuthContext';

const MyItemsScreen = () => {
  const [items, setItems] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArtItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    if (!user) return;
    
    try {
      const userItems = await ItemService.getUserItems(user.id);
      setItems(userItems);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus itens');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, []);

  const handleItemPress = (item: ArtItem) => {
    setSelectedItem(item);
    setShowActionModal(true);
  };

  const handleEditItem = () => {
    if (selectedItem) {
      setShowActionModal(false);
      Alert.alert('Editar', 'Funcionalidade em desenvolvimento');
    }
  };

  const handleToggleAvailability = async () => {
    if (!selectedItem) return;

    try {
      await ItemService.updateItem(selectedItem.id, {
        isAvailable: !selectedItem.isAvailable
      });
      
      setItems(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, isAvailable: !item.isAvailable }
          : item
      ));
      
      setShowActionModal(false);
      Alert.alert(
        'Sucesso', 
        `Item ${selectedItem.isAvailable ? 'ocultado' : 'publicado'} com sucesso!`
      );
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o item');
    }
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;

    Alert.alert(
      'Excluir Item',
      'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: confirmDeleteItem
        }
      ]
    );
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await ItemService.deleteItem(selectedItem.id);
      
      setItems(prev => prev.filter(item => item.id !== selectedItem.id));
      
      setShowActionModal(false);
      Alert.alert('Sucesso', 'Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      Alert.alert('Erro', 'Não foi possível excluir o item');
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

  const renderItem = ({ item }: { item: ArtItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/300x200' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isAvailable ? '#4caf50' : '#f44336' }
          ]}>
            <Text style={styles.statusText}>
              {item.isAvailable ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.itemMeta}>
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

        <Text style={styles.itemDate}>
          Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
          
          <TouchableOpacity
            style={styles.modalOption}
            onPress={handleEditItem}
          >
            <Ionicons name="create-outline" size={20} color="#6200ea" />
            <Text style={styles.modalOptionText}>Editar Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={handleToggleAvailability}
          >
            <Ionicons 
              name={selectedItem?.isAvailable ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#ff9800" 
            />
            <Text style={styles.modalOptionText}>
              {selectedItem?.isAvailable ? 'Ocultar Item' : 'Publicar Item'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={handleDeleteItem}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
            <Text style={[styles.modalOptionText, { color: '#f44336' }]}>
              Excluir Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowActionModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Itens</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateItem' as never)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Você ainda não tem itens</Text>
          <Text style={styles.emptySubtext}>
            Toque no botão + para criar seu primeiro item
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => navigation.navigate('CreateItem' as never)}
          >
            <Text style={styles.createFirstButtonText}>Criar Primeiro Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ActionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6200ea',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  itemInfo: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
});

export default MyItemsScreen;