import { StoreOrder, StoreProduct } from '../types';

/**
 * Formats a comprehensive, professional WhatsApp delivery message
 * containing all product delivery details configured by the admin.
 */
export function formatWhatsAppDeliveryMessage(
  order: StoreOrder,
  product?: StoreProduct,
  supportPhone?: string
): string {
  const customerName = order.customer_name || 'Customer';
  const orderNumber = order.order_number;
  const productName = product?.name || order.items?.[0]?.product_name_snapshot || 'Digital Product';
  const amount = Math.round(order.total_paise / 100);

  const accessLink = product?.access_link || '';
  const licenseKey = product?.license_key || '';
  const instructions = product?.instructions || '';
  const accessInfo = product?.access_info || '';
  const deliveryNotes = order.delivery_notes || product?.delivery_notes || '';
  const hasFile = Boolean(product?.product_file_path || product?.file_name);

  let msg = `🎉 *Order Confirmed & Delivered! - VyapaarPro*\n\n`;
  msg += `Hello *${customerName}*,\n`;
  msg += `Thank you for your order! Your payment for Order *${orderNumber}* has been verified and your digital product deliverables are ready.\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *ORDER & PRODUCT SUMMARY*\n`;
  msg += `• *Product:* ${productName}\n`;
  msg += `• *Order ID:* ${orderNumber}\n`;
  msg += `• *Amount Paid:* ₹${amount.toLocaleString('en-IN')}\n`;
  msg += `• *Status:* Verified & Delivered ✅\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  let hasDeliveryDetails = false;
  let deliverySection = `🚀 *YOUR PRODUCT DELIVERY DETAILS*\n\n`;

  if (accessLink) {
    hasDeliveryDetails = true;
    deliverySection += `🔗 *Access / Resource Link:*\n${accessLink}\n\n`;
  }

  if (licenseKey) {
    hasDeliveryDetails = true;
    deliverySection += `🔑 *License / Access Key:*\n\`${licenseKey}\`\n\n`;
  }

  if (hasFile) {
    hasDeliveryDetails = true;
    deliverySection += `📁 *Digital Package File:*\n${product?.file_name || 'Downloadable Asset Package'}\n(Available for direct high-speed download in your VyapaarPro workspace)\n\n`;
  }

  if (accessInfo) {
    hasDeliveryDetails = true;
    deliverySection += `🔐 *Access Information / Credentials:*\n${accessInfo}\n\n`;
  }

  if (instructions) {
    hasDeliveryDetails = true;
    deliverySection += `📋 *Setup & Access Instructions:*\n${instructions}\n\n`;
  }

  if (deliveryNotes) {
    hasDeliveryDetails = true;
    deliverySection += `📝 *Delivery Notes:*\n${deliveryNotes}\n\n`;
  }

  if (hasDeliveryDetails) {
    msg += deliverySection;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  msg += `🌐 *Customer Portal:* https://vyapaarpro.in/app/orders/${order.id}\n`;
  msg += `💬 *Support Helpdesk:* If you have questions or need assistance, reply directly to this chat.\n\n`;
  msg += `Thank you for trusting VyapaarPro! 🚀`;

  return msg;
}

/**
 * Builds direct WhatsApp URL with the formatted delivery message
 */
export function getWhatsAppDeliveryUrl(
  phone: string,
  order: StoreOrder,
  product?: StoreProduct,
  supportPhone?: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const message = formatWhatsAppDeliveryMessage(order, product, supportPhone);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds direct WhatsApp support URL for a customer needing help with an order
 */
export function getCustomerSupportWhatsAppUrl(order: StoreOrder, adminWhatsApp = '919876543210'): string {
  const cleanPhone = adminWhatsApp.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const text = encodeURIComponent(
    `Hello VyapaarPro Support,\n\nI need assistance with my Store Order *${order.order_number}* (${order.items?.[0]?.product_name_snapshot || 'Digital Product'}).\n\nMy registered email: ${order.customer_email || '—'}`
  );
  return `https://wa.me/${targetPhone}?text=${text}`;
}
