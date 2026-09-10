import { FullScreenPage } from "@/components/FullScreenPage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCESS_ROLE_GROUPS,
  ROLE_ACTION_LABELS,
  ROLE_ACTIONS,
  allRoleKeys,
  groupRoleKeys,
  resourceRoleKeys,
  roleKey,
  type RoleAction,
} from "@/lib/accessRoles";
import {
  createAccessProfile,
  getAccessProfileById,
  updateAccessProfile,
} from "@/lib/api/accessProfiles";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function AccessProfileForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");

  const catalog = useMemo(() => allRoleKeys(), []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getAccessProfileById(id)
      .then((profile) => {
        if (cancelled) return;
        setName(profile.name ?? "");
        setActive(profile.active !== false);
        setRoles(profile.roles ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar perfil."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const setMany = (keys: string[], checked: boolean) => {
    setRoles((prev) => {
      if (checked) return Array.from(new Set([...prev, ...keys]));
      return prev.filter((r) => !keys.includes(r));
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = { name: name.trim(), roles, active };
      if (isEdit && id) {
        await updateAccessProfile(id, payload);
        toast.success("Perfil atualizado.");
      } else {
        await createAccessProfile(payload);
        toast.success("Perfil criado.");
      }
      navigate("/app/perfis-acesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FullScreenPage
        title={isEdit ? "Editar perfil de acesso" : "Novo perfil de acesso"}
        backTo="/app/perfis-acesso"
      >
        <p className="p-8 text-center text-muted-foreground">Carregando...</p>
      </FullScreenPage>
    );
  }

  const allSelected = catalog.length > 0 && catalog.every((r) => roles.includes(r));

  return (
    <FullScreenPage
      title={isEdit ? `Editar perfil · ${name || "Perfil"}` : "Novo perfil de acesso"}
      backTo="/app/perfis-acesso"
      footer={
        <Button
          type="submit"
          form="access-profile-form"
          variant="accent"
          size="lg"
          className="h-12 w-full"
          disabled={saving}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar perfil"}
        </Button>
      }
    >
      <form id="access-profile-form" onSubmit={handleSubmit} className="space-y-5 p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome *</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Operação, Financeiro, Master"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <label className="flex min-h-12 items-center gap-3">
          <Checkbox checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
          <span className="font-semibold">Perfil ativo</span>
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label>Permissões</Label>
            <div className="flex gap-3 text-sm font-semibold">
              <button type="button" className="text-accent" onClick={() => setMany(catalog, !allSelected)}>
                {allSelected ? "Limpar tudo" : "Todas"}
              </button>
            </div>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            {roles.length} permissão(ões) selecionada(s)
          </p>

          <div className="space-y-4">
            {ACCESS_ROLE_GROUPS.map((group) => {
              const keys = groupRoleKeys(group);
              const groupAll = keys.every((k) => roles.includes(k));
              return (
                <section key={group.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-base font-black tracking-tight">{group.label}</h2>
                    <button
                      type="button"
                      className="text-sm font-semibold text-accent"
                      onClick={() => setMany(keys, !groupAll)}
                    >
                      {groupAll ? "Limpar" : "Todas"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {group.resources.map((resource) => {
                      const resourceKeys = resourceRoleKeys(resource.prefix);
                      const resourceAll = resourceKeys.every((k) => roles.includes(k));
                      return (
                        <div key={resource.prefix} className="rounded-xl bg-secondary/60 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-bold">{resource.label}</p>
                            <button
                              type="button"
                              className="text-xs font-semibold text-accent"
                              onClick={() => setMany(resourceKeys, !resourceAll)}
                            >
                              {resourceAll ? "Limpar" : "Todas"}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {ROLE_ACTIONS.map((action: RoleAction) => {
                              const key = roleKey(resource.prefix, action);
                              const checked = roles.includes(key);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => toggleRole(key)}
                                  className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-left ${
                                    checked ? "bg-primary/20 ring-1 ring-primary" : "bg-background"
                                  }`}
                                >
                                  <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border ${
                                      checked
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-primary"
                                    }`}
                                  >
                                    {checked ? "✓" : ""}
                                  </span>
                                  <span className="text-sm font-semibold">{ROLE_ACTION_LABELS[action]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </form>
    </FullScreenPage>
  );
}
