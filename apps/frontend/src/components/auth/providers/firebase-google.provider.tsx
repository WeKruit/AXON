'use client';

import { useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@gitroom/frontend/lib/firebase';
import { useFireEvents } from '@gitroom/helpers/utils/use.fire.events';
import { useTrack } from '@gitroom/react/helpers/use.track';
import { TrackEnum } from '@gitroom/nestjs-libraries/user/track.enum';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const FirebaseGoogleProvider = () => {
  const fetch = useFetch();
  const router = useRouter();
  const fireEvents = useFireEvents();
  const track = useTrack();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Sign in with Google using Firebase
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();

      // Send the Firebase ID token to our backend
      const response = await fetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'FIREBASE',
          providerToken: idToken,
          email: result.user.email,
          company: result.user.displayName || 'My Company',
          password: '',
        }),
      });

      if (response.ok) {
        fireEvents('register');
        await track(TrackEnum.CompleteRegistration);
        router.push('/');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Authentication failed');
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  }, [fetch, router, fireEvents, track]);

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div
        onClick={loading ? undefined : handleGoogleSignIn}
        className={`cursor-pointer flex-1 bg-white h-[52px] rounded-[10px] flex justify-center items-center text-[#0E0E0E] gap-[10px] ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full" />
        ) : (
          <>
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="21px"
                height="21px"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
            </div>
            <div>{t('sign_in_with_google', 'Sign in with Google')}</div>
          </>
        )}
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
    </div>
  );
};
