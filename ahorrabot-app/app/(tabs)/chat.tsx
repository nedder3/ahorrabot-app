// app/(tabs)/chat.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Linking,
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { useCart } from '../../context/cart-context';
import { fetchBotResponse, ChatMessage } from '../../services/openrouter';
import { VoiceMic } from '../../components/voice-mic';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MapViewComponent } from '../../components/map-view';
import { getUserLocation, getNearbyStores, GeolocatedStore } from '../../services/google-maps';
import { saveOrder } from '../../database/db';

// Styled Components
const MainWrapper = styled.View<{ isWide: boolean }>`
  flex: 1;
  flex-direction: ${props => props.isWide ? 'row' : 'column'};
  background-color: ${props => props.theme.colors.background};
`;

const ChatArea = styled.View`
  flex: 1;
`;

const AsideRight = styled.View`
  width: 360px;
  border-left-width: 1px;
  border-left-color: ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.glassBg};
  padding: 16px;
`;

const SidebarTitle = styled.Text`
  font-size: 14px;
  font-weight: 900;
  color: ${props => props.theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  margin-top: 10px;
`;

const MapWrapper = styled.View`
  height: 240px;
  border-radius: 16px;
  overflow: hidden;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  margin-bottom: 20px;
  background-color: #FAFBFD;
`;

const CartListWrapper = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
  border-radius: 16px;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  padding: 12px;
`;

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const ChatHeader = styled.View`
  padding: 16px 20px;
  background-color: rgba(220, 38, 38, 0.85);
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const BotAvatarImage = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.3);
  margin-right: 12px;
`;

const HeaderTitleContainer = styled.View``;

const HeaderTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
`;

const HeaderStatus = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.accent};
  font-weight: 700;
`;

const CartBadge = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${props => props.theme.colors.accent};
  border-radius: 12px;
  padding: 6px 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`;

const CartBadgeText = styled.Text`
  color: #0F172A;
  font-weight: bold;
  font-size: 12px;
  margin-left: 4px;
`;

const MessageList = styled.ScrollView.attrs({
  contentContainerStyle: {
    padding: 16,
    paddingBottom: 32,
  },
})``;

const BubbleContainer = styled.View<{ isUser: boolean }>`
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
  margin-vertical: 6px;
`;

const BubbleText = styled.Text<{ isUser: boolean }>`
  color: ${props => props.isUser ? props.theme.colors.textUser : props.theme.colors.textBot};
  font-size: 15px;
  line-height: 20px;
`;

const BubbleTime = styled.Text<{ isUser: boolean }>`
  font-size: 10px;
  color: ${props => props.isUser ? 'rgba(255,255,255,0.75)' : props.theme.colors.textSecondary};
  align-self: flex-end;
  margin-top: 4px;
`;

const BubbleCard = styled.View<{ isUser: boolean }>`
  background-color: ${props => props.isUser ? props.theme.colors.bubbleUser : props.theme.colors.bubbleBot};
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-right-radius: ${props => props.isUser ? '4px' : '18px'};
  border-bottom-left-radius: ${props => props.isUser ? '18px' : '4px'};
  border-width: 1px;
  border-color: ${props => props.isUser ? 'transparent' : props.theme.colors.border};
`;

const LoadingBubble = styled.View`
  background-color: ${props => props.theme.colors.bubbleBot};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
  flex-direction: row;
  align-items: center;
  margin-vertical: 6px;
  max-width: 80%;
`;

const SuggestionsRow = styled.ScrollView`
  max-height: 48px;
  background-color: ${props => props.theme.colors.card};
  border-top-width: 1px;
  border-top-color: ${props => props.theme.colors.border};
  padding-vertical: 8px;
  padding-horizontal: 16px;
`;

const SuggestionChip = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.background};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 16px;
  padding-vertical: 6px;
  padding-horizontal: 12px;
  margin-right: 8px;
  align-items: center;
  justify-content: center;
  height: 32px;
`;

const SuggestionText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  font-size: 13px;
`;

const InputBar = styled.View`
  padding: 12px 16px;
  background-color: ${props => props.theme.colors.card};
  border-top-width: 1px;
  border-top-color: ${props => props.theme.colors.border};
  flex-direction: row;
  align-items: center;
`;

