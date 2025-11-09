import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ChatService } from '../../services/chatService';
import { Chat } from '../../types';
import { useAuth } from '../../AuthContext';

const ChatListScreen = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadChats();
      
      // Escutar mudanças em tempo real
      const unsubscribe = ChatService.subscribeToUserChats(user.id, (updatedChats) => {
        setChats(updatedChats);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    
    try {
      const userChats = await ChatService.getUserChats(user.id);
      setChats(userChats);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      Alert.alert('Erro', 'Não foi possível carregar as conversas');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const renderChat = ({ item: chat }: { item: Chat }) => {
    const isUnread = chat.lastMessage && 
      chat.lastMessage.receiverId === user?.id && 
      !chat.lastMessage.isRead;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat' as never, { 
          chatId: chat.id, 
          itemTitle: chat.itemTitle 
        } as never)}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>
            {chat.itemTitle.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {chat.itemTitle}
            </Text>
            {chat.lastMessage && (
              <Text style={[
                styles.chatTime,
                isUnread && styles.unreadTime
              ]}>
                {formatTime(chat.lastMessage.timestamp)}
              </Text>
            )}
          </View>

          {chat.lastMessage && (
            <View style={styles.chatPreview}>
              <Text 
                style={[
                  styles.lastMessage,
                  isUnread && styles.unreadMessage
                ]}
                numberOfLines={2}
              >
                {chat.lastMessage.message}
              </Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conversas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Carregando conversas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
          <Text style={styles.emptySubtext}>
            Inicie uma conversa com um vendedor clicando em "Falar com Vendedor"
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadTime: {
    color: '#6200ea',
    fontWeight: '600',
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200ea',
    marginLeft: 8,
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
    lineHeight: 20,
  },
});

export default ChatListScreen;