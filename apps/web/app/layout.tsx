import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";

import type { Metadata } from "next";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "Samsung Shared Disk",
  description: "SSO file upload approval"
};

const theme = createTheme({
  fontFamily: "Pretendard, SamsungOne, 'Segoe UI', Arial, sans-serif",
  primaryColor: "samsung",
  colors: {
    samsung: [
      "#edf2ff",
      "#dbe4ff",
      "#bac8ff",
      "#91a7ff",
      "#748ffc",
      "#5c7cfa",
      "#4c6ef5",
      "#4263eb",
      "#364fc7",
      "#1428a0"
    ]
  },
  defaultRadius: "md"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

