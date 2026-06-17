import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE, getAccessToken } from './api';

/**
 * Descarga el manifiesto PDF de una solicitud de provisioning y abre el diálogo
 * para compartirlo/guardarlo. Requiere sesión (Bearer token).
 */
export async function downloadAndShareManifest(requestId: string, manifestRef: string): Promise<void> {
  const url = `${API_BASE}/provisioning/requests/${requestId}/manifest.pdf`;
  const target = `${FileSystem.cacheDirectory}${manifestRef}.pdf`;

  const result = await FileSystem.downloadAsync(url, target, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
  });

  if (result.status !== 200) {
    throw new Error(`No se pudo descargar el manifiesto (HTTP ${result.status})`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Manifiesto ${manifestRef}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
