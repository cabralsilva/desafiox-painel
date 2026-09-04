import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Construction className="h-10 w-10 text-accent" />
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esta área entra nas próximas etapas do painel.
      </p>
    </div>
  );
}
