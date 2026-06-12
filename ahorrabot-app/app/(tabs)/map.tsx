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
import { MapViewComponent } from '../../components/map-view';
import { getUserLocation, getNearbyStores, GeolocatedStore } from '../../services/google-maps';
import { PRODUCTS, calculateBestOptionsForProduct, CalculationResult } from '../../services/supermarket-data';
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
  font-size: 20px;
  font-weight: bold;
  color: #FFFFFF;
`;

const LocationText = styled.Text`
  font-size: 13px;
  color: #FFFFFF;
  opacity: 0.9;
  font-weight: 500;
`;

const ProductSelector = styled.View`
  padding: 16px 20px;
  background-color: ${props => props.theme.colors.card};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const SelectorLabel = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProductScroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})`
  flex-direction: row;
`;

const ProductChip = styled.TouchableOpacity<{ selected: boolean }>`
  background-color: ${props => props.selected ? props.theme.colors.primary : '#F1F5F9'};
  border-width: 1.5px;
  border-color: ${props => props.selected ? props.theme.colors.primary : '#E2E8F0'};
  border-radius: 20px;
  padding: 8px 16px;
  margin-right: 8px;
`;

const ProductChipText = styled.Text<{ selected: boolean }>`
  color: ${props => props.selected ? '#FFFFFF' : props.theme.colors.text};
  font-size: 13px;
  font-weight: bold;
`;

const MapContainer = styled.View`
  height: 220px;
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

const OriginalPrice = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  text-decoration-line: line-through;
`;

const FinalPrice = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: ${props => props.theme.colors.primary};
`;

const PromoLabel = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  font-weight: 700;
  margin-top: 2px;
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

// "Buscando Ofertas" Loading Overlay Component
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

export default function MapScreen() {
  const { user, cards } = useAuth();
  const { theme } = useAppTheme();
  
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSearchingOffers, setIsSearchingOffers] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<GeolocatedStore[]>([]);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);

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

  // Recalculate options when product changes, and trigger the "Buscando" overlay
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setIsSearchingOffers(true);
    
    // Simulate query comparison timing
    setTimeout(() => {
      setIsSearchingOffers(false);
    }, 1800);
  };

  useEffect(() => {
    const getCapitalizedDay = () => {
      const rawDay = new Date().toLocaleDateString('es-AR', { weekday: 'long' });
      return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
    };

    const currentDay = getCapitalizedDay();
    const results = calculateBestOptionsForProduct(selectedProductId, currentDay, cards);
    setCalculations(results);
  }, [selectedProductId, cards]);

  const handleSaveFavorite = async (calc: CalculationResult) => {
    if (!user) {
      Alert.alert('Error', 'Debés iniciar sesión para guardar pedidos.');
      return;
    }

    try {
      const prodName = PRODUCTS.find(p => p.id === selectedProductId)?.name || selectedProductId;
      const appliedPromosStr = calc.activePromos.map(p => p.name).join(', ') || 'Precio Base';
      
      await saveFavoriteDeal(
        user.id,
        prodName,
        calc.storeName,
        calc.originalPrice,
        appliedPromosStr,
        calc.finalPrice
      );
      
      Alert.alert('¡Pedido Guardado!', `Guardaste la oferta de "${prodName}" en ${calc.storeName} por $${calc.finalPrice}.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el pedido.');
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>Ofertas Bahía Blanca 🛒</HeaderTitle>
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <LocationText>📍 {userCoords?.address}</LocationText>
        )}
      </Header>

      <ProductSelector>
        <SelectorLabel>Elegí qué querés comprar:</SelectorLabel>
        <ProductScroll>
          {PRODUCTS.map(product => {
            const isSelected = product.id === selectedProductId;
            return (
              <ProductChip
                key={product.id}
                selected={isSelected}
                onPress={() => handleProductSelect(product.id)}
              >
                <ProductChipText selected={isSelected}>
                  {product.name.split(' ')[0]}
                </ProductChipText>
              </ProductChip>
            );
          })}
        </ProductScroll>
      </ProductSelector>

      {isSearchingOffers ? (
        <ScrollView>
          <SearchLoaderContainer>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <SearchLoaderText>Buscando las mejores ofertas...</SearchLoaderText>
            <SearchLoaderSub>
              Comparando precios en Cooperativa Obrera, Carrefour, Día y Vea...{'\n'}
              Analizando descuentos activos de Cuenta DNI y Coopeplus.
            </SearchLoaderSub>
          </SearchLoaderContainer>
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
            <SelectorLabel style={{ fontSize: 15, marginBottom: 12 }}>
              💰 Mejores Precios Calculados en la Ciudad:
            </SelectorLabel>

            {calculations.map((calc, index) => {
              const isBestOption = index === 0;
              const hasPromo = calc.discountPercent > 0;
              const savedPercentage = calc.discountPercent;
              
              return (
                <ResultCard key={calc.storeId} isBest={isBestOption}>
                  {isBestOption && (
                    <BestBadge>
                      <BestBadgeText>¡MÁS BARATO!</BestBadgeText>
                    </BestBadge>
                  )}

                  <ResultHeader>
                    <StoreName>{calc.storeName}</StoreName>
                    <PriceContainer>
                      {hasPromo && <OriginalPrice>${calc.originalPrice}</OriginalPrice>}
                      <FinalPrice>${calc.finalPrice}</FinalPrice>
                      {hasPromo && <PromoLabel>-{savedPercentage}% OFF</PromoLabel>}
                    </PriceContainer>
                  </ResultHeader>

                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                    📍 A {calc.distance} km de distancia
                  </Text>

                  <PromoDescription>
                    {calc.breakdownText}
                  </PromoDescription>

                  <SaveDealButton onPress={() => handleSaveFavorite(calc)}>
                    <Ionicons name="cart" size={16} color={theme.colors.primary} />
                    <SaveDealText>Guardar Pedido</SaveDealText>
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
