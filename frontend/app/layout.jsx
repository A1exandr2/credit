import "./globals.css";
export const metadata = {
  title: "Альфа · Кабинет бизнеса",
  description: "Кредитный кабинет предпринимателя",
  robots: { index: false, follow: false },
};
export default function Layout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
