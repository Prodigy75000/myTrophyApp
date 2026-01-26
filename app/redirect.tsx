import { Redirect } from "expo-router";

// This file just catches the redirect URL and sends the user back Home
// The SideMenu.tsx listener will handle the actual logic in the background
export default function RedirectPage() {
  return <Redirect href="/" />;
}
