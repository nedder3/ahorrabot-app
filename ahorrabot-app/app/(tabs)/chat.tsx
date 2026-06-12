// app/(tabs)/chat.tsx
import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { useCart } from '../../context/cart-context';
import { fetchBotResponse, ChatMessage } from '../../services/openrouter';
import { VoiceMic } from '../../components/voice-mic';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const ChatHeader = styled.View`
  padding: 16px 20px;
  background-color: ${props => props.theme.colors.primary};
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

const BotAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
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

export default function ChatScreen() {
  const { cards } = useAuth();
  const { theme } = useAppTheme();
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: '¡Hola che! Soy AhorraBot, tu asistente de ahorro en Bahía Blanca 🇦🇷\n\n¿Qué querés comprar hoy? (ej. fideos, arroz, desodorante, yerba, aceite, leche). Decime qué andás buscando o qué tarjetas tenés y te calculo al toque si conviene ir a La Coope, Carrefour, Día o Vea.',
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCapitalizedDay = () => {
    const rawDay = new Date().toLocaleDateString('es-AR', { weekday: 'long' });
    return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  };

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

      const currentDay = getCapitalizedDay();
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
        text: cleanText || '¡Entendido, che!',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Che, se me complicó conectar con mi servidor. ¡Reintentá en un ratito!',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setBotLoading(false);
    }
  };

  const handleSpeechResult = (text: string) => {
    if (text.trim()) {
      handleSend(text);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, botLoading]);

  return (
    <Container>
      <ChatHeader>
        <HeaderLeft>
          <BotAvatar>
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
          </BotAvatar>
          <HeaderTitleContainer>
            <HeaderTitle>AhorraBot Bahía</HeaderTitle>
            <HeaderStatus>En línea • Carrito Activo</HeaderStatus>
          </HeaderTitleContainer>
        </HeaderLeft>

        <CartBadge onPress={() => router.push('/map' as any)}>
          <Ionicons name="cart" size={16} color="#0F172A" />
          <CartBadgeText>{cartItemCount} items</CartBadgeText>
        </CartBadge>
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
                <BubbleText isUser={msg.sender === 'user'}>{msg.text}</BubbleText>
                <BubbleTime isUser={msg.sender === 'user'}>{msg.time}</BubbleTime>
              </BubbleCard>
            </BubbleContainer>
          ))}

          {botLoading && (
            <LoadingBubble>
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Calculando carrito...</Text>
            </LoadingBubble>
          )}
        </MessageList>

        <InputBar>
          <TextInputWrapper>
            <StyledTextInput
              placeholder="Escribí o decile algo al bot..."
              placeholderTextColor={theme.colors.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <VoiceMic onSpeechResult={handleSpeechResult} />
          </TextInputWrapper>
          
          <SendButton onPress={() => handleSend()}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </SendButton>
        </InputBar>
      </KeyboardAvoidingView>
    </Container>
  );
}
