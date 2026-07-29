const express = require('express');
const router = express.Router();

module.exports = () => {
  // GET /api/config/version-check
  // Determină dacă versiunea curentă a aplicației mobile este învechită și necesită update obligatoriu sau recomandat
  router.get('/version-check', (req, res) => {
    try {
      const { platform, version } = req.query;

      if (!platform || !version) {
        return res.status(400).json({ error: 'Parametrii platform și version sunt obligatorii.' });
      }

      // Încărcăm configurațiile din mediu (cu fallback-uri sigure)
      const minIos = process.env.MIN_IOS_VERSION || '1.0.0';
      const latestIos = process.env.LATEST_IOS_VERSION || '1.0.0';
      const iosStoreUrl = process.env.IOS_UPDATE_URL || 'https://apps.apple.com/us/app/osace-voluntariat/id6774091102';

      const minAndroid = process.env.MIN_ANDROID_VERSION || '1.0.0';
      const latestAndroid = process.env.LATEST_ANDROID_VERSION || '1.0.0';
      const androidStoreUrl = process.env.ANDROID_UPDATE_URL || 'https://play.google.com/store/apps/details?id=ro.osace.app&hl=en';

      let minRequired = '1.0.0';
      let latestVersion = '1.0.0';
      let updateUrl = androidStoreUrl;

      // Identificăm platforma
      if (platform.toLowerCase() === 'ios') {
        minRequired = minIos;
        latestVersion = latestIos;
        updateUrl = iosStoreUrl;
      } else {
        // Implicit Android
        minRequired = minAndroid;
        latestVersion = latestAndroid;
        updateUrl = androidStoreUrl;
      }

      // Funcție ajutătoare pentru a converti string-ul de versiune în array de numere
      const parseVersion = (v) => v.split('.').map(x => parseInt(x, 10) || 0);

      // Compară versiunile semantice: returnează 1 (v1 > v2), -1 (v1 < v2), 0 (v1 == v2)
      const compareVersions = (v1, v2) => {
        const parts1 = parseVersion(v1);
        const parts2 = parseVersion(v2);
        const len = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < len; i++) {
          const p1 = parts1[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 > p2) return 1;
          if (p1 < p2) return -1;
        }
        return 0;
      };

      // Verificăm dacă versiunea trimisă este mai mică decât cea minimă necesară
      const isOutdatedRequired = compareVersions(version, minRequired) < 0;

      // Verificăm dacă versiunea trimisă este mai mică decât cea mai nouă disponibilă
      const isOutdatedAvailable = compareVersions(version, latestVersion) < 0;

      return res.json({
        latestVersion,
        minRequiredVersion: minRequired,
        updateRequired: isOutdatedRequired,
        updateAvailable: isOutdatedAvailable,
        updateUrl
      });
    } catch (error) {
      console.error('Eroare la verificarea versiunii aplicației:', error);
      return res.status(500).json({ error: 'Eroare internă de server la verificarea versiunii.' });
    }
  });

  return router;
};
