import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE, getAccessToken } from './api';

/**
 * Descarga un PDF autenticado del API y abre el diálogo para compartirlo/guardarlo.
 * @param path     ruta del endpoint (ej. '/orders/123/receipt.pdf')
 * @param filename nombre del archivo local (ej. 'FG-123.pdf')
 * @param title    título del diálogo de compartir
 */
export async function downloadAndSharePdf(path: string, filename: string, title?: string): Promise<void> {
  const target = `${FileSystem.cacheDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(`${API_BASE}${path}`, target, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
  });

  if (result.status !== 200) {
    throw new Error(`No se pudo descargar el PDF (HTTP ${result.status})`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: title ?? filename,
      UTI: 'com.adobe.pdf',
    });
  }
}

/** Manifiesto Ship Provisioning en PDF. */
export function downloadAndShareManifest(requestId: string, manifestRef: string): Promise<void> {
  return downloadAndSharePdf(
    `/provisioning/requests/${requestId}/manifest.pdf`,
    `${manifestRef}.pdf`,
    `Manifiesto ${manifestRef}`,
  );
}

/** Recibo de pedido en PDF. */
export function downloadAndShareReceipt(orderId: string, reference: string): Promise<void> {
  return downloadAndSharePdf(`/orders/${orderId}/receipt.pdf`, `${reference}.pdf`, `Recibo ${reference}`);
}
