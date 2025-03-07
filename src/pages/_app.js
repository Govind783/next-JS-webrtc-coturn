import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export default function App({ Component, pageProps }) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </>
  );
}
