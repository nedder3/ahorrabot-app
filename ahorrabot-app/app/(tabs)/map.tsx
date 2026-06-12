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
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { useCart, CartItem, StoreCartTotal } from '../../context/cart-context';
import { MapViewComponent } from '../../components/map-view';
import { getUserLocation, getNearbyStores, GeolocatedStore } from '../../services/google-maps';
import { PRODUCTS } from '../../services/supermarket-data';
import { saveFavoriteDeal } from '../../database/db';
import { Ionicons } from '@expo/vector-icons';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.View`
  padding: 16px 20px;
  background-color: ${props => props.theme.colors.primary};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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
  background-color: ${props => props.theme.colors.card};
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
  const { cart, addToCart, removeFromCart, clearCart, calculateCartTotals } = useCart();
  
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

  // Recalculate options when cart or cards change
  useEffect(() => {
    const currentDay = getCapitalizedDay();
    const results = calculateCartTotals(currentDay, cards);
    setCalculations(results);
  }, [cart, cards]);

  const handleQuickAdd = (productId: string) => {
    addToCart(productId);
    setIsSearchingOffers(true);
    
    // Simulate query comparison timing
    setTimeout(() => {
      setIsSearchingOffers(false);
    }, 1800);
  };

  const handleSaveFavorite = async (calc: StoreCartTotal) => {
    if (!user) {
      Alert.alert('Error', 'Debés iniciar sesión para guardar pedidos.');
      return;
    }

    try {
      const cartSummaryText = cart.map(item => `${item.quantity}x ${item.name.split(' ')[0]}`).join(', ');
      
      await saveFavoriteDeal(
        user.id,
        `Pedido: [${cartSummaryText}]`,
        calc.storeName,
        calc.totalPrice, // Save total price
        'Carrito Completo',
        calc.totalPrice
      );
      
      Alert.alert('¡Pedido Guardado!', `Guardaste tu lista completa de compras en ${calc.storeName} por un total de $${calc.totalPrice}.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el pedido.');
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>Comparador de Carrito 🛒</HeaderTitle>
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <LocationText>📍 {userCoords?.address.split(',')[0]}</LocationText>
        )}
      </Header>

      {/* Cart Summary Header */}
      {cart.length > 0 && (
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
      ) : cart.length === 0 ? (
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
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Leaflet WebView Map */}
          <MapContainer>
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

                  <SaveDealButton onPress={() => handleSaveFavorite(calc)}>
                    <Ionicons name="bookmark" size={16} color={theme.colors.primary} />
                    <SaveDealText>Guardar Pedido Completo</SaveDealText>
                  </SaveDealButton>
                </ResultCard>
              );
            })}
          </ResultsContainer>
        </ScrollView>
      )}
    </Container>
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
