import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ItemService } from '../../services/itemService';
import { ArtItem, FilterOptions } from '../../types';
import { useAuth } from '../../AuthContext';

const HomeScreen = () => {
  const [items, setItems] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setItems([]);
        setLastDoc(null);
        setHasMore(true);
      }

      const result = await ItemService.getItems(filters, isRefresh ? undefined : lastDoc);
      
      if (isRefresh) {
        setItems(result.items);
      } else {
        setItems(prev => [...prev, ...result.items]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.items.length === 20);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Não foi possível carregar os itens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, lastDoc]);

  useEffect(() => {
    loadItems(true);
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems(true);
  }, [loadItems]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadItems(false);
    }
  }, [hasMore, loading, loadItems]);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: ArtItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail' as never, { itemId: item.id } as never)}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/300x200' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.itemMeta}>
          <View style={styles.typeContainer}>
            <Text style={[styles.typeText, { backgroundColor: getTypeColor(item.type) }]}>
              {getTypeLabel(item.type)}
            </Text>
          </View>
          {item.price !== undefined && (
            <Text style={styles.priceText}>
              R$ {item.price.toFixed(2)}
            </Text>
          )}
        </View>
        <Text style={styles.sellerText}>por {item.sellerName}</Text>
      </View>
    </TouchableOpacity>
  );

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

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.filterCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filtros</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.filterClear}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Tipo</Text>
            {['venda', 'aluguel', 'doacao'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterOption,
                  filters.type === type && styles.filterOptionSelected
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  type: filters.type === type ? undefined : type as any 
                }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.type === type && styles.filterOptionTextSelected
                ]}>
                  {getTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categoria</Text>
            {['pintura', 'escultura', 'desenho', 'fotografia', 'outros'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterOption,
                  filters.category === category && styles.filterOptionSelected
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  category: filters.category === category ? undefined : category as any 
                }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.category === category && styles.filterOptionTextSelected
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => applyFilters(filters)}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artsc</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateItem' as never)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar materiais de arte..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#6200ea" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum item encontrado</Text>
              <Text style={styles.emptySubtext}>
                Tente ajustar os filtros ou buscar por outros termos
              </Text>
            </View>
          ) : null
        }
      />

      <FilterModal />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#6200ea',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemInfo: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  sellerText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  filterModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterCancel: {
    fontSize: 16,
    color: '#666',
  },
  filterClear: {
    fontSize: 16,
    color: '#6200ea',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#6200ea',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  filterFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;