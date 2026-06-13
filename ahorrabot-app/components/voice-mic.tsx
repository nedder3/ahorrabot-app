// components/voice-mic.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  StyleSheet,
  NativeModules,
} from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../context/theme-context';

// Dynamically load Voice module on native, fallback to null on web/Expo Go
let Voice: any = null;
if (Platform.OS !== 'web') {
  try {
    if (NativeModules && NativeModules.Voice) {
      Voice = require('@react-native-voice/voice').default;
    } else {
      console.warn('Voice recognition native module is not available (e.g. Expo Go/emulator)');
    }
  } catch (e) {
    console.warn('Voice recognition module is not available in this build environment (e.g. Expo Go):', e);
  }
}

// Styled Components
const MicButton = styled.TouchableOpacity<{ isListening: boolean }>`
  background-color: ${props => props.isListening ? props.theme.colors.primaryLight : 'transparent'};
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-left: 4px;
`;

interface VoiceMicProps {
  onSpeechResult: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onPressMic?: () => void;
}

export const VoiceMic: React.FC<VoiceMicProps> = ({ onSpeechResult, onListeningChange, onPressMic }) => {
  const { theme } = useAppTheme();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const onListeningChangeRef = useRef(onListeningChange);
  const onSpeechResultRef = useRef(onSpeechResult);

  // Keep refs up to date
  useEffect(() => {
    onListeningChangeRef.current = onListeningChange;
  }, [onListeningChange]);

  useEffect(() => {
    onSpeechResultRef.current = onSpeechResult;
  }, [onSpeechResult]);

  // Web SpeechRecognition Initialization
  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.lang = 'es-AR';
        rec.interimResults = true;

        rec.onstart = () => {
          setIsListening(true);
          onListeningChangeRef.current?.(true);
        };

        rec.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          onSpeechResultRef.current(fullTranscript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error web:', event.error);
          setIsListening(false);
          onListeningChangeRef.current?.(false);
          if (event.error === 'not-allowed') {
            Alert.alert(
              'Permiso Denegado',
              'Habilitá el micrófono en la configuración de tu navegador para usar el dictado por voz.'
            );
          }
        };

        rec.onend = () => {
          setIsListening(false);
          onListeningChangeRef.current?.(false);
        };

        setRecognition(rec);

        return () => {
          try {
            rec.abort();
          } catch {}
        };
      }
    }
  }, []);

  // Native Voice Listeners Configuration
  useEffect(() => {
    if (Platform.OS !== 'web' && Voice) {
      Voice.onSpeechStart = () => {
        setIsListening(true);
        onListeningChangeRef.current?.(true);
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
        onListeningChangeRef.current?.(false);
      };

      Voice.onSpeechResults = (e: any) => {
        if (e.value && e.value.length > 0) {
          onSpeechResultRef.current(e.value[0]);
        }
      };

      Voice.onSpeechError = (e: any) => {
        console.error('Speech recognition error native:', e);
        setIsListening(false);
        onListeningChangeRef.current?.(false);
      };

      return () => {
        if (Voice) {
          try {
            Voice.destroy()
              .then(() => {
                try {
                  Voice.removeAllListeners();
                } catch {}
              })
              .catch(() => {});
          } catch {}
        }
      };
    }
  }, []);

  const handlePress = async () => {
    // Soft haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (isListening) {
      // Toggle off
      if (Platform.OS === 'web' && recognition) {
        try {
          recognition.stop();
        } catch {}
      } else if (Platform.OS !== 'web' && Voice) {
        try {
          await Voice.stop();
        } catch {}
      } else {
        setIsListening(false);
        onListeningChangeRef.current?.(false);
      }
      return;
    }

    // Trigger callback to focus input & raise keyboard (Gboard)
    if (onPressMic) {
      onPressMic();
    }

    // Toggle on
    if (Platform.OS === 'web') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // release mic hardware check

          if (recognition) {
            try {
              recognition.start();
            } catch (err) {
              console.warn('Recognition start error:', err);
            }
          }
        } catch (err: any) {
          console.error('Microphone permission error web:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            Alert.alert(
              'Acceso Denegado',
              'Por favor, habilitá el micrófono en la configuración de tu navegador para usar el dictado por voz.'
            );
          } else {
            Alert.alert('Error', 'No se pudo acceder al micrófono de tu dispositivo.');
          }
        }
      } else {
        if (recognition) {
          try {
            recognition.start();
          } catch {}
        }
      }
    } else {
      // Native Speech-to-Text Flow
      if (Voice) {
        try {
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              {
                title: 'Permiso de Micrófono',
                message: 'Ahorrabot necesita acceso al micrófono para dictar tus mensajes.',
                buttonNeutral: 'Preguntar luego',
                buttonNegative: 'Cancelar',
                buttonPositive: 'Permitir',
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Acceso Denegado', 'Permiso de micrófono denegado en el dispositivo.');
              return;
            }
          }
          // Start actual native voice capture
          await Voice.start('es-AR');
        } catch (err) {
          console.warn('Voice start native error:', err);
          // Fallback simulation in case of emulator constraints
          setIsListening(true);
          onListeningChangeRef.current?.(true);
          setTimeout(() => {
            setIsListening(false);
            onListeningChangeRef.current?.(false);
            Alert.alert(
              'Dictado de Voz',
              'El micrófono nativo requiere compilar la app. Probá dictando tocando el icono de micrófono en tu teclado virtual. 👍'
            );
          }, 3500);
        }
      } else {
        // Safe fallback for Expo Go / Emulator environment
        setIsListening(true);
        onListeningChangeRef.current?.(true);
        setTimeout(() => {
          setIsListening(false);
          onListeningChangeRef.current?.(false);
          Alert.alert(
            'Dictado de Voz 🎙️📱',
            'El micrófono de AhorraBot está listo. Por favor, utilizá el botón de micrófono integrado en el teclado de tu dispositivo para dictar texto directamente. ✨'
          );
        }, 4000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MicButton onPress={handlePress} isListening={isListening}>
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={22}
          color={isListening ? theme.colors.primary : theme.colors.textSecondary}
        />
      </MicButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
