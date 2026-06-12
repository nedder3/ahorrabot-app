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
  background-color: ${props => props.theme.colors.card};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const LocationText = styled.Text`
  font-size: 13px;
  color: ${props => props.theme.colors.primary};
  margin-top: 4px;
  font-weight: 500;
`;

const ProductSelector = styled.View`
  padding: 12px 20px;
  background-color: ${props => props.theme.colors.card};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const SelectorLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const ProductScroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})`
  flex-direction: row;
`;

const ProductChip = styled.TouchableOpacity<{ selected: boolean }>`
  background-color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.background};
  border-width: 1px;
  border-color: ${props => props.selected ? 'transparent' : props.theme.colors.border};
  border-radius: 20px;
  padding: 8px 16px;
  margin-right: 8px;
  flex-direction: row;
  align-items: center;
`;

const ProductChipText = styled.Text<{ selected: boolean }>`
  color: ${props => props.selected ? '#FFFFFF' : props.theme.colors.text};
  font-size: 13px;
  font-weight: 600;
`;

const MapContainer = styled.View`
  height: 240px;
  margin: 16px 20px;
  border-radius: 20px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
  elevation: 3;
`;

const ResultsContainer = styled.View`
  padding-horizontal: 20px;
  padding-bottom: 40px;
`;

const ResultCard = styled.View<{ isBest: boolean }>`
  background-color: ${props => props.theme.colors.card};
  border-width: 2px;
  border-color: ${props => props.isBest ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
`;

const BestBadge = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${props => props.theme.colors.primary};
  border-bottom-left-radius: 12px;
  padding: 4px 12px;
`;

const BestBadgeText = styled.Text`
  color: #FFFFFF;
  font-size: 10px;
  font-weight: bold;
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
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const PromoLabel = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.accent};
  font-weight: 600;
  margin-top: 2px;
`;

const PromoDescription = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 6px;
  line-height: 16px;
`;

const SaveDealButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${props => props.theme.colors.primary};
  border-radius: 10px;
  padding: 8px;
  margin-top: 12px;
`;

const SaveDealText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 13px;
  font-weight: bold;
  margin-left: 6px;
`;

export default function MapScreen() {
  const { user, cards } = useAuth();
  const { theme } = useAppTheme();
  
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id);
  const [loadingLocation, setLoadingLocation] = useState(true);
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

  // Recalculate options when product or active cards change
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
      Alert.alert('Error', 'Debés iniciar sesión para guardar ofertas.');
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
      
      Alert.alert('¡Oferta Guardada!', `Se guardó la oferta de "${prodName}" en ${calc.storeName} en tu perfil.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la oferta.');
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>Comparador de Ahorro 🛒</HeaderTitle>
        {loadingLocation ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        ) : (
          <LocationText>📍 {userCoords?.address}</LocationText>
        )}
      </Header>

      <ProductSelector>
        <SelectorLabel>Elegí un producto para comparar:</SelectorLabel>
        <ProductScroll>
          {PRODUCTS.map(product => {
            const isSelected = product.id === selectedProductId;
            return (
              <ProductChip
                key={product.id}
                selected={isSelected}
                onPress={() => setSelectedProductId(product.id)}
              >
                <ProductChipText selected={isSelected}>
                  {product.name.split(' ')[0]}
                </ProductChipText>
              </ProductChip>
            );
          })}
        </ProductScroll>
      </ProductSelector>

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
          <SelectorLabel style={{ fontSize: 16, marginBottom: 12 }}>
            💰 Precios Calculados (Descuentos Aplicados):
          </SelectorLabel>

          {calculations.map((calc, index) => {
            const isBestOption = index === 0;
            const hasPromo = calc.discountPercent > 0;
            const savedPercentage = calc.discountPercent;
            
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
                    {hasPromo && <OriginalPrice>${calc.originalPrice}</OriginalPrice>}
                    <FinalPrice>${calc.finalPrice}</FinalPrice>
                    {hasPromo && <PromoLabel>-{savedPercentage}% OFF</PromoLabel>}
                  </PriceContainer>
                </ResultHeader>

                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  📍 A {calc.distance} km de tu ubicación
                </Text>

                <PromoDescription>
                  {calc.breakdownText}
                </PromoDescription>

                <SaveDealButton onPress={() => handleSaveFavorite(calc)}>
                  <Ionicons name="bookmark-outline" size={16} color={theme.colors.primary} />
                  <SaveDealText>Guardar Oferta</SaveDealText>
                </SaveDealButton>
              </ResultCard>
            );
          })}
        </ResultsContainer>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
});
