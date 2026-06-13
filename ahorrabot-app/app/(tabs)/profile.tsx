// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../context/theme-context';
import { getFavoriteDeals, deleteFavoriteDeal, FavoriteDeal } from '../../database/db';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const ProfileHeader = styled.View`
  align-items: center;
  padding: 32px 20px 24px 20px;
  background-color: ${props => props.theme.colors.glassBg};
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const AvatarImage = styled.Image`
  width: 90px;
  height: 90px;
  border-radius: 45px;
  border-width: 2.5px;
  border-color: ${props => props.theme.colors.primary};
  margin-bottom: 12px;
`;

const ProfileName = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const ProfileEmail = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 24px;
  margin-bottom: 12px;
  margin-horizontal: 20px;
`;

const SettingsCard = styled.View`
  background-color: ${props => props.theme.colors.glassBg};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 16px;
  margin-horizontal: 20px;
  padding: 8px 16px;
`;

const SettingRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 12px;
  border-bottom-width: 0.5px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const SettingLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SettingLabel = styled.Text`
  font-size: 15px;
  color: ${props => props.theme.colors.text};
  margin-left: 12px;
  font-weight: 500;
`;

const SavedDealCard = styled.View`
  background-color: ${props => props.theme.colors.glassBg};
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

const DealDetails = styled.View`
  flex: 1;
`;

const DealTitle = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const DealStore = styled.Text`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 2px;
`;

const DealPrice = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-top: 4px;
`;

const DeleteButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${props => props.theme.colors.background};
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
`;

const EmptyContainer = styled.View`
  align-items: center;
  padding: 30px;
`;

const EmptyText = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme } = useAppTheme();
  
  const [favorites, setFavorites] = useState<FavoriteDeal[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  const fetchFavorites = async () => {
    if (user) {
      try {
        const data = await getFavoriteDeals(user.id);
        setFavorites(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFavs(false);
      }
    }
  };

  // Reload favorites every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
    }, [user])
  );

  const handleDeleteFavorite = async (id: number, productName: string) => {
    Alert.alert(
      'Eliminar Oferta',
      `¿Querés quitar la oferta de "${productName}" de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFavoriteDeal(id);
              Alert.alert('Eliminado', 'La oferta se quitó de favoritos.');
              fetchFavorites();
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: () => logout() }
    ]);
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader>
          <AvatarImage source={require('../../assets/images/ahorrabot_logo.png')} />
          <ProfileName>{user?.username || 'Usuario'}</ProfileName>
          <ProfileEmail>{user?.email || 'correo@ejemplo.com'}</ProfileEmail>
        </ProfileHeader>

        {/* Global Settings */}
        <SectionTitle>Ajustes de la App</SectionTitle>
        <SettingsCard>
          <SettingRow>
            <SettingLeft>
              <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
              <SettingLabel>Modo Oscuro</SettingLabel>
            </SettingLeft>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={isDark ? theme.colors.primary : '#E2E8F0'}
            />
          </SettingRow>

          <TouchableOpacity onPress={handleLogout}>
            <SettingRow style={{ borderBottomWidth: 0 }}>
              <SettingLeft>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
                <SettingLabel style={{ color: theme.colors.danger }}>Cerrar Sesión</SettingLabel>
              </SettingLeft>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </SettingRow>
          </TouchableOpacity>
        </SettingsCard>

        {/* Saved Supermarket Deals from SQLite */}
        <SectionTitle>⭐ Mis Ofertas Guardadas</SectionTitle>
        {loadingFavs ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
        ) : favorites.length > 0 ? (
          favorites.map((fav) => (
            <SavedDealCard key={fav.id}>
              <DealDetails>
                <DealTitle>{fav.productName}</DealTitle>
                <DealStore>🛒 {fav.store} • Promo: {fav.discount}</DealStore>
                <DealPrice>Precio Final: ${fav.finalPrice}</DealPrice>
              </DealDetails>
              
              <DeleteButton onPress={() => handleDeleteFavorite(fav.id, fav.productName)}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              </DeleteButton>
            </SavedDealCard>
          ))
        ) : (
          <EmptyContainer>
            <Ionicons name="bookmark-outline" size={40} color={theme.colors.textSecondary} />
            <EmptyText>No tenés ofertas guardadas todavía. Podés guardarlas desde la pestaña del Mapa.</EmptyText>
          </EmptyContainer>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Container>
  );
}
