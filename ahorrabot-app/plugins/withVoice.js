const { withInfoPlist, AndroidConfig } = require("@expo/config-plugins");

const MICROPHONE = 'Allow $(PRODUCT_NAME) to access the microphone';
const SPEECH_RECOGNITION = 'Allow $(PRODUCT_NAME) to securely recognize user speech';

const withIosPermissions = (c, { microphonePermission, speechRecognitionPermission } = {}) => {
  return withInfoPlist(c, config => {
    if (microphonePermission !== false) {
      config.modResults.NSMicrophoneUsageDescription =
        microphonePermission ||
        config.modResults.NSMicrophoneUsageDescription ||
        MICROPHONE;
    }
    if (speechRecognitionPermission !== false) {
      config.modResults.NSSpeechRecognitionUsageDescription =
        speechRecognitionPermission ||
        config.modResults.NSSpeechRecognitionUsageDescription ||
        SPEECH_RECOGNITION;
    }
    return config;
  });
};

const withAndroidPermissions = config => {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.RECORD_AUDIO',
  ]);
};

const withVoice = (config, props = {}) => {
  const _props = props ? props : {};
  config = withIosPermissions(config, _props);
  if (_props.microphonePermission !== false) {
    config = withAndroidPermissions(config);
  }
  return config;
};

module.exports = withVoice;
