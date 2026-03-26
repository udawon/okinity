import { pgTable, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const consultations = pgTable('consultations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tourId: text('tour_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  preferredContact: varchar('preferred_contact', { length: 20 }).notNull(), // kakao | line | email | phone
  contactId: text('contact_id').notNull(),
  preferredDate: text('preferred_date').notNull(), // ISO 8601
  partySize: integer('party_size').notNull(),
  message: text('message'),
  language: varchar('language', { length: 5 }).notNull().default('ko'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | consulting | confirmed | cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultationId: text('consultation_id').notNull().references(() => consultations.id),
  tourId: text('tour_id').notNull(),
  totalAmount: integer('total_amount').notNull(), // JPY integer
  depositAmount: integer('deposit_amount').notNull(), // Math.ceil(totalAmount * 0.1)
  stripePaymentId: text('stripe_payment_id'),
  confirmedDate: text('confirmed_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('deposit_pending'), // deposit_pending | deposit_paid | completed | cancelled | refunded
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
