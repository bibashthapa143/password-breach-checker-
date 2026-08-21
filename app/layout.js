export const metadata = {
  title: "Password Checker",
  description: "Simple password strength & breach checker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
