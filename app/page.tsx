import AuthGate from '@/components/AuthGate';
import HouseApp from '@/components/HouseApp';

export default function Home() {
  return (
    <AuthGate>
      <HouseApp />
    </AuthGate>
  );
}
