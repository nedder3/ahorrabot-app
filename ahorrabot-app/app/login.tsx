// app/login.tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from '../context/auth-context';
import { useAppTheme } from '../context/theme-context';
import { Ionicons } from '@expo/vector-icons';

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
})``;

const BrandContainer = styled.View`
  align-items: center;
  margin-bottom: 32px;
`;

const LogoImage = styled.Image`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  margin-bottom: 16px;
  border-width: 2.5px;
  border-color: ${props => props.theme.colors.primary};
`;

const GlowCircle1 = styled.View`
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 90px;
  background-color: rgba(220, 38, 38, 0.15);
  top: 15%;
  left: -50px;
  z-index: 0;
`;

const GlowCircle2 = styled.View`
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 110px;
  background-color: rgba(245, 158, 11, 0.15);
  bottom: 15%;
  right: -50px;
  z-index: 0;
`;

const BrandName = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  letter-spacing: 1px;
`;

const BrandSlogan = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const FormCard = styled.View`
  background-color: ${props => props.theme.colors.glassBg};
  border-radius: 24px;
  padding: 24px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
  z-index: 1;
`;

const Title = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-bottom: 24px;
  text-align: center;
`;

const InputLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  margin-left: 4px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  border-width: 1.5px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 12px;
  padding-horizontal: 16px;
  margin-bottom: 16px;
  height: 52px;
  background-color: ${props => props.theme.colors.background};
`;

const StyledInput = styled.TextInput`
  flex: 1;
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  margin-left: 10px;
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primary};
  border-radius: 12px;
  height: 52px;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  shadow-color: ${props => props.theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;

const SubmitButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const ToggleContainer = styled.TouchableOpacity`
  margin-top: 20px;
  align-self: center;
`;

const ToggleText = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const HighlightText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-weight: bold;
`;

const ErrorText = styled.Text`
  color: ${props => props.theme.colors.danger};
  font-size: 13px;
  margin-top: -10px;
  margin-bottom: 12px;
  margin-left: 4px;
`;

export default function LoginScreen() {
  const { login, register } = useAuth();
  const { theme } = useAppTheme();
  
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation States
  const [usernameErr, setUsernameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const validate = () => {
    let isValid = true;
    
    // Username
    if (!username.trim()) {
      setUsernameErr('Ingresá un nombre de usuario');
      isValid = false;
    } else if (username.trim().length < 3) {
      setUsernameErr('El usuario debe tener al menos 3 caracteres');
      isValid = false;
    } else {
      setUsernameErr('');
    }

    // Email
    if (isRegister) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        setEmailErr('Ingresá tu correo electrónico');
        isValid = false;
      } else if (!emailRegex.test(email.trim())) {
        setEmailErr('Ingresá un correo electrónico válido');
        isValid = false;
      } else {
        setEmailErr('');
      }
    } else {
      setEmailErr('');
    }

    // Password
    if (!password) {
      setPasswordErr('Ingresá una contraseña');
      isValid = false;
    } else if (password.length < 3) {
      setPasswordErr('La contraseña debe tener al menos 3 caracteres');
      isValid = false;
    } else {
      setPasswordErr('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
        Alert.alert('¡Registro exitoso!', `Bienvenido a AhorraBot, ${username}.`);
      } else {
        const success = await login(username, password);
        if (!success) {
          Alert.alert('Error', 'Usuario o contraseña incorrectos.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ position: 'relative', overflow: 'hidden' }}>
      <GlowCircle1 />
      <GlowCircle2 />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, zIndex: 1 }}
      >
        <ContentContainer>
          <BrandContainer>
            <LogoImage source={require('../assets/images/ahorrabot_logo.png')} />
            <BrandName>AhorraBot</BrandName>
            <BrandSlogan>Buscá, compará y estirá tu sueldo 🇦🇷</BrandSlogan>
          </BrandContainer>

          <FormCard>
            <Title>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</Title>

            <InputLabel>Usuario</InputLabel>
            <InputContainer style={{ borderColor: usernameErr ? theme.colors.danger : theme.colors.border }}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
              <StyledInput
                placeholder="Nombre de usuario"
                placeholderTextColor={theme.colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </InputContainer>
            {usernameErr ? <ErrorText>{usernameErr}</ErrorText> : null}

            {isRegister && (
              <>
                <InputLabel>Correo Electrónico</InputLabel>
                <InputContainer style={{ borderColor: emailErr ? theme.colors.danger : theme.colors.border }}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                  <StyledInput
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </InputContainer>
                {emailErr ? <ErrorText>{emailErr}</ErrorText> : null}
              </>
            )}

            <InputLabel>Contraseña</InputLabel>
            <InputContainer style={{ borderColor: passwordErr ? theme.colors.danger : theme.colors.border }}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
              <StyledInput
                placeholder="••••••"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </InputContainer>
            {passwordErr ? <ErrorText>{passwordErr}</ErrorText> : null}

            <SubmitButton onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <SubmitButtonText>
                  {isRegister ? 'Registrarse' : 'Entrar'}
                </SubmitButtonText>
              )}
            </SubmitButton>

            <ToggleContainer onPress={() => {
              setIsRegister(!isRegister);
              setUsernameErr('');
              setEmailErr('');
              setPasswordErr('');
            }}>
              <ToggleText>
                {isRegister
                  ? '¿Ya tenés una cuenta? '
                  : '¿No tenés una cuenta todavía? '}
                <HighlightText>
                  {isRegister ? 'Iniciá Sesión' : 'Registrate gratis'}
                </HighlightText>
              </ToggleText>
            </ToggleContainer>
          </FormCard>
        </ContentContainer>
      </KeyboardAvoidingView>
    </Container>
  );
}
