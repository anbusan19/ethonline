// Ported from Agentry's app/console/layout.tsx — page-level metadata in a server
// layout since the console page itself is a client component.
export const metadata = {
  title: "Agentry Console",
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
