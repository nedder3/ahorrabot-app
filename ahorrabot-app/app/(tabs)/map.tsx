// app/(tabs)/map.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
  Linking,
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { useCart, CartItem, StoreCartTotal } from '../../context/cart-context';
import { MapViewComponent } from '../../components/map-view';
import { getUserLocation, getNearbyStores, GeolocatedStore } from '../../services/google-maps';
import { PRODUCTS } from '../../services/supermarket-data';
import { saveOrder, saveFavoriteDeal } from '../../database/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.View`
  padding: 16px 20px;
  background-color: rgba(220, 38, 38, 0.85);
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MiniLogo = styled.Image`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.3);
  margin-right: 8px;
`;

const HeaderTitle = styled.Text`
  font-size: 19px;
  font-weight: bold;
  color: #FFFFFF;
`;

const LocationText = styled.Text`
  font-size: 13px;
  color: #FFFFFF;
  opacity: 0.9;
  font-weight: 500;
`;

const CartSection = styled.View`
  background-color: ${props => props.theme.colors.card};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  padding: 16px 20px;
`;

const CartTitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SectionLabel = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ClearButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const ClearButtonText = styled.Text`
  font-size: 13px;
  color: ${props => props.theme.colors.primary};
  font-weight: bold;
  margin-left: 4px;
`;

const CartRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: 0.5px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const ItemName = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  flex: 1;
`;

const QtyControls = styled.View`
  flex-direction: row;
  align-items: center;
`;

const QtyButton = styled.TouchableOpacity`
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: ${props => props.theme.colors.primaryLight};
  justify-content: center;
  align-items: center;
`;

const QtyText = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-horizontal: 12px;
`;

const MapContainer = styled.View`
  height: 200px;
  margin: 16px 20px;
  border-radius: 16px;
  overflow: hidden;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
`;

const ResultsContainer = styled.View`
  padding-horizontal: 20px;
  padding-bottom: 40px;
`;

const ResultCard = styled.View<{ isBest: boolean }>`
  background-color: ${props => props.theme.colors.glassBg};
  border-width: 2.5px;
  border-color: ${props => props.isBest ? props.theme.colors.accent : props.theme.colors.border};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const BestBadge = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${props => props.theme.colors.accent};
  border-bottom-left-radius: 12px;
  padding: 6px 14px;
`;

const BestBadgeText = styled.Text`
  color: #0F172A;
  font-size: 11px;
  font-weight: 800;
`;

const ResultHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const StoreName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  max-width: 70%;
`;

const PriceContainer = styled.View`
  align-items: flex-end;
`;

const FinalPrice = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: ${props => props.theme.colors.primary};
`;

const PromoDescription = styled.Text`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 8px;
  line-height: 18px;
  background-color: #FAFBFD;
  padding: 10px;
  border-radius: 8px;
  border-width: 0.5px;
  border-color: ${props => props.theme.colors.border};
`;

const SaveDealButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.primary};
  background-color: ${props => props.theme.colors.primaryLight};
  border-radius: 10px;
  padding: 10px;
  margin-top: 14px;
`;

const SaveDealText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 13px;
  font-weight: bold;
  margin-left: 6px;
`;

const SearchLoaderContainer = styled.View`
  background-color: ${props => props.theme.colors.card};
  border-width: 2px;
  border-color: ${props => props.theme.colors.primary};
  border-radius: 20px;
  margin: 32px 20px;
  padding: 32px 24px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 4;
`;

const SearchLoaderText = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-top: 20px;
  text-align: center;
`;

const SearchLoaderSub = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 8px;
  text-align: center;
  line-height: 20px;
`;

const EmptyCartContainer = styled.View`
  background-color: ${props => props.theme.colors.card};
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 20px;
  margin: 24px 20px;
  padding: 30px 20px;
  align-items: center;
  justify-content: center;
`;

const EmptyCartTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 12px;
  text-align: center;
`;

const EmptyCartText = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin-top: 6px;
  line-height: 20px;
  margin-bottom: 20px;
`;