const TextInputWrapper = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 24px;
  flex-direction: row;
  align-items: center;
  padding-horizontal: 16px;
  margin-right: 8px;
  height: 48px;
`;

const StyledTextInput = styled.TextInput`
  flex: 1;
  color: ${props => props.theme.colors.text};
  font-size: 15px;
  height: 100%;
`;

const SendButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primary};
  width: 48px;
  height: 48px;
  border-radius: 24px;
  justify-content: center;
  align-items: center;
`;

// FLOATING CART BUBBLE & DROPDOWN

const FloatingCartBubble = styled.TouchableOpacity`
  position: absolute;
  bottom: 80px;
  right: 20px;
  background-color: ${props => props.theme.colors.accent};
  border-radius: 30px;
  padding: 14px 20px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
  elevation: 6;
  border-width: 1.5px;
  border-color: #0F172A;
  z-index: 1000;
`;

const FloatingCartText = styled.Text`
  color: #0F172A;
  font-weight: 900;
  font-size: 13px;
  margin-left: 6px;
`;

const CartDropdown = styled.View`
  position: absolute;
  bottom: 145px;
  right: 20px;
  width: 320px;
  max-height: 400px;
  background-color: ${props => props.theme.colors.glassBg};
  border-radius: 20px;
  border-width: 2px;
  border-color: ${props => props.theme.colors.border};
  padding: 16px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 10px;
  elevation: 8;
  z-index: 1001;
`;

const DropdownHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  padding-bottom: 8px;
`;

const DropdownTitle = styled.Text`
  font-size: 15px;
  font-weight: 900;
  color: ${props => props.theme.colors.text};
`;

const CartListScroll = styled.ScrollView`
  max-height: 180px;
  margin-bottom: 12px;
`;

const CartItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 8px;
  border-bottom-width: 0.5px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const CartItemName = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  flex: 1;
`;

const CartItemQty = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-left: 10px;
`;

const BestStoreCard = styled.View`
  background-color: ${props => props.theme.colors.primaryLight};
  border-radius: 12px;
  padding: 10px 12px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.primary};
`;

const BestStoreText = styled.Text`
  font-size: 11px;
  font-weight: 700;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
`;

const BestStoreName = styled.Text`
  font-size: 14px;
  font-weight: 900;
  color: ${props => props.theme.colors.primary};
  margin-top: 2px;
`;

const BestStorePrice = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 4px;
`;

const CheckoutButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.accent};
  border-radius: 12px;
  padding: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  border-width: 1.5px;
  border-color: #0F172A;
`;

const CheckoutButtonText = styled.Text`
  color: #0F172A;
  font-weight: 900;
  font-size: 13px;
  margin-left: 6px;
  text-transform: uppercase;
`;

const EmptyCartText = styled.Text`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin-vertical: 16px;
  font-weight: 600;
`;

const FallbackNote = styled.View`
  background-color: #FFFBEB;
  border-width: 1px;
  border-color: #FDE68A;
  border-radius: 12px;
  padding: 10px;
  margin-top: 8px;
`;

const FallbackText = styled.Text`
  font-size: 11px;
  color: #B45309;
  line-height: 16px;
  font-weight: 500;
`;

const FallbackLink = styled.TouchableOpacity`
  margin-top: 6px;
`;

const FallbackLinkText = styled.Text`
  font-size: 11px;
  color: ${props => props.theme.colors.primary};
  font-weight: bold;
  text-decoration-line: underline;
`;

const DeliveryContainer = styled.View`
  margin-top: 10px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const DeliveryChip = styled.TouchableOpacity<{ bg: string }>`
  background-color: ${props => props.bg};
  padding: 6px 10px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: rgba(0,0,0,0.05);
`;

const DeliveryChipText = styled.Text`
  font-size: 10px;
  font-weight: bold;
  color: #FFFFFF;
`;

