import "./jake.css";

export default function JakeLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg text-ink">{children}</div>;
}
