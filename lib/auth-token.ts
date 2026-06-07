// Serwerowy odczyt tokenu GitHub z zaszyfrowanego JWT (ciasteczko sesji).
// UWAGA: używać WYŁĄCZNIE w serwerowych API routes. Token nie jest nigdzie
// wysyłany do przeglądarki — odszyfrowanie wymaga NEXTAUTH_SECRET (tylko serwer).
import { getToken } from "next-auth/jwt";

export type ServerAuth = {
  accessToken: string;
  login: string | null;
  // Publiczne dane profilu z zaszyfrowanego JWT — do upsertu wiersza w users.
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export async function getServerAuth(req: Request): Promise<ServerAuth | null> {
  // W produkcji (https) NextAuth używa nazwy ciasteczka z prefiksem __Secure-,
  // więc dobieramy ją na podstawie NEXTAUTH_URL; salt = nazwa ciasteczka.
  const secureCookie = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  const accessToken = token?.accessToken;
  if (typeof accessToken !== "string" || !accessToken) return null;

  const login = typeof token?.login === "string" ? token.login : null;
  // name/picture to standardowe pola JWT (NextAuth zapisuje je z profilu GitHub),
  // bio dociągnięte do token.github przy logowaniu. profileUrl wyliczamy z loginu.
  const name =
    typeof token?.name === "string" && token.name.trim() ? token.name : null;
  const avatarUrl =
    typeof token?.picture === "string" && token.picture ? token.picture : null;
  const bio =
    typeof token?.github?.bio === "string" && token.github.bio.trim()
      ? token.github.bio
      : null;
  return { accessToken, login, name, avatarUrl, bio };
}
