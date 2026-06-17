/**
 * @deprecated El flujo de pago real vive ahora en `./checkout.ts` (runCheckout),
 * que crea el pedido en el API y resuelve la acción del proveedor.
 * Este archivo se mantiene solo como reexport para compatibilidad.
 */
export { runCheckout } from './checkout';
export type { CheckoutInput, CheckoutResult } from './checkout';
