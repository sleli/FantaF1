'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return <button onClick={() => signIn()}>Sign In with Google</button>;
  }
  return (
    <div>
      <p>Welcome, {session.user?.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
