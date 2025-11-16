import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '~/firebase';
import dayjs from 'dayjs';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

export default function OAuthCallback() {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const [busy, setBusy] = useState(true);
  const navOnce = useRef(false);// กัน replace ซ้ำ
  const cancelled = useRef(false);

  const go = (href: string) => {
    if (navOnce.current) return;
    navOnce.current = true;
    router.replace(href);
  };

  useEffect(() => () => { cancelled.current = true; }, []);

  useEffect(() => {
    (async () => {
      if (!authLoaded) return;

      const timer = setTimeout(() => {
        if (!navOnce.current) go('/auth/signin');
      }, 12000);

      try {
        if (!isSignedIn || !userId) {
          go('/auth/signin');
          return;
        }

        const token = await getToken({ template: 'integration_firebase' });
        if (token) {
          const auth = getAuth();
          await signInWithCustomToken(auth, token);
          await new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(true); } });
          });
        }

        const ref = doc(FIRESTORE_DB, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            email: user?.primaryEmailAddress?.emailAddress || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            createdAt: dayjs().toISOString(),
            isFirstLogin: true,
          });
          go('/auth/question');
          return;
        }

        const data = snap.data() || {};
        const needQuestion = !!data.isFirstLogin;
        go(needQuestion ? '/auth/question' : '/(tabs)/workout');
      } catch (e: any) {
        Alert.alert('Sign-in flow error', String(e?.message ?? e));
        go('/auth/signin');
      } finally {
        clearTimeout(timer);
        if (!cancelled.current) setBusy(false);
      }
    })();
  }, [authLoaded, isSignedIn, userId]);

  if (busy) {
    return (
      <View style={{ flex:1, backgroundColor:'#84BDEA', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <View style={{ flex:1, backgroundColor:'#84BDEA' }} />;
}
