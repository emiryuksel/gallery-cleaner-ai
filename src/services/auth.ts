import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = '@swipebox/session';

export type AuthProvider = 'apple' | 'google' | 'email';

export interface AuthSessionInfo {
  provider: AuthProvider;
  userId: string;
  email: string | null;
  displayName: string | null;
}

export async function getStoredSession(): Promise<AuthSessionInfo | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionInfo;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSessionInfo): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function signInWithApple(): Promise<AuthSessionInfo> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple ile giriş yalnızca iOS cihazlarda kullanılabilir.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Bu cihazda Apple ile giriş desteklenmiyor.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const session: AuthSessionInfo = {
    provider: 'apple',
    userId: credential.user,
    email: credential.email,
    displayName: credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ') || null
      : null,
  };

  await saveSession(session);
  return session;
}

export async function signInWithGoogle(): Promise<AuthSessionInfo> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google girişi henüz yapılandırılmadı. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ekleyin.');
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'swipebox' });
  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.Token,
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success' || !result.authentication?.accessToken) {
    throw new Error('Google girişi iptal edildi.');
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${result.authentication.accessToken}` },
  });

  if (!profileResponse.ok) {
    throw new Error('Google profili alınamadı.');
  }

  const profile = (await profileResponse.json()) as {
    sub: string;
    email?: string;
    name?: string;
  };

  const session: AuthSessionInfo = {
    provider: 'google',
    userId: profile.sub,
    email: profile.email ?? null,
    displayName: profile.name ?? null,
  };

  await saveSession(session);
  return session;
}

export async function signInWithEmail(email: string): Promise<AuthSessionInfo> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Geçerli bir e-posta adresi gir.');
  }

  const session: AuthSessionInfo = {
    provider: 'email',
    userId: `email:${normalized}`,
    email: normalized,
    displayName: normalized.split('@')[0],
  };

  await saveSession(session);
  return session;
}
