// app/(tabs)/orders.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { useCart, CartItem } from '../../context/cart-context';
import { getOrders, deleteOrder, Order, OrderItem } from '../../database/db';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.View`
  padding: 24px 20px 16px 20px;
  background-color: ${props => props.theme.colors.glassBg};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MiniLogo = styled.Image`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.primary};
`;

const HeaderTitle = styled.Text`
  font-size: 24px;
  font-weight: 900;
  color: ${props => props.theme.colors.primary};
`;

const HeaderSubtitle = styled.Text`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const OrderCard = styled.View`
  background-color: ${props => props.theme.colors.glassBg};
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 20px;
  padding: 16px;
  margin-horizontal: 20px;
  margin-vertical: 10px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 6px;
  elevation: 2;
`;

const CardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  padding-bottom: 10px;
`;

const StoreBadge = styled.View<{ bg: string }>`
  background-color: ${props => props.bg};
  border-radius: 12px;
  padding: 6px 12px;
`;

const StoreBadgeText = styled.Text`
  color: #FFFFFF;
  font-weight: 800;
  font-size: 12px;
`;

const OrderDate = styled.Text`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const OrderPrice = styled.Text`
  font-size: 20px;
  font-weight: 900;
  color: ${props => props.theme.colors.primary};
`;

const ItemsList = styled.View`
  margin-bottom: 14px;
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 4px;
`;

const ItemName = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  flex: 1;
`;

const ItemQuantity = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme.colors.textSecondary};
  margin-left: 10px;
`;

const ActionButtonsRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const PrimaryActionButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${props => props.theme.colors.primary};
  border-radius: 12px;
  padding: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const PrimaryActionText = styled.Text`
  color: #FFFFFF;
  font-weight: bold;
  font-size: 13px;
  margin-left: 6px;
`;

const SecondaryActionButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primaryLight};
  border-width: 1px;
  border-color: ${props => props.theme.colors.primary};
  border-radius: 12px;
  padding: 12px;
  justify-content: center;
  align-items: center;
  width: 46px;
`;

const DangerActionButton = styled.TouchableOpacity`
  background-color: #FFF1F2;
  border-width: 1px;
  border-color: #FDA4AF;
  border-radius: 12px;
  padding: 12px;
  justify-content: center;
  align-items: center;
  width: 46px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const EmptyTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 16px;
`;

const EmptyText = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin-top: 8px;
  line-height: 20px;
  margin-bottom: 24px;
`;

const ShopNowButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primary};
  border-radius: 16px;
  padding: 14px 28px;
`;

const ShopNowText = styled.Text`
  color: #FFFFFF;
  font-weight: bold;
  font-size: 15px;
