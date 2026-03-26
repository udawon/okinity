import { Hero } from '@/components/hero';
import { ToursSection } from '@/components/tours-section';
import { WhySection } from '@/components/why-section';
import { ConsultationForm } from '@/components/consultation-form';

export default function Home() {
  return (
    <>
      <Hero />
      <ToursSection />
      <WhySection />
      <ConsultationForm />
    </>
  );
}
