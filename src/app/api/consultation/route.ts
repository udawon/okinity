import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { consultations } from '@/lib/db/schema';
import { sendConsultationAlert } from '@/lib/email';
import { getTourById } from '@/lib/tours';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tourId,
      customerName,
      customerEmail,
      preferredContact,
      contactId,
      preferredDate,
      partySize,
      message,
      language,
    } = body;

    // Validation
    if (!tourId || !customerName || !customerEmail || !preferredContact || !contactId || !preferredDate || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to DB
    const [consultation] = await getDb()
      .insert(consultations)
      .values({
        tourId,
        customerName,
        customerEmail,
        preferredContact,
        contactId,
        preferredDate,
        partySize: Number(partySize),
        message: message || null,
        language: language || 'ko',
        status: 'pending',
      })
      .returning();

    // Send email notifications
    const tour = getTourById(tourId);
    const tourTitle = tour
      ? tour.title[language as 'ko' | 'ja' | 'en'] || tour.title.en
      : 'Unknown Tour';

    try {
      await sendConsultationAlert({
        customerName,
        customerEmail,
        preferredContact,
        contactId,
        tourTitle,
        preferredDate,
        partySize: Number(partySize),
        message,
        language: language || 'ko',
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Email send failed:', emailError);
    }

    return NextResponse.json({ success: true, id: consultation.id });
  } catch (error) {
    console.error('Consultation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
