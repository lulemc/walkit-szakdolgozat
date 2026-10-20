import { regionForCoordinates } from '../mapRegion';

describe('regionForCoordinates', () => {
  it('centres on the route and leaves some room around it', () => {
    const region = regionForCoordinates([
      { latitude: 47.0, longitude: 19.0 },
      { latitude: 47.2, longitude: 19.4 },
      { latitude: 47.1, longitude: 19.1 },
    ]);

    expect(region.latitude).toBeCloseTo(47.1);
    expect(region.longitude).toBeCloseTo(19.2);
    expect(region.latitudeDelta).toBeGreaterThan(0.2);
    expect(region.longitudeDelta).toBeGreaterThan(0.4);
  });

  it('still zooms to a sensible level for a single point', () => {
    const region = regionForCoordinates([{ latitude: 47, longitude: 19 }]);

    expect(region).toEqual(expect.objectContaining({ latitude: 47, longitude: 19 }));
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
  });
});
