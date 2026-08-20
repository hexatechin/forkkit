import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata = {
  title: "Indocia — Your shop, online in 60 seconds",
  description:
    "Beautiful storefronts for bakeries, florists, cafés, tiffin services and coworking spaces. Customers order via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-v2.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);',
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
