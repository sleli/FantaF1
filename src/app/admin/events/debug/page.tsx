import EventApiDebugger from '@/components/admin/EventApiDebugger';

export default function EventDebugPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Event API Debug</h1>
      <EventApiDebugger />
    </main>
  );
}
