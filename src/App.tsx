import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/RequireAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Championships from "@/pages/Championships";
import ChampionshipForm from "@/pages/ChampionshipForm";
import ChampionshipTable from "@/pages/ChampionshipTable";
import ChampionshipRounds from "@/pages/ChampionshipRounds";
import AccessProfiles from "@/pages/AccessProfiles";
import AccessProfileForm from "@/pages/AccessProfileForm";
import AdminUsers from "@/pages/AdminUsers";
import AdminUserForm from "@/pages/AdminUserForm";
import SupportChat from "@/pages/SupportChat";
import ComingSoon from "@/pages/ComingSoon";
import NotFound from "@/pages/NotFound";
import { isAuthenticated } from "@/lib/session";

const queryClient = new QueryClient();

function LoginGate() {
  if (isAuthenticated()) return <Navigate to="/app" replace />;
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginGate />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="chat-suporte" element={<SupportChat />} />
              <Route path="campeonatos" element={<Championships />} />
              <Route path="desafios" element={<ComingSoon title="Desafios" />} />
              <Route path="perfis-acesso" element={<AccessProfiles />} />
              <Route path="usuarios" element={<AdminUsers />} />
            </Route>
            <Route path="/app/campeonatos/novo" element={<ChampionshipForm />} />
            <Route path="/app/campeonatos/:id/editar" element={<ChampionshipForm />} />
            <Route path="/app/campeonatos/:id/tabela" element={<ChampionshipTable />} />
            <Route path="/app/campeonatos/:id/rodadas" element={<ChampionshipRounds />} />
            <Route path="/app/perfis-acesso/novo" element={<AccessProfileForm />} />
            <Route path="/app/perfis-acesso/:id/editar" element={<AccessProfileForm />} />
            <Route path="/app/usuarios/novo" element={<AdminUserForm />} />
            <Route path="/app/usuarios/:id/editar" element={<AdminUserForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
