// components/voice-mic.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

// Styled Components
const MicButton = styled.TouchableOpacity<{ isListening: boolean }>`
  background-color: ${props => props.isListening ? '#EF4444' : '#0D9488'};
  width: 48px;
  height: 48px;
  border-radius: 24px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;

const PulseCircle = styled.View`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  border-width: 2px;
  border-color: #EF4444;
  opacity: 0.6;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.75);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.View`
  background-color: ${props => props.theme.colors.card};
  width: 90%;
  border-radius: 24px;
  padding: 24px;
  align-items: center;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
`;

const ListeningTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  margin-top: 16px;
  margin-bottom: 8px;
`;

const ListeningSubtitle = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin-bottom: 24px;
  padding-horizontal: 10px;
`;

const ShortcutButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.background};
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 12px 16px;
  margin-vertical: 6px;
  width: 100%;
  align-items: center;
`;

const ShortcutText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-weight: 600;
  font-size: 14px;
`;

interface VoiceMicProps {
  onSpeechResult: (text: string) => void;
}

export const VoiceMic: React.FC<VoiceMicProps> = ({ onSpeechResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [webTranscript, setWebTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = 'es-AR';
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
          setWebTranscript('Escuchando...');
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setWebTranscript(transcript);
          onSpeechResult(transcript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setWebTranscript('Error al escuchar. Intentá de nuevo.');
        };

        rec.onend = () => {
          setIsListening(false);
          setTimeout(() => setModalVisible(false), 1500);
        };

        setRecognition(rec);
      }
    }
  }, [onSpeechResult]);

  const handlePress = () => {
    setModalVisible(true);
    if (Platform.OS === 'web' && recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition already started:', e);
      }
    } else {
      setIsListening(true);
      // Simulating listening on Native - user can also click a quick voice shortcut
      setWebTranscript('Escuchando tu voz... Decí algo o seleccioná una frase rápida abajo:');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setIsListening(false);
    if (Platform.OS === 'web' && recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
  };

  const handleShortcutPress = (text: string) => {
    onSpeechResult(text);
    setModalVisible(false);
    setIsListening(false);
  };

  const nativeVoiceShortcuts = [
    '¿Dónde compro fideos baratos hoy?',
    '¿Qué supermercado tiene descuento con Cuenta DNI?',
    '¿Cuánto cuesta la yerba en Carrefour y en Coto?',
    '¿Dónde está el arroz al mejor precio?',
    '¿Qué promociones hay en el super hoy?'
  ];

  return (
    <View>
      <MicButton onPress={handlePress} isListening={isListening}>
        <Ionicons name="mic" size={24} color="#FFFFFF" />
      </MicButton>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <ModalOverlay>
          <ModalContent>
            {isListening && <PulseCircle />}
            <View style={styles.micCircle}>
              <Ionicons
                name="mic"
                size={40}
                color={isListening ? '#EF4444' : '#64748B'}
              />
            </View>

            <ListeningTitle>
              {isListening ? 'Escuchando...' : 'Procesando Voz...'}
            </ListeningTitle>

            <ListeningSubtitle>
              {Platform.OS === 'web'
                ? webTranscript || 'Hablá ahora...'
                : 'Podes usar tu dictado de teclado nativo o elegir uno de estos atajos de voz frecuentes:'}
            </ListeningSubtitle>

            {Platform.OS !== 'web' && (
              <View style={{ width: '100%', marginBottom: 20 }}>
                {nativeVoiceShortcuts.map((shortcut, index) => (
                  <ShortcutButton
                    key={index}
                    onPress={() => handleShortcutPress(shortcut)}
                  >
                    <ShortcutText>🗣️ &quot;{shortcut}&quot;</ShortcutText>
                  </ShortcutButton>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
