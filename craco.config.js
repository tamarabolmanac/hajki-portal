module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Dodaj fallback za module koji nisu dostupni u browser-u
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        // Ignoriši native module koje @capacitor-community/background-geolocation koristi
        fs: false,
        path: false,
        crypto: false,
      };

      return webpackConfig;
    },
  },
};
