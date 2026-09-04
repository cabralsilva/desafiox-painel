export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <h1 className="text-2xl font-black">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">O endereço não existe neste painel.</p>
    </div>
  );
}
