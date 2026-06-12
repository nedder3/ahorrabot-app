// app/(tabs)/index.tsx
import React from 'react';
import { ScrollView, View, Text, Switch, FlatList } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { PROMOTIONS } from '../../services/supermarket-data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.View`
  padding: 24px 20px 16px 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTextContainer = styled.View``;

const WelcomeText = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const UsernameText = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const QuickStatsCard = styled.View`
  background-color: ${props => props.theme.colors.primary};
  border-radius: 20px;
  margin-horizontal: 20px;
  padding: 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  shadow-color: ${props => props.theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 6px;
  elevation: 4;
`;

const StatInfo = styled.View``;

const StatLabel = styled.Text`
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
`;

const StatValue = styled.Text`
  color: #FFFFFF;
  font-size: 26px;
  font-weight: bold;
  margin-top: 4px;
`;

const StatAction = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
`;

const StatActionText = styled.Text`
  color: #FFFFFF;
  font-weight: bold;
  font-size: 13px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 24px;
  margin-bottom: 12px;
  margin-horizontal: 20px;
`;

const CardRow = styled.View`
  background-color: ${props => props.theme.colors.card};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 16px;
  padding: 16px;
  margin-horizontal: 20px;
  margin-vertical: 6px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CardInfo = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const CardIconContainer = styled.View<{ active: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: ${props => props.active ? props.theme.colors.primaryLight : '#F1F5F9'};
  justify-content: center;
  align-items: center;
  margin-right: 14px;
`;

const CardDetails = styled.View`
  flex: 1;
`;

const CardTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const CardSubtitle = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 2px;
`;

const PromoCard = styled.View`
  background-color: ${props => props.theme.colors.card};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 16px;
  padding: 16px;
  margin-horizontal: 20px;
  margin-vertical: 6px;
  flex-direction: row;
  align-items: flex-start;
`;

const PromoBadge = styled.View`
  background-color: ${props => props.theme.colors.accent};
  border-radius: 8px;
  padding: 4px 8px;
  align-self: flex-start;
  margin-top: 4px;
  margin-right: 12px;
`;

const PromoBadgeText = styled.Text`
  color: #0F172A;
  font-weight: bold;
  font-size: 12px;
`;

const PromoDetails = styled.View`
  flex: 1;
`;

const PromoTitle = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const PromoDesc = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 4px;
  line-height: 16px;
`;

export default function HomeScreen() {
  const { user, cards, toggleCard } = useAuth();
  const { theme } = useAppTheme();
  const router = useRouter();

  // Argentine Bank Card definitions
  const availableCards = [
    { name: 'Cuenta DNI', subtitle: 'Banco Provincia (Fines de semana 30%)' },
    { name: 'Comunidad Coto', subtitle: 'Coto descuento (Miércoles/Jueves 15%)' },
    { name: 'BNA+', subtitle: 'Banco Nación MODO (Miércoles 20%)' },
    { name: 'Tarjeta Carrefour', subtitle: 'Descuento diario 10% en Carrefour' },
    { name: 'Tarjeta Cencosud', subtitle: 'Jumbo/Vea/Disco (Miércoles 20%)' },
    { name: 'Banco Galicia', subtitle: 'Descuento Jumbo (Jueves 15%)' },
    { name: 'Tarjeta TCI Coto', subtitle: 'Tarjeta de crédito Coto (Lunes 20%)' }
  ];

  // Get current day of week in Spanish
  const getCapitalizedDay = () => {
    const rawDay = new Date().toLocaleDateString('es-AR', { weekday: 'long' });
    return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  };
  const currentDay = getCapitalizedDay();

  // Filter promotions that apply today in Argentina
  const todaysPromos = PROMOTIONS.filter(promo => promo.days.includes(currentDay));

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header>
          <HeaderTextContainer>
            <WelcomeText>¡Hola de nuevo!</WelcomeText>
            <UsernameText>{user?.username || 'Ahorrador'}</UsernameText>
          </HeaderTextContainer>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </Header>

        <QuickStatsCard>
          <StatInfo>
            <StatLabel>Mi Ahorro Estimado</StatLabel>
            <StatValue>$12.450</StatValue>
          </StatInfo>
          <StatAction onPress={() => router.push('/chat' as any)}>
            <StatActionText>Consultar al Bot</StatActionText>
          </StatAction>
        </QuickStatsCard>

        {/* Argentine Promotion Alerts for Today */}
        <SectionTitle>🔥 Promociones de hoy ({currentDay})</SectionTitle>
        {todaysPromos.length > 0 ? (
          todaysPromos.map((promo) => {
            const isUserCardActive = cards.includes(promo.cardName);
            return (
              <PromoCard key={promo.id}>
                <PromoBadge>
                  <PromoBadgeText>-{promo.discountPercent}%</PromoBadgeText>
                </PromoBadge>
                <PromoDetails>
                  <PromoTitle>
                    {promo.name} {isUserCardActive ? '✅' : '⚠️'}
                  </PromoTitle>
                  <PromoDesc>{promo.description}</PromoDesc>
                  {!isUserCardActive && (
                    <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>
                      ⚠️ Activa esta tarjeta abajo para aplicar este descuento
                    </Text>
                  )}
                </PromoDetails>
              </PromoCard>
            );
          })
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary }}>No hay promociones especiales registradas para hoy.</Text>
          </View>
        )}

        {/* Credit Card / Bank Promo Selector */}
        <SectionTitle>💳 Mis Tarjetas y Medios de Pago</SectionTitle>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginHorizontal: 20, marginBottom: 12 }}>
          Marcá las tarjetas y cuentas que tenés activas para calcular automáticamente el mejor precio.
        </Text>

        {availableCards.map((card) => {
          const isActive = cards.includes(card.name);
          return (
            <CardRow key={card.name}>
              <CardInfo>
                <CardIconContainer active={isActive}>
                  <Ionicons
                    name={isActive ? 'card' : 'card-outline'}
                    size={24}
                    color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </CardIconContainer>
                <CardDetails>
                  <CardTitle>{card.name}</CardTitle>
                  <CardSubtitle>{card.subtitle}</CardSubtitle>
                </CardDetails>
              </CardInfo>
              <Switch
                value={isActive}
                onValueChange={() => toggleCard(card.name)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={isActive ? theme.colors.primary : '#E2E8F0'}
              />
            </CardRow>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Container>
  );
}
