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

  it('allows walks to be tracked with the screen locked', () => {
    const plugin = appJson.expo.plugins.find(
      (entry) => Array.isArray(entry) && entry[0] === 'expo-location',
    ) as [string, Record<string, unknown>] | undefined;

    expect(plugin?.[1]).toEqual(
      expect.objectContaining({
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        locationAlwaysAndWhenInUsePermission: expect.stringContaining('walk'),
      }),
    );
    const modes = appJson.expo.ios.infoPlist.UIBackgroundModes;
    expect(modes).toContain('location');
    expect(new Set(modes).size).toBe(modes.length);
  });

  it('defines the walk location task when the app starts', () => {
    const fs = jest.requireActual('fs');
    // Jest runs from the frontend folder
    const layout = fs.readFileSync(`${process.cwd()}/app/_layout.tsx`, 'utf8');

    expect(layout).toContain('@/services/walkLocationTask');
  });

  it('is called WalkIt, with walkit:// links', () => {
    expect(appJson.expo.name).toBe('WalkIt');
    expect(appJson.expo.scheme).toBe('walkit');
    // The slug links the project to EAS (extra.eas.projectId), so it stays
    expect(appJson.expo.slug).toBe('frontend');
  });
});
