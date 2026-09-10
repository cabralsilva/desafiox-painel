import { FullScreenPage } from "@/components/FullScreenPage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAccessProfiles } from "@/lib/api/accessProfiles";
import { createAdminAccount, getAdminAccountById, updateAdminAccount } from "@/lib/api/adminAccounts";
import { utcISOToLocalDateString } from "@/lib/dates";
import type { IAdminAccessProfile } from "@/types/accessProfile";
import {
  adminAccessProfileId,
  type IAdminAccountPhone,
} from "@/types/adminAccount";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function AdminUserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<IAdminAccessProfile[]>([]);
  const [name, setName] = useState("");
  const [emailAccess, setEmailAccess] = useState("");
  const [passwordAccess, setPasswordAccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState(true);
  const [profileId, setProfileId] = useState("");
  const [bornDate, setBornDate] = useState("");
  const [phones, setPhones] = useState<IAdminAccountPhone[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const profilesRes = await searchAccessProfiles({ page: 1, limit: 200 });
      if (cancelled) return;
      setProfiles(profilesRes.items ?? []);
      if (id) {
        const account = await getAdminAccountById(id);
        if (cancelled) return;
        setName(account.name ?? "");
        setEmailAccess(account.emailAccess ?? "");
        setActive(account.active !== false);
        setProfileId(adminAccessProfileId(account.adminAccessProfile));
        setBornDate(utcISOToLocalDateString(account.bornDate ?? undefined) ?? "");
        setPhones(account.phones?.length ? account.phones.map((p) => ({ ...p })) : []);
      }
    };
    load()
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar usuário."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome.";
    if (!emailAccess.trim()) next.emailAccess = "Informe o e-mail de acesso.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAccess.trim())) {
      next.emailAccess = "E-mail inválido.";
    }
    if (!isEdit && !passwordAccess.trim()) next.passwordAccess = "Informe a senha.";
    else if (passwordAccess.trim() && passwordAccess.trim().length < 6) {
      next.passwordAccess = "A senha deve ter ao menos 6 caracteres.";
    }
    if (!profileId) next.profileId = "Selecione o perfil de acesso.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        emailAccess: emailAccess.trim().toLowerCase(),
        phones: phones.filter((p) => p.value.trim()),
        active,
        bornDate: bornDate || null,
        adminAccessProfile: profileId,
        ...(passwordAccess.trim() ? { passwordAccess: passwordAccess.trim() } : {}),
      };
      if (isEdit && id) {
        await updateAdminAccount(id, payload);
        toast.success("Usuário atualizado.");
      } else {
        await createAdminAccount(payload);
        toast.success("Usuário criado.");
      }
      navigate("/app/usuarios");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FullScreenPage
        title={isEdit ? "Editar usuário" : "Novo usuário"}
        backTo="/app/usuarios"
      >
        <p className="p-8 text-center text-muted-foreground">Carregando...</p>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={isEdit ? `Editar usuário · ${name || "Usuário"}` : "Novo usuário"}
      backTo="/app/usuarios"
      footer={
        <Button
          type="submit"
          form="admin-user-form"
          variant="accent"
          size="lg"
          className="h-12 w-full"
          disabled={saving}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar usuário"}
        </Button>
      }
    >
      <form id="admin-user-form" onSubmit={handleSubmit} className="space-y-5 p-4 md:p-6">
        <Field label="Nome *" error={errors.name}>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
        </Field>

        <Field label="E-mail de acesso *" error={errors.emailAccess}>
          <Input
            id="user-email"
            type="email"
            autoComplete="username"
            value={emailAccess}
            onChange={(e) => setEmailAccess(e.target.value)}
            placeholder="admin@desafiox.app"
          />
        </Field>

        <Field
          label={isEdit ? "Senha (deixe em branco para manter)" : "Senha *"}
          error={errors.passwordAccess}
        >
          <div className="relative">
            <Input
              id="user-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isEdit ? "new-password" : "new-password"}
              value={passwordAccess}
              onChange={(e) => setPasswordAccess(e.target.value)}
              placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
              className="pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-muted-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        <Field label="Perfil de acesso *" error={errors.profileId}>
          <select
            id="user-profile"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="flex h-12 w-full rounded-md border border-input bg-card px-3 text-base"
          >
            <option value="">Selecione um perfil</option>
            {profiles.map((profile) => (
              <option key={profile._id} value={profile._id}>
                {profile.name}
                {profile.active ? "" : " (inativo)"}
              </option>
            ))}
          </select>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre um perfil de acesso antes de criar usuários.
            </p>
          ) : null}
        </Field>

        <Field label="Data de nascimento">
          <Input type="date" value={bornDate} onChange={(e) => setBornDate(e.target.value)} />
        </Field>

        <label className="flex min-h-12 items-center gap-3">
          <Checkbox checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
          <span className="font-semibold">Usuário ativo</span>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Telefones</Label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPhones((prev) => [...prev, { label: "WhatsApp", value: "" }])}
            >
              <Plus className="h-4 w-4" />
              Telefone
            </Button>
          </div>
          {phones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {phones.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phone.label}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, label: e.target.value } : p))
                      )
                    }
                    placeholder="Rótulo"
                    className="w-32 shrink-0"
                  />
                  <Input
                    value={phone.value}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, value: e.target.value } : p))
                      )
                    }
                    placeholder="Número"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 w-12 shrink-0 p-0 text-destructive"
                    onClick={() => setPhones((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remover telefone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </FullScreenPage>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
