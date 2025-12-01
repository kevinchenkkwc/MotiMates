import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getCurrentUser } from '../utils/api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to login on app start
    let isMounted = true;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!isMounted) return;
        if (user) {
          router.replace('/tabs/3-home');
        } else {
          router.replace('/auth/login');
        }
      } catch (e) {
        if (!isMounted) return;
        router.replace('/auth/login');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
