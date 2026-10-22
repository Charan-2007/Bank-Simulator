import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

export async function hapticImpactLight() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // ignore on unsupported devices
  }
}

export async function hapticImpactMedium() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    // ignore
  }
}

export async function hapticNotificationSuccess() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    // ignore
  }
}

export async function hapticNotificationError() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    // ignore
  }
}

export default {
  light: hapticImpactLight,
  medium: hapticImpactMedium,
  success: hapticNotificationSuccess,
  error: hapticNotificationError
};
