import "./globals.css";

export const metadata = {
  title: "神経内科専門医試験アプリ",
  description: "Neurology learning app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}