const renderMessageText = (text: string, isUser: boolean) => {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const linkText = match[1];
    const linkUrl = match[2];

    parts.push(
      <Text
        key={matchIndex}
        style={{
          textDecorationLine: 'underline',
          color: isUser ? '#FFFFFF' : '#0F62FE',
          fontWeight: 'bold',
        }}
        onPress={() => {
          Linking.openURL(linkUrl).catch(err =>
            console.error('Failed to open URL:', err)
          );
        }}
      >
        {linkText}
      </Text>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export default function ChatScreen() {
  const { cards, user } = useAuth();
  const { theme } = useAppTheme();
  const { cart, addToCart, removeFromCart, clearCart, calculateCartTotals, pricesVersion } = useCart();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handleGenerateOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Debés iniciar sesión para generar un pedido.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Cargá algunos productos en el carrito primero.');
      return;
    }

    const bestOption = calculations[0];
    if (!bestOption) {
      Alert.alert('Error', 'No pudimos calcular el supermercado más económico.');
      return;
    }

    Alert.alert(
      'Generar Pedido',
      `¿Querés generar la lista de compras para ${bestOption.storeName} por un total de $${bestOption.totalPrice}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              const orderItems = cart.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity
              }));

              const worstOption = calculations[calculations.length - 1];
              const savings = (worstOption && bestOption) ? Math.max(0, worstOption.totalPrice - bestOption.totalPrice) : 0;

              await saveOrder(
                user.id,
                JSON.stringify(orderItems),
                bestOption.storeName,
                bestOption.totalPrice,
                savings
              );

              // Clear the cart to start empty
              clearCart();

              // Reset chatbot messages for a fresh session
              const defaultGreeting: { sender: 'user' | 'bot'; text: string; time: string } = {
                sender: 'bot',
                text: '¡Pedido generado con éxito! 🛍️✨ Tu compra fue guardada en la pestaña "Mis Pedidos".\n\nComenzamos una nueva sesión. ¿Qué otros productos andás buscando ahorrar hoy? 🛒🤖',
                time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              };
              setMessages([defaultGreeting]);

              Alert.alert(
                '¡Pedido Generado! 🎉',
                `Tu lista optimizada para ${bestOption.storeName} por $${bestOption.totalPrice} se guardó en "Mis Pedidos".`,
                [
                  {
                    text: 'Ver Mis Pedidos 📋',
                    onPress: () => router.push('/orders' as any),
                  },
                  { text: 'Aceptar', style: 'default' }
                ]
              );
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Hubo un problema al guardar tu pedido.');
            }
          }
        }
      ]
    );
  };

  const handleNewSession = () => {
    Alert.alert(
      'Nueva Sesión',
      '¿Querés vaciar el carrito actual y reiniciar la charla con AhorraBot?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            clearCart();
            setMessages([
              {
                sender: 'bot',
                text: '¡Sesión reiniciada! 🤖✨ ¿En qué te ayudo a ahorrar hoy? Escribime los productos que buscás o decime tus tarjetas. 🛒💳',
                time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }
      ]
    );
  };
  
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: '¡Hola che! 🤖🇦🇷 Soy AhorraBot, tu asistente inteligente de ahorro de Bahía Blanca.\n\n¿Qué andás queriendo comprar hoy? 🛒 (ej. fideos, arroz, leche entera, agua mineral, manteca, yerba, detergente).\n\nDecime qué productos buscás o qué tarjetas tenés 💳 y te calculo al toque si conviene ir a La Coope 🛒, Carrefour 🏪, ChangoMás 🛍️ o Vea 🥑. ¡Te ayudo a cuidar el mango! 💸✨',
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<any>(null);
  const [isMicListening, setIsMicListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handlePressMic = () => {
    inputRef.current?.focus();
  };

  const [cartOpen, setCartOpen] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<GeolocatedStore[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);

  const isWide = width > 768;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCapitalizedDay = () => {
    const rawDay = new Date().toLocaleDateString('es-AR', { weekday: 'long' });
    return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  };
  const currentDay = getCapitalizedDay();

  // Load user location on mount for sidebar map
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getUserLocation();
        setUserCoords(loc);
        setNearbyStores(getNearbyStores(loc.latitude, loc.longitude));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchLocation();
  }, []);

  // Update calculations when cart or cards change
  useEffect(() => {
    const results = calculateCartTotals(currentDay, cards);
    setCalculations(results);
  }, [cart, cards, pricesVersion]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text, time: currentTime }]);
    if (!textToSend) setInput('');
    setBotLoading(true);

    try {
      const apiHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      apiHistory.push({ role: 'user', content: text });

      const botResponse = await fetchBotResponse(apiHistory, cards, currentDay, cart);
      
      // Parse chatbot cart trigger commands
      let cleanText = botResponse;
      let match;

      // ADD_TO_CART Command parsing
      const addRegex = /\[ADD_TO_CART:\s*(\w+)\]/g;
      while ((match = addRegex.exec(botResponse)) !== null) {
        addToCart(match[1]);
      }
      cleanText = cleanText.replace(addRegex, '');

      // REMOVE_FROM_CART Command parsing
      const removeRegex = /\[REMOVE_FROM_CART:\s*(\w+)\]/g;
      while ((match = removeRegex.exec(botResponse)) !== null) {
        removeFromCart(match[1]);
      }
      cleanText = cleanText.replace(removeRegex, '');

      // CLEAR_CART Command parsing
      if (botResponse.includes('[CLEAR_CART]')) {
        clearCart();
        cleanText = cleanText.replace(/\[CLEAR_CART\]/g, '');
      }

      cleanText = cleanText.trim();
      
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: cleanText || '¡Entendido, che! 👍🛒',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Che, se me complicó conectar con mi servidor. 🥺 Reintentá en un ratito, ¡porfa! 🔌💥',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setBotLoading(false);
    }
  };

  const handleListeningChange = useCallback((listening: boolean) => {
    setIsMicListening(listening);
    if (Platform.OS !== 'web') {
      setShowSuggestions(listening);
    }
  }, []);

  const handleSpeechResult = useCallback((text: string) => {
    setInput(text);
  }, []);

  const nativeVoiceShortcuts = [
    '¿Dónde compro fideos baratos hoy?',
    '¿Qué supermercado tiene descuento con Cuenta DNI?',
    '¿Cuánto cuesta la yerba en Carrefour y en Coto?',
    '¿Dónde está el arroz al mejor precio?',
    '¿Qué promociones hay en el super hoy?'
  ];

  const showPossibleStoresAlert = () => {
    Alert.alert(
      'Negocios Disponibles',
      'Podés encontrar estos productos en Bahía Blanca directamente en:\n\n• Cooperativa Obrera (La Coope)\n• Carrefour Market\n• Vea Supermercados\n• Hiper ChangoMás',
      [{ text: 'Entendido 👍' }]
    );
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, botLoading]);

  const bestOption = calculations[0];

  return (
    <MainWrapper isWide={isWide}>
      {/* LEFT/CENTER CHAT AREA */}
      <ChatArea>
        <Container>
          <ChatHeader>
            <HeaderLeft>
              <BotAvatarImage source={require('../../assets/images/ahorrabot_logo.png')} />
              <HeaderTitleContainer>
                <HeaderTitle>AhorraBot Bahía 🤖💬</HeaderTitle>
                <HeaderStatus>En línea • Comparando precios en tiempo real ⚡️🛍️</HeaderStatus>
              </HeaderTitleContainer>
            </HeaderLeft>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity 
                onPress={handleNewSession}
                style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Cart Button top-right (only shown on mobile) */}
              {!isWide && (
                <CartBadge onPress={() => setCartOpen(!cartOpen)}>
                  <Ionicons name="cart" size={16} color="#0F172A" />
                  <CartBadgeText>{cartItemCount} items</CartBadgeText>
                </CartBadge>
              )}
            </View>
          </ChatHeader>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <MessageList ref={scrollViewRef}>
              {messages.map((msg, index) => (
                <BubbleContainer key={index} isUser={msg.sender === 'user'}>
                  <BubbleCard isUser={msg.sender === 'user'}>
                    <BubbleText isUser={msg.sender === 'user'}>
                      {renderMessageText(msg.text, msg.sender === 'user')}
                    </BubbleText>
                    <BubbleTime isUser={msg.sender === 'user'}>{msg.time}</BubbleTime>
                  </BubbleCard>
                </BubbleContainer>
              ))}

              {botLoading && (
                <LoadingBubble>
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                    Calculando tu ahorro... 🧮⚡️🛒
                  </Text>
                </LoadingBubble>
              )}
            </MessageList>

            {showSuggestions && (
              <SuggestionsRow horizontal showsHorizontalScrollIndicator={false}>
                {nativeVoiceShortcuts.map((shortcut, index) => (
                  <SuggestionChip
                    key={index}
                    onPress={() => {
                      setInput(shortcut);
                      setShowSuggestions(false);
                    }}
                  >
                    <SuggestionText>🗣️ &quot;{shortcut}&quot;</SuggestionText>
                  </SuggestionChip>
                ))}
              </SuggestionsRow>
            )}

            <InputBar>
              <TextInputWrapper style={isMicListening ? { borderColor: theme.colors.primary } : {}}>
                <StyledTextInput
                  // @ts-ignore
                  ref={inputRef}
                  placeholder={isMicListening ? "🎙️ Escuchando... Hablá ahora" : "Escribí o decile algo al bot... ✍️🎙️"}
                  placeholderTextColor={isMicListening ? theme.colors.primary : theme.colors.textSecondary}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                />
                <VoiceMic 
                  onSpeechResult={handleSpeechResult} 
                  onListeningChange={handleListeningChange} 
                  onPressMic={handlePressMic}
                />
              </TextInputWrapper>
              
              <SendButton onPress={() => handleSend()}>
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </SendButton>
            </InputBar>
          </KeyboardAvoidingView>
        </Container>
      </ChatArea>

      {/* RIGHT SIDEBAR (ASIDE DERECHO) - Only displayed on Wide Screens (e.g. Web) */}
      {isWide && (
        <AsideRight>
          <SidebarTitle>📍 Mapa de Negocios en Bahía 🗺️</SidebarTitle>
          <MapWrapper>
            {loadingLocation ? (
              <View style={styles.loadingMap}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>Cargando mapa... 🗺️</Text>
              </View>
            ) : (
              <MapViewComponent
                userLat={userCoords!.latitude}
                userLng={userCoords!.longitude}
                stores={nearbyStores}
              />
            )}
          </MapWrapper>

          <SidebarTitle>🛒 Carrito Activo (Lista) 📋</SidebarTitle>
          <CartListWrapper>
            {cart.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="cart-outline" size={40} color={theme.colors.textSecondary} />
                <EmptyCartText>El carrito está vacío. 🛒</EmptyCartText>
                <FallbackNote>
                  <FallbackText>
                    💡 ¿No encontrás tus productos en el catálogo? Buscalos en delivery o supermercados locales:
                  </FallbackText>
                  <DeliveryContainer>
                    <DeliveryChip bg="#E2004F" onPress={() => Linking.openURL('https://www.pedidosya.com.ar/')}>
                      <DeliveryChipText>🏍️ PedidosYa</DeliveryChipText>
                    </DeliveryChip>
                    <DeliveryChip bg="#FF5E3A" onPress={() => Linking.openURL('https://www.rappi.com.ar/')}>
                      <DeliveryChipText>🛵 Rappi</DeliveryChipText>
                    </DeliveryChip>
                    <DeliveryChip bg="#005691" onPress={() => Linking.openURL('https://www.lacoopeencasa.coop/')}>
                      <DeliveryChipText>🛒 La Coope</DeliveryChipText>
                    </DeliveryChip>
                    <DeliveryChip bg="#00509E" onPress={() => Linking.openURL('https://www.carrefour.com.ar/')}>
                      <DeliveryChipText>🏪 Carrefour</DeliveryChipText>
                    </DeliveryChip>
                    <DeliveryChip bg="#4CAF50" onPress={() => Linking.openURL('https://www.vea.com.ar/')}>
                      <DeliveryChipText>🥑 Vea</DeliveryChipText>
                    </DeliveryChip>
                    <DeliveryChip bg="#0033A0" onPress={() => Linking.openURL('https://www.masonline.com.ar/')}>
                      <DeliveryChipText>🛍️ ChangoMás</DeliveryChipText>
                    </DeliveryChip>
                  </DeliveryContainer>
                </FallbackNote>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <CartListScroll showsVerticalScrollIndicator={false}>
                  {cart.map(item => (
                    <CartItemRow key={item.productId}>
                      <CartItemName>📦 {item.name}</CartItemName>
                      <CartItemQty>x{item.quantity}</CartItemQty>
                    </CartItemRow>
                  ))}
                </CartListScroll>
                {bestOption && (
                  <>
                    <BestStoreCard>
                      <BestStoreText>🏆 Compra más barata:</BestStoreText>
                      <BestStoreName>✨ {bestOption.storeName}</BestStoreName>
                      <BestStorePrice>💰 Total: ${bestOption.totalPrice}</BestStorePrice>
                    </BestStoreCard>
                    <CheckoutButton onPress={handleGenerateOrder}>
                      <Ionicons name="receipt-outline" size={16} color="#0F172A" />
                      <CheckoutButtonText>Generar Pedido</CheckoutButtonText>
                    </CheckoutButton>
                  </>
                )}
              </View>
            )}
          </CartListWrapper>
        </AsideRight>
      )}

      {/* FLOATING CART BUBBLE (Toggles popover dropdown on mobile and web) */}
      {!isWide && (
        <>
          <FloatingCartBubble onPress={() => setCartOpen(!cartOpen)}>
            <Ionicons name="cart" size={20} color="#0F172A" />
            <FloatingCartText>Ver Carrito ({cartItemCount}) 🛒</FloatingCartText>
          </FloatingCartBubble>

          {cartOpen && (
            <CartDropdown>
              <DropdownHeader>
                <DropdownTitle>🛒 Carrito Activo</DropdownTitle>
                <TouchableOpacity onPress={() => setCartOpen(false)}>
                  <Ionicons name="close" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </DropdownHeader>

              {cart.length === 0 ? (
                <View>
                  <EmptyCartText>El carrito está vacío. 🛒</EmptyCartText>
                  <FallbackNote>
                    <FallbackText>
                      💡 ¿No encontrás tus productos en el catálogo? Buscalos en delivery o supermercados locales:
                    </FallbackText>
                    <DeliveryContainer>
                      <DeliveryChip bg="#E2004F" onPress={() => Linking.openURL('https://www.pedidosya.com.ar/')}>
                        <DeliveryChipText>🏍️ PedidosYa</DeliveryChipText>
                      </DeliveryChip>
                      <DeliveryChip bg="#FF5E3A" onPress={() => Linking.openURL('https://www.rappi.com.ar/')}>
                        <DeliveryChipText>🛵 Rappi</DeliveryChipText>
                      </DeliveryChip>
                      <DeliveryChip bg="#005691" onPress={() => Linking.openURL('https://www.lacoopeencasa.coop/')}>
                        <DeliveryChipText>🛒 La Coope</DeliveryChipText>
                      </DeliveryChip>
                      <DeliveryChip bg="#00509E" onPress={() => Linking.openURL('https://www.carrefour.com.ar/')}>
                        <DeliveryChipText>🏪 Carrefour</DeliveryChipText>
                      </DeliveryChip>
                      <DeliveryChip bg="#4CAF50" onPress={() => Linking.openURL('https://www.vea.com.ar/')}>
                        <DeliveryChipText>🥑 Vea</DeliveryChipText>
                      </DeliveryChip>
                      <DeliveryChip bg="#0033A0" onPress={() => Linking.openURL('https://www.masonline.com.ar/')}>
                        <DeliveryChipText>🛍️ ChangoMás</DeliveryChipText>
                      </DeliveryChip>
                    </DeliveryContainer>
                  </FallbackNote>
                </View>
              ) : (
                <View>
                  <CartListScroll showsVerticalScrollIndicator={false}>
                    {cart.map(item => (
                      <CartItemRow key={item.productId}>
                        <CartItemName>📦 {item.name}</CartItemName>
                        <CartItemQty>x{item.quantity}</CartItemQty>
                      </CartItemRow>
                    ))}
                  </CartListScroll>
                  {bestOption && (
                    <>
                      <BestStoreCard>
                        <BestStoreText>🏆 Mejor Opción:</BestStoreText>
                        <BestStoreName>✨ {bestOption.storeName}</BestStoreName>
                        <BestStorePrice>💰 Total Estimado: ${bestOption.totalPrice}</BestStorePrice>
                      </BestStoreCard>
                      <CheckoutButton onPress={handleGenerateOrder}>
                        <Ionicons name="receipt-outline" size={16} color="#0F172A" />
                        <CheckoutButtonText>Generar Pedido</CheckoutButtonText>
                      </CheckoutButton>
                    </>
                  )}
                </View>
              )}
            </CartDropdown>
          )}
        </>
      )}
    </MainWrapper>
  );
}

const styles = StyleSheet.create({
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
  },
});
