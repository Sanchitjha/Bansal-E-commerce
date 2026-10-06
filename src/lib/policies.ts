import type { SiteSettings } from '@/types';

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Policy {
  title: string;
  description: string;
  sections: PolicySection[];
}

export const POLICY_SLUGS = ['terms', 'privacy', 'shipping', 'returns'] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const POLICY_UPDATED = '7 October 2026';

export const POLICY_LINKS: { slug: PolicySlug; label: string }[] = [
  { slug: 'terms', label: 'Terms & Conditions' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'shipping', label: 'Shipping Policy' },
  { slug: 'returns', label: 'Return & Refund Policy' },
];

export function getPolicy(slug: string, s: SiteSettings): Policy | null {
  const name = s.legalName || s.websiteName || 'Luminary';
  const email = s.contactEmail || 'our support email';
  const phone = s.contactPhone ? ` or call ${s.contactPhone}` : '';
  const contact = `${email}${phone}`;
  const threshold = `₹${s.freeShippingThreshold.toLocaleString('en-IN')}`;
  const shippingFee = `₹${s.defaultShippingCharge.toLocaleString('en-IN')}`;

  switch (slug) {
    case 'terms':
      return {
        title: 'Terms & Conditions',
        description: `The terms that apply when you browse or buy from ${name}.`,
        sections: [
          {
            heading: 'About these terms',
            paragraphs: [
              `These terms apply to your use of this website and to every order you place with ${name} ("we", "us"). By using the website or placing an order you agree to them. If you do not agree, please do not use the website.`,
              s.address ? `Seller details: ${name}, ${s.address}.${s.gstin ? ` GSTIN: ${s.gstin}.` : ''}` : '',
            ].filter(Boolean),
          },
          {
            heading: 'Products and prices',
            bullets: [
              'All prices are in Indian Rupees (INR) and include GST unless stated otherwise.',
              'We try to keep descriptions, images and prices accurate. Colours and packaging may vary slightly from the photos.',
              'If a product is listed at a wrong price or is out of stock, we may cancel the order and refund anything you have paid.',
              'Bulk prices apply automatically when you reach the quantity shown on the product page.',
            ],
          },
          {
            heading: 'Orders and payment',
            bullets: [
              'Your order is confirmed when you receive an order confirmation email. We may decline or cancel an order for reasons such as stock issues, payment failure, an undeliverable address or suspected misuse.',
              'You can pay online (UPI, cards, netbanking and wallets through our payment partner Razorpay) or by cash on delivery where available.',
              'We do not see or store your card or bank details. Online payments are processed by the payment partner.',
              'Coupons: one coupon can be used per order. Some coupons are valid on a first order only or on selected categories; this is checked at checkout. We may withdraw a coupon that is misused.',
            ],
          },
          {
            heading: 'Delivery and returns',
            paragraphs: ['Delivery is covered in our Shipping Policy and returns, replacements and refunds in our Return & Refund Policy. Both form part of these terms.'],
          },
          {
            heading: 'Your account',
            paragraphs: [
              'You can order as a guest or create an account. You are responsible for keeping your password confidential and for activity under your account. Tell us at once if you think someone else has used it.',
            ],
          },
          {
            heading: 'Use of the website',
            bullets: [
              'Do not misuse the site, attempt to access it without permission, or interfere with its operation.',
              'Text, images, logos and design on this website belong to us or our licensors and may not be copied without permission.',
              'Customer reviews must be honest and about a product you have bought or used.',
            ],
          },
          {
            heading: 'Liability',
            paragraphs: [
              'To the extent permitted by law, we are not liable for indirect or consequential loss, and our total liability for any order is limited to the amount you paid for it. Nothing here limits your rights under the Consumer Protection Act, 2019 or other applicable law.',
            ],
          },
          {
            heading: 'Governing law',
            paragraphs: [`These terms are governed by the laws of India. Courts in ${s.sellerState}, India have jurisdiction, subject to any rights you have under consumer protection law.`],
          },
          {
            heading: 'Complaints and grievances',
            paragraphs: [
              `If you have a complaint, write to ${contact}. Please include your order ID. We acknowledge complaints within 48 hours and aim to resolve them within one month, as required under the Consumer Protection (E-Commerce) Rules, 2020.`,
            ],
          },
        ],
      };

    case 'privacy':
      return {
        title: 'Privacy Policy',
        description: `How ${name} collects, uses and protects your personal information.`,
        sections: [
          {
            heading: 'What we collect',
            bullets: [
              'Details you give us: name, email, mobile number, delivery address, and your order and payment status.',
              'Account details if you register: email and an encrypted (hashed) password. We never store your password in readable form.',
              'Messages you send us, such as bulk quote requests, reviews and support emails.',
              'Technical data from cookies that keep your cart and login working (see below).',
            ],
          },
          {
            heading: 'How we use it',
            bullets: [
              'To process and deliver your orders, take payment, and send order updates and invoices.',
              'To run your account, answer questions and handle returns or complaints.',
              'To keep the store secure and prevent fraud or misuse of coupons.',
              'To meet legal, tax and accounting requirements, including GST invoicing.',
            ],
          },
          {
            heading: 'Who we share it with',
            paragraphs: ['We share only what is needed, with service providers that help us run the store:'],
            bullets: [
              'Payment partner (Razorpay) to process online payments.',
              'Courier and logistics partners to deliver your order.',
              'Email and hosting providers that send our emails and keep the website running.',
              'Authorities, when the law requires it.',
            ],
          },
          {
            heading: 'We do not sell your data',
            paragraphs: ['We do not sell your personal information to anyone.'],
          },
          {
            heading: 'Cookies',
            paragraphs: [
              'We use essential cookies only: one keeps your shopping cart between visits, and one keeps you signed in if you log in. They are not used for advertising.',
            ],
          },
          {
            heading: 'How long we keep it',
            paragraphs: ['We keep order records for as long as needed for tax, accounting and legal purposes, and account details until you ask us to delete the account.'],
          },
          {
            heading: 'Your choices',
            paragraphs: [
              `You can ask us to show, correct or delete your personal information, or to close your account, by writing to ${contact}. We may need to keep some order records where the law requires it.`,
            ],
          },
          {
            heading: 'Security',
            paragraphs: ['Data travels over encrypted connections, passwords are hashed, and access to customer data is limited to authorised staff. No system is perfectly secure, so please use a strong, unique password.'],
          },
          {
            heading: 'Changes',
            paragraphs: ['We may update this policy from time to time. The date at the top shows when it last changed.'],
          },
        ],
      };

    case 'shipping':
      return {
        title: 'Shipping Policy',
        description: `Delivery areas, timelines and charges for orders from ${name}.`,
        sections: [
          {
            heading: 'Where we deliver',
            paragraphs: ['We deliver across India to pincodes served by our courier partners. Enter your pincode on the home page or at checkout to confirm delivery and cash-on-delivery availability before you order.'],
          },
          {
            heading: 'Processing time',
            paragraphs: ['Orders are usually packed and handed to the courier within 1–2 business days of confirmation (Monday to Saturday, excluding public holidays). Orders placed on Sundays or holidays are processed on the next working day.'],
          },
          {
            heading: 'Delivery time',
            bullets: [
              `Within ${s.sellerState}: about 2–3 business days.`,
              'Metro cities: about 3–5 business days.',
              'Rest of India: about 5–7 business days.',
            ],
            paragraphs: ['These are estimates, not guarantees. Weather, strikes, festivals and courier delays can add time.'],
          },
          {
            heading: 'Shipping charges',
            paragraphs: [`Delivery is free on orders of ${threshold} or more after discounts. Below that, a flat delivery charge of ${shippingFee} applies. The exact charge is shown in your cart before you pay.`],
          },
          {
            heading: 'Cash on delivery',
            paragraphs: [s.codEnabled ? 'Cash on delivery is available on most pincodes. Please keep the exact amount ready. If COD is not available for your pincode, you will be asked to pay online.' : 'Cash on delivery is not available at the moment. Please pay online.'],
          },
          {
            heading: 'Tracking',
            paragraphs: ['When your order ships we email you the courier name and tracking number. You can also check your order status any time with your order ID and mobile number using "Track order" on the website.'],
          },
          {
            heading: 'Delivery problems',
            bullets: [
              'Please give a complete address and a working mobile number. Couriers call before delivery.',
              'If delivery fails after repeated attempts, the parcel returns to us. We will contact you to re-ship (extra shipping may apply) or refund the order amount.',
              'If a parcel looks tampered with or damaged, please do not accept it and write to us at once.',
            ],
          },
        ],
      };

    case 'returns':
      return {
        title: 'Return & Refund Policy',
        description: `How returns, replacements, cancellations and refunds work at ${name}.`,
        sections: [
          {
            heading: 'Cancelling an order',
            paragraphs: [`You can cancel before your order is shipped by writing to ${contact} with your order ID. We refund the full amount paid. Once an order has shipped it can no longer be cancelled, but you can refuse delivery or return it as described below.`],
          },
          {
            heading: 'When we replace or refund',
            paragraphs: ['Tell us within 7 days of delivery if your order arrived:'],
            bullets: [
              'damaged, leaking or broken,',
              'defective or not working (for gadgets), or',
              'different from what you ordered, or with items missing.',
            ],
          },
          {
            heading: 'What we need from you',
            bullets: [
              'Your order ID and mobile number.',
              'Clear photos or a short unboxing video showing the product, packaging and shipping label.',
              'The product unused and in its original packaging for replacements and returns.',
            ],
          },
          {
            heading: 'Items we cannot take back',
            paragraphs: ['For hygiene and safety reasons, opened or used perfumes, attars, skincare and personal-care products cannot be returned unless they arrived damaged or defective. Products damaged by misuse are not covered.'],
          },
          {
            heading: 'How we resolve it',
            paragraphs: ['After checking your photos we will offer a replacement, or a refund if a replacement is not possible. We arrange the pickup for approved cases at no cost to you.'],
          },
          {
            heading: 'Refund timeline',
            bullets: [
              'Online payments are refunded to the original payment method within 5–7 business days of approval. Your bank may take a few more days to show it.',
              'For cash-on-delivery orders we refund by bank transfer or UPI; we will ask for your details.',
              'If a payment was deducted but no order was created, the amount is returned automatically to your account, usually within 5–7 business days.',
            ],
          },
          {
            heading: 'Contact',
            paragraphs: [`Write to ${contact} and quote your order ID.`],
          },
        ],
      };

    default:
      return null;
  }
}