const MainWrapper = styled.View<{ isWide: boolean }>`
  flex: 1;
  flex-direction: ${props => props.isWide ? 'row' : 'column'};
  background-color: ${props => props.theme.colors.background};
`;

const ContentArea = styled.View`
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

const CartListWrapper = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
  border-radius: 16px;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  padding: 12px;
`;

const CartListScroll = styled.ScrollView`
  max-height: 220px;
  margin-bottom: 12px;
`;

const BestStoreCard = styled.View`
  background-color: ${props => props.theme.colors.primaryLight};
  border-radius: 12px;
  padding: 10px 12px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.primary};
  margin-top: 10px;
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

const QuickAddList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const QuickAddButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primaryLight};
  border-radius: 16px;
  padding: 8px 12px;
  margin: 4px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.primary};
`;

const QuickAddText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 12px;
  font-weight: bold;
`;

export default function MapScreen() {
  const { user, cards } = useAuth();
  const { theme } = useAppTheme();
  const { cart, addToCart, removeFromCart, clearCart, calculateCartTotals, pricesVersion } = useCart();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSearchingOffers, setIsSearchingOffers] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<GeolocatedStore[]>([]);
  const [calculations, setCalculations] = useState<StoreCartTotal[]>([]);

  // Get user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      const loc = await getUserLocation();
      setUserCoords(loc);
      setNearbyStores(getNearbyStores(loc.latitude, loc.longitude));
      setLoadingLocation(false);
    };
    fetchLocation();
  }, []);

  const getCapitalizedDay = () => {
    const rawDay = new Date().toLocaleDateString('es-AR', { weekday: 'long' });
    return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  };

  // Recalculate options when cart, cards or prices update in background
  useEffect(() => {
    const currentDay = getCapitalizedDay();
    const results = calculateCartTotals(currentDay, cards);
    setCalculations(results);
  }, [cart, cards, pricesVersion]);

  const handleQuickAdd = (productId: string) => {
    addToCart(productId);
    setIsSearchingOffers(true);
    
    // Simulate query comparison timing
    setTimeout(() => {
      setIsSearchingOffers(false);
    }, 1800);
  };

  const handleGenerateOrder = async (calc: StoreCartTotal) => {
    if (!user) {
      Alert.alert('Error', 'Debés iniciar sesión para generar pedidos.');
      return;
    }

    Alert.alert(
      'Generar Pedido',
      `¿Querés generar la lista de compras para ${calc.storeName} por un total de $${calc.totalPrice}?`,
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
              const savings = worstOption ? Math.max(0, worstOption.totalPrice - calc.totalPrice) : 0;

              await saveOrder(
                user.id,
                JSON.stringify(orderItems),
                calc.storeName,
                calc.totalPrice,
                savings
              );

              // Clear the cart to end the session
              clearCart();

              Alert.alert(
                '¡Pedido Generado! 🎉',
                `Tu lista de compras para ${calc.storeName} por $${calc.totalPrice} se guardó en "Mis Pedidos".`,
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

  const bestOption = calculations[0];

  const renderAsideRight = () => {
    return (
      <AsideRight>
        <SidebarTitle>🛒 Carrito Activo (Lista) 📋</SidebarTitle>
        <CartListWrapper>
          {cart.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={40} color={theme.colors.textSecondary} />
              <EmptyCartText style={{ fontSize: 13, marginVertical: 12 }}>
                El carrito está vacío. 🛒
              </EmptyCartText>
              <FallbackNote>
                <FallbackText>
                  💡 Buscá productos rápidos abajo o pedí directo a delivery:
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
                </DeliveryContainer>
              </FallbackNote>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 12, color: theme.colors.textSecondary }}>ITEMS ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text>
                <ClearButton onPress={clearCart}>
                  <Ionicons name="trash-outline" size={12} color={theme.colors.primary} />
                  <ClearButtonText style={{ fontSize: 12 }}>Vaciar</ClearButtonText>
                </ClearButton>
              </View>
              <CartListScroll showsVerticalScrollIndicator={false}>
                {cart.map(item => (
                  <CartRow key={item.productId} style={{ paddingVertical: 6 }}>
                    <ItemName style={{ fontSize: 13 }}>{item.name}</ItemName>
                    <QtyControls>
                      <QtyButton style={{ width: 24, height: 24, borderRadius: 12 }} onPress={() => removeFromCart(item.productId)}>
                        <Ionicons name="remove" size={12} color={theme.colors.primary} />
                      </QtyButton>
                      <QtyText style={{ fontSize: 13, marginHorizontal: 8 }}>{item.quantity}</QtyText>
                      <QtyButton style={{ width: 24, height: 24, borderRadius: 12 }} onPress={() => addToCart(item.productId)}>
                        <Ionicons name="add" size={12} color={theme.colors.primary} />
                      </QtyButton>
                    </QtyControls>
                  </CartRow>
                ))}
              </CartListScroll>
              {bestOption && (
                <>
                  <BestStoreCard>
                    <BestStoreText>🏆 Compra más barata:</BestStoreText>
                    <BestStoreName>✨ {bestOption.storeName}</BestStoreName>
                    <BestStorePrice>💰 Total: ${bestOption.totalPrice}</BestStorePrice>
                  </BestStoreCard>
                  <CheckoutButton onPress={() => handleGenerateOrder(bestOption)}>
                    <Ionicons name="receipt-outline" size={16} color="#0F172A" />
                    <CheckoutButtonText>Generar Pedido</CheckoutButtonText>
                  </CheckoutButton>
                </>
              )}
            </View>
          )}
        </CartListWrapper>

        {/* Quick Add products at bottom of aside when cart is empty */}
        {cart.length === 0 && (
          <View style={{ marginTop: 20 }}>
            <SidebarTitle>➕ Agregar Rápidos</SidebarTitle>
            <QuickAddList>
              {PRODUCTS.slice(0, 6).map(p => (
                <QuickAddButton key={p.id} onPress={() => handleQuickAdd(p.id)}>
                  <QuickAddText>➕ {p.name.split(' ')[0]}</QuickAddText>
                </QuickAddButton>
              ))}
            </QuickAddList>
          </View>
        )}
      </AsideRight>
    );
  };

  const renderContentArea = () => {
    return (
      <ContentArea>
        <Header>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MiniLogo source={require('../../assets/images/ahorrabot_logo.png')} />
            <HeaderTitle>Comparador 🛒</HeaderTitle>
          </View>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <LocationText>📍 {userCoords?.address.split(',')[0]}</LocationText>
          )}
        </Header>

        {/* Mobile-only Cart Summary Header */}
        {!isWide && cart.length > 0 && (
          <CartSection>
            <CartTitleRow>
              <SectionLabel>Mi Carrito de Compras</SectionLabel>
              <ClearButton onPress={clearCart}>
                <Ionicons name="trash-outline" size={14} color={theme.colors.primary} />
                <ClearButtonText>Vaciar</ClearButtonText>
              </ClearButton>
            </CartTitleRow>

            {cart.map(item => (
              <CartRow key={item.productId}>
                <ItemName>{item.name}</ItemName>
                <QtyControls>
                  <QtyButton onPress={() => removeFromCart(item.productId)}>
                    <Ionicons name="remove" size={16} color={theme.colors.primary} />
                  </QtyButton>
                  <QtyText>{item.quantity}</QtyText>
                  <QtyButton onPress={() => addToCart(item.productId)}>
                    <Ionicons name="add" size={16} color={theme.colors.primary} />
                  </QtyButton>
                </QtyControls>
              </CartRow>
            ))}
          </CartSection>
        )}

        {isSearchingOffers ? (
          <ScrollView>
            <SearchLoaderContainer>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <SearchLoaderText>Buscando ofertas del carrito...</SearchLoaderText>
              <SearchLoaderSub>
                Sumando productos y aplicando reintegros Cuenta DNI y Coopeplus...{'\n'}
                Comparando Cooperativa Obrera, Carrefour, Día y Vea.
              </SearchLoaderSub>
            </SearchLoaderContainer>
          </ScrollView>
        ) : cart.length === 0 && !isWide ? (
          // Mobile Empty Cart
          <ScrollView>
            <EmptyCartContainer>
              <Ionicons name="cart-outline" size={60} color={theme.colors.textSecondary} />
              <EmptyCartTitle>Tu carrito de compras está vacío</EmptyCartTitle>
              <EmptyCartText>
                Escribile o dictale tu lista de víveres a AhorraBot en la pestaña del chat (ej. &quot;agregame fideos y yerba&quot;) o agregá productos rápidos acá abajo:
              </EmptyCartText>
              <QuickAddList>
                {PRODUCTS.map(p => (
                  <QuickAddButton key={p.id} onPress={() => handleQuickAdd(p.id)}>
                    <QuickAddText>➕ {p.name.split(' ')[0]}</QuickAddText>
                  </QuickAddButton>
                ))}
              </QuickAddList>
            </EmptyCartContainer>
          </ScrollView>
        ) : cart.length === 0 && isWide ? (
          // Web Empty Cart (Map still loaded on left!)
          <ScrollView showsVerticalScrollIndicator={false}>
            <MapContainer style={{ height: 400 }}>
              {loadingLocation ? (
                <View style={styles.loadingMap}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>Cargando mapa...</Text>
                </View>
              ) : (
                <MapViewComponent
                  userLat={userCoords!.latitude}
                  userLng={userCoords!.longitude}
                  stores={nearbyStores}
                />
              )}
            </MapContainer>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12, fontWeight: 'bold', textAlign: 'center' }}>
                Cargá productos en tu carrito en el panel derecho o usá el chat para iniciar una comparación. ⚡️🛍️
              </Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Leaflet WebView Map */}
            <MapContainer style={isWide ? { height: 350 } : undefined}>
              {loadingLocation ? (
                <View style={styles.loadingMap}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>Cargando mapa...</Text>
                </View>
              ) : (
                <MapViewComponent
                  userLat={userCoords!.latitude}
                  userLng={userCoords!.longitude}
                  stores={nearbyStores}
                />
              )}
            </MapContainer>

            {/* Calculations / Supermarket comparisons */}
            <ResultsContainer>
              <SectionLabel style={{ fontSize: 15, marginBottom: 12 }}>
                💰 Costo Total del Carrito Completo:
              </SectionLabel>

              {calculations.map((calc, index) => {
                const isBestOption = index === 0;
                
                return (
                  <ResultCard key={calc.storeId} isBest={isBestOption}>
                    {isBestOption && (
                      <BestBadge>
                        <BestBadgeText>¡MÁS CONVENIENTE!</BestBadgeText>
                      </BestBadge>
                    )}

                    <ResultHeader>
                      <StoreName>{calc.storeName}</StoreName>
                      <PriceContainer>
                        <FinalPrice>${calc.totalPrice}</FinalPrice>
                      </PriceContainer>
                    </ResultHeader>

                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                      📍 A {calc.distance} km • {calc.breakdown}
                    </Text>

                    <PromoDescription>
                      {isBestOption 
                        ? `✨ Comprando tu carrito en ${calc.storeName} tenés la opción más económica hoy.` 
                        : `Comprando en ${calc.storeName} gastás $${calc.totalPrice - calculations[0].totalPrice} más que la opción recomendada.`}
                    </PromoDescription>

                    <SaveDealButton onPress={() => handleGenerateOrder(calc)}>
                      <Ionicons name="receipt-outline" size={16} color={theme.colors.primary} />
                      <SaveDealText>Generar Pedido</SaveDealText>
                    </SaveDealButton>
                  </ResultCard>
                );
              })}
            </ResultsContainer>
          </ScrollView>
        )}
      </ContentArea>
    );
  };

  return (
    <MainWrapper isWide={isWide}>
      {renderContentArea()}
      {isWide && renderAsideRight()}
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
