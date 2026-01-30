import { Redirect } from "expo-router";

// This file catches the PSN "com.scee...://redirect" deep link
// preventing the "Unmatched Route" error screen.
export default function PsnRedirect() {
  return <Redirect href="/" />;
}
