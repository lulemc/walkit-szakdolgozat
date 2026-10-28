import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { shareWalkImage, SharingUnavailableError } from '../shareWalk';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const view = { current: {} } as never;

beforeEach(() => {
  jest.clearAllMocks();
  (captureRef as jest.Mock).mockResolvedValue('file:///tmp/walk.png');
  (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
});

describe('shareWalkImage', () => {
  it("takes a picture of the card and opens the phone's share sheet with it", async () => {
    await shareWalkImage(view, 'Share your walk');

    expect(captureRef).toHaveBeenCalledWith(view, { format: 'png', quality: 1, result: 'tmpfile' });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///tmp/walk.png', {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Share your walk',
    });
  });

  it("says so when the phone can't share", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await expect(shareWalkImage(view, 'Share')).rejects.toBeInstanceOf(SharingUnavailableError);
    expect(captureRef).not.toHaveBeenCalled();
  });
});
