import appJson from '../app.json';
import type { ConfigContext } from 'expo/config';
import appConfig from '../app.config';

const baseConfig = appJson.expo as ConfigContext['config'];
/** What Expo passes in: app.json's contents plus some paths */
const context = (): ConfigContext => ({
  config: baseConfig,
  projectRoot: '',
  staticConfigPath: null,
  packageJsonPath: null,
});
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('app config', () => {
  it('keeps no Google API key in the committed app.json', () => {
    expect(JSON.stringify(appJson)).not.toMatch(/AIza[0-9A-Za-z_-]{10,}/);
  });

  it('reads the Google Maps keys from the environment', () => {
    process.env.GOOGLE_MAPS_IOS_KEY = 'ios-key';
    process.env.GOOGLE_MAPS_ANDROID_KEY = 'android-key';

    const config = appConfig(context());

    expect(config.ios?.config?.googleMapsApiKey).toBe('ios-key');
    expect(config.android?.config?.googleMaps?.apiKey).toBe('android-key');
  });

  it('keeps the rest of app.json', () => {
    const config = appConfig(context());

    expect(config.ios?.bundleIdentifier).toBe('com.walkit.app');
    expect(config.android?.package).toBe('com.walkit.app');
    expect(config.plugins).toEqual(baseConfig.plugins);
  });

  it('leaves the keys out when they are not set', () => {
    delete process.env.GOOGLE_MAPS_IOS_KEY;
    delete process.env.GOOGLE_MAPS_ANDROID_KEY;

    const config = appConfig(context());

    expect(config.ios?.config?.googleMapsApiKey).toBeUndefined();
    expect(config.android?.config?.googleMaps?.apiKey).toBeUndefined();
  });
});
