import Dashboard from './dashboard';
import { currentUser } from './session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  return <Dashboard user={user ? { username: user.username } : null} />;
}
