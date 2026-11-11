import { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

const LegalLayout = ({ title, updatedAt, children }: LegalLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main className="container mx-auto max-w-3xl px-6 pb-24 pt-36 lg:px-12">
      <h1 className="text-3xl font-light tracking-tight text-foreground lg:text-4xl">{title}</h1>
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Atualizado em {updatedAt}</p>
      <div className="mt-10 space-y-6 text-sm font-light leading-relaxed text-muted-foreground [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalLayout;
