import { prisma } from './prisma';
import { adminNewOrderEmail, orderConfirmationEmail, orderStatusEmail, sendEmail, type MailOrder } from './email';

async function brandAndAdminEmail() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
  return { brand: settings?.websiteName ?? 'Luminary', adminEmail: settings?.contactEmail ?? '' };
}

/** Customer confirmation plus an alert to the store owner. Safe to await: it never throws. */
export async function sendOrderPlacedEmails(order: MailOrder): Promise<void> {
  const { brand, adminEmail } = await brandAndAdminEmail();
  const confirmation = orderConfirmationEmail(order, brand);
  const alert = adminNewOrderEmail(order, brand);
  await Promise.allSettled([
    sendEmail({ to: order.email, ...confirmation }),
    adminEmail ? sendEmail({ to: adminEmail, ...alert }) : Promise.resolve(false),
  ]);
}

export async function sendOrderStatusEmail(order: MailOrder): Promise<void> {
  const { brand } = await brandAndAdminEmail();
  await sendEmail({ to: order.email, ...orderStatusEmail(order, brand) });
}
