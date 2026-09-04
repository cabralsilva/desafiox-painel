import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Pencil, Table2, ListOrdered, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchChampionships } from "@/lib/api/championships";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateBR } from "@/lib/dates";
import { MODALITY_LABELS } from "@/types/team";
import type { Championship } from "@/types/championship";
import type { IPaging } from "@/types/paging";

const LIMIT = 8;

export default function Championships() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Championship[]>([]);
  const [paging, setPaging] = useState<IPaging | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchChampionships({
      page,
      limit: LIMIT,
      searchText: debouncedSearch.trim() || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setPaging(res.paging);
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erro ao buscar campeonatos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, paging?.totalPages ?? 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Campeonatos</h1>
          <p className="text-sm text-muted-foreground">
            {paging ? `${paging.total} campeonato(s)` : "Busca paginada"}
          </p>
        </div>
        <Button
          variant="accent"
          size="lg"
          className="h-12 min-w-[160px]"
          onClick={() => navigate("/app/campeonatos/novo")}
        >
          <Plus className="h-5 w-5" />
          Novo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar campeonato..."
          className="h-14 pl-11"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Nenhum campeonato encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((champ) => (
            <ChampionshipCard key={champ.id} championship={champ} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 w-12 p-0"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="min-w-[7rem] text-center text-sm font-semibold tabular-nums">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 w-12 p-0"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

function ChampionshipCard({ championship }: { championship: Championship }) {
  const teamCount = championship.teams?.length || championship.teamIds.length;
  const period =
    championship.startDate || championship.endDate
      ? `${formatDateBR(championship.startDate)} → ${formatDateBR(championship.endDate)}`
      : "Período não definido";

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft inner-border">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-black tracking-tight">{championship.name}</h2>
        {championship.slug && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{championship.slug}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {MODALITY_LABELS[championship.modality]}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            {teamCount} time(s)
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{period}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Link
          to={`/app/campeonatos/${championship.id}/editar`}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-secondary px-2 py-2 text-xs font-bold"
        >
          <Pencil className="h-4 w-4 text-accent" />
          Editar
        </Link>
        <Link
          to={`/app/campeonatos/${championship.id}/tabela`}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-secondary px-2 py-2 text-xs font-bold"
        >
          <Table2 className="h-4 w-4 text-highlight" />
          Tabela
        </Link>
        <Link
          to={`/app/campeonatos/${championship.id}/rodadas`}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-secondary px-2 py-2 text-xs font-bold"
        >
          <ListOrdered className="h-4 w-4 text-primary" />
          Rodadas
        </Link>
      </div>
    </article>
  );
}
