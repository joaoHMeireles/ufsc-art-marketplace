import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ItemService } from '../../services/itemService';
import { useAuth } from '../../AuthContext';

const CreateItemScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'venda' | 'aluguel' | 'doacao'>('venda');
  const [category, setCategory] = useState<'pintura' | 'escultura' | 'desenho' | 'fotografia' | 'outros'>('pintura');
  const [condition, setCondition] = useState<'novo' | 'usado' | 'precisa_restauro'>('usado');
  const [images, setImages] = useState<string[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();

  const typeOptions = [
    { key: 'venda', label: 'Venda' },
    { key: 'aluguel', label: 'Aluguel' },
    { key: 'doacao', label: 'Doação' },
  ];

  const categoryOptions = [
    { key: 'pintura', label: 'Pintura' },
    { key: 'escultura', label: 'Escultura' },
    { key: 'desenho', label: 'Desenho' },
    { key: 'fotografia', label: 'Fotografia' },
    { key: 'outros', label: 'Outros' },
  ];

  const conditionOptions = [
    { key: 'novo', label: 'Novo' },
    { key: 'usado', label: 'Usado' },
    { key: 'precisa_restauro', label: 'Precisa Restauro' },
  ];

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 imagens');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma imagem');
      return;
    }

    if (type !== 'doacao' && !price) {
      Alert.alert('Erro', 'Para venda e aluguel, é necessário informar o preço');
      return;
    }

    setLoading(true);
    try {
      // Upload das imagens
      const base64Images = await Promise.all(images.map(uri => imageToBase64(uri)))

      // Criar item
      const itemData = {
        title,
        description,
        price: type !== 'doacao' ? parseFloat(price) : undefined,
        type,
        category,
        images: base64Images,
        condition,
        sellerId: user!.id,
        sellerName: user!.name,
        sellerPhone: user!.phone,
        isAvailable: true,
      };

      await ItemService.createItem(itemData);
      
      Alert.alert('Sucesso', 'Item criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      Alert.alert('Erro', 'Não foi possível criar o item');
    } finally {
      setLoading(false);
    }
  };

  async function imageToBase64(imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const getTypeLabel = (typeKey: string) => {
    return typeOptions.find(option => option.key === typeKey)?.label || typeKey;
  };

  const getCategoryLabel = (categoryKey: string) => {
    return categoryOptions.find(option => option.key === categoryKey)?.label || categoryKey;
  };

  const getConditionLabel = (conditionKey: string) => {
    return conditionOptions.find(option => option.key === conditionKey)?.label || conditionKey;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Imagens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagens *</Text>
          <Text style={styles.sectionSubtitle}>Adicione até 5 fotos do item</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#6200ea" />
                  <Text style={styles.addImageText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Informações básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do item"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva o item detalhadamente"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Categoria e tipo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria e Tipo</Text>
          
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={styles.selectorLabel}>Tipo</Text>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorValue}>{getTypeLabel(type)}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.selectorLabel}>Categoria</Text>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorValue}>{getCategoryLabel(category)}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowConditionModal(true)}
          >
            <Text style={styles.selectorLabel}>Estado</Text>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorValue}>{getConditionLabel(condition)}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Preço */}
        {type !== 'doacao' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preço</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Valor (R$) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Botão de criar */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Criando...' : 'Criar Item'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modais de seleção */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Tipo</Text>
            <FlatList
              data={typeOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setType(item.key as any);
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {type === item.key && (
                    <Ionicons name="checkmark" size={20} color="#6200ea" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.key}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <FlatList
              data={categoryOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setCategory(item.key as any);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {category === item.key && (
                    <Ionicons name="checkmark" size={20} color="#6200ea" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.key}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showConditionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Estado</Text>
            <FlatList
              data={conditionOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setCondition(item.key as any);
                    setShowConditionModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {condition === item.key && (
                    <Ionicons name="checkmark" size={20} color="#6200ea" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.key}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6200ea',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    color: '#6200ea',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectorButton: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  selectorValue: {
    fontSize: 16,
    color: '#333',
  },
  submitContainer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
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
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CreateItemScreen;