import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/** The phone has no share sheet (e.g. some web browsers) */
export class SharingUnavailableError extends Error {
  constructor() {
    super('Sharing is not available on this device');
    this.name = 'SharingUnavailableError';
  }
}

/** Takes a picture of the view and opens the phone's share sheet with it */
export const shareWalkImage = async (view: RefObject<View | null>, dialogTitle: string): Promise<void> => {
  if (!(await Sharing.isAvailableAsync())) throw new SharingUnavailableError();
  const uri = await captureRef(view, { format: 'png', quality: 1, result: 'tmpfile' });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
};