`;

export default function OrdersScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { addToCart, clearCart } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders from database
  const fetchOrders = async () => {
    if (!user) return;
    try {
      const data = await getOrders(user.id);
      setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [user])
  );

  // Delete Order
  const handleDeleteOrder = (orderId: number, store: string) => {
    Alert.alert(
      'Eliminar Pedido',
      `¿Estás seguro de que querés borrar este pedido de ${store}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteOrder(orderId);
              if (success) {
                Alert.alert('Eliminado', 'El pedido fue borrado de tu historial.');
                fetchOrders();
              }
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo borrar el pedido.');
            }
          },
        },
      ]
    );
  };

  // Re-order (Load items into active cart and navigate)
  const handleReorder = (itemsJson: string, store: string) => {
    try {
      const parsedItems: OrderItem[] = JSON.parse(itemsJson);
      
      Alert.alert(
        'Volver a comprar',
        `¿Querés vaciar el carrito actual y cargar los ${parsedItems.length} productos de tu pedido en ${store}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cargar Carrito',
            onPress: () => {
              clearCart();
              parsedItems.forEach((item) => {
                // Add product back to cart
                addToCart(item.productId, item.quantity);
              });
              
              Alert.alert(
                '¡Carrito Cargado!',
                'Productos listos. Te redirigimos al Comparador para ver precios actualizados hoy.',
                [
                  {
                    text: 'Ir al Comparador 🛒',
                    onPress: () => router.push('/map' as any),
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron procesar los productos del pedido.');
    }
  };

  // Copy plain text list to clipboard
  const handleCopyList = (itemsJson: string, store: string, total: number) => {
    try {
      const parsedItems: OrderItem[] = JSON.parse(itemsJson);
      const itemsListText = parsedItems
        .map((item) => `• [${item.quantity}] x ${item.name}`)
        .join('\n');
      
      const shareText = `📝 MI LISTA DE COMPRAS EN ${store.toUpperCase()}\n🛒 Generada en AhorraBot Bahía\n\nProductos:\n${itemsListText}\n\n💰 Total estimado: $${total}\n🤖 ¡Comprá inteligente y cuidá el mango! ✨`;
      
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(shareText);
      } else {
        Clipboard.setString(shareText);
      }
      
      Alert.alert(
        '¡Lista Copiada! 📋',
        'Copiamos tu lista de compras al portapapeles. Ya podés pegarla en WhatsApp o anotadores para ir al súper. 👍'
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo copiar la lista.');
    }
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Map store names to matching brand colors for UI badges
  const getStoreColor = (storeName: string) => {
    const name = storeName.toLowerCase();
    if (name.includes('coop')) return '#EF4444'; // Red La Coope
    if (name.includes('carrefour')) return '#1E40AF'; // Blue Carrefour
    if (name.includes('vea')) return '#15803D'; // Green Vea
    if (name.includes('chango') || name.includes('más')) return '#0ea5e9'; // Light Blue ChangoMás
    return theme.colors.primary;
  };

  return (
    <Container>
      <Header>
        <View>
          <HeaderTitle>Mis Pedidos 📋✨</HeaderTitle>
          <HeaderSubtitle>Historial de listas optimizadas y generadas</HeaderSubtitle>
        </View>
        <MiniLogo source={require('../../assets/images/ahorrabot_logo.png')} />
      </Header>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <EmptyContainer>
          <Ionicons name="receipt-outline" size={80} color={theme.colors.textSecondary} />
          <EmptyTitle>No tenés pedidos guardados</EmptyTitle>
          <EmptyText>
            Iniciá una sesión con el bot AhorraBot, cargá tus productos y haz clic en &quot;Generar pedido&quot; para guardarlo acá.
          </EmptyText>
          <ShopNowButton onPress={() => router.push('/chat' as any)}>
            <ShopNowText>Charlar con el Bot 🤖💬</ShopNowText>
          </ShopNowButton>
        </EmptyContainer>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
          {orders.map((order) => {
            let parsedItems: OrderItem[] = [];
            try {
              parsedItems = JSON.parse(order.items);
            } catch (e) {
              console.error(e);
            }

            return (
              <OrderCard key={order.id}>
                <CardHeader>
                  <View>
                    <StoreBadge bg={getStoreColor(order.storeName)}>
                      <StoreBadgeText>{order.storeName}</StoreBadgeText>
                    </StoreBadge>
                    <OrderDate>🗓️ {formatDate(order.timestamp)}</OrderDate>
                  </View>
                  <OrderPrice>${order.totalPrice}</OrderPrice>
                </CardHeader>

                <ItemsList>
                  {parsedItems.map((item, index) => (
                    <ItemRow key={index}>
                      <ItemName>📦 {item.name}</ItemName>
                      <ItemQuantity>x{item.quantity}</ItemQuantity>
                    </ItemRow>
                  ))}
                </ItemsList>

                <ActionButtonsRow>
                  <PrimaryActionButton onPress={() => handleReorder(order.items, order.storeName)}>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <PrimaryActionText>Volver a comprar</PrimaryActionText>
                  </PrimaryActionButton>

                  <SecondaryActionButton
                    onPress={() => handleCopyList(order.items, order.storeName, order.totalPrice)}
                  >
                    <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                  </SecondaryActionButton>

                  <DangerActionButton onPress={() => handleDeleteOrder(order.id, order.storeName)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </DangerActionButton>
                </ActionButtonsRow>
              </OrderCard>
            );
          })}
        </ScrollView>
      )}
    </Container>
  );
}
