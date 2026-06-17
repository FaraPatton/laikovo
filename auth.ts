import NextAuth, { type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";

const authorizedEmails = new Set(
  (process.env.AUTHORIZED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/spreadsheets",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();

      if (!email) {
        return false;
      }

      return authorizedEmails.has(email);
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 55 * 60 * 1000;
      }

      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 60 * 1000
      ) {
        return token;
      }

      if (!token.refreshToken) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID ?? "",
        client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      }),
    });

    const refreshed = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!response.ok || !refreshed.access_token) {
      throw new Error("Unable to refresh Google access token.");
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch {
    return token;
  }
}
