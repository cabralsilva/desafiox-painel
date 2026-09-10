import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { deleteAccessProfile, searchAccessProfiles } from "@/lib/api/accessProfiles";
import type { IAdminAccessProfile } from "@/types/accessProfile";
import type { IPaging } from "@/types/paging";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LIMIT = 8;

export default function AccessProfiles() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IAdminAccessProfile[]>([]);
  const [paging, setPaging] = useState<IPaging | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<IAdminAccessProfile | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchAccessProfiles({
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
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erro ao buscar perfis de acesso.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, paging?.totalPages ?? 1);

  const handleDelete = async () => {
    if (!deleting) return;
    setSavingDelete(true);
    try {
      await deleteAccessProfile(deleting._id);
      setItems((prev) => prev.filter((item) => item._id !== deleting._id));
      setPaging((prev) =>
        prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev
      );
      toast.success("Perfil excluído.");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir perfil.");
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Perfis de acesso</h1>
          <p className="text-sm text-muted-foreground">
            {paging ? `${paging.total} perfil(is)` : "Busca paginada"}
          </p>
        </div>
        <Button
          variant="accent"
          size="lg"
          className="h-12 min-w-[160px]"
          onClick={() => navigate("/app/perfis-acesso/novo")}
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
          placeholder="Buscar perfil..."
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
          Nenhum perfil encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((profile) => (
            <AccessProfileCard
              key={profile._id}
              profile={profile}
              onDelete={() => setDeleting(profile)}
            />
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

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir perfil</DialogTitle>
            <DialogDescription>
              Excluir o perfil {deleting?.name}? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="h-12"
              onClick={() => setDeleting(null)}
              disabled={savingDelete}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="h-12"
              onClick={handleDelete}
              disabled={savingDelete}
            >
              {savingDelete ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessProfileCard({
  profile,
  onDelete,
}: {
  profile: IAdminAccessProfile;
  onDelete: () => void;
}) {
  const roleCount = profile.roles?.length ?? 0;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft inner-border">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-black tracking-tight">{profile.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              profile.active ? "bg-primary/20 text-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {profile.active ? "Ativo" : "Inativo"}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            {roleCount} permissão(ões)
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          to={`/app/perfis-acesso/${profile._id}/editar`}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-secondary px-2 py-2 text-xs font-bold"
        >
          <Pencil className="h-4 w-4 text-accent" />
          Editar
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-secondary px-2 py-2 text-xs font-bold"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          Excluir
        </button>
      </div>
    </article>
  );
}
