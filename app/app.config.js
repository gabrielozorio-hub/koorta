// Estende o app.json com a chave do Google Maps lida de .env.local (não versionado)
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return config;
  return {
    ...config,
    plugins: [
      ...config.plugins,
      ['react-native-maps', { androidGoogleMapsApiKey: key, iosGoogleMapsApiKey: key }],
    ],
  };
};
