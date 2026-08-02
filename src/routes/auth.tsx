import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChefHat, ShieldCheck, UserRound } from "lucide-react";
import logo from "@/assets/lekker-logo.jpg";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const n = typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined;
    return n ? { next: n } : {};
  },
  head: () => ({ meta: [{ title: "LEKKER · Connexion / Inscription" }] }),
});

async function redirectByRole(nav: ReturnType<typeof useNavigate>, userId: string, email?: string | null) {
  if (email === "lekker.viya@gmail.com") return nav({ to: "/admin" });
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map(r => r.role);
  if (roles.includes("admin")) return nav({ to: "/admin" });
  if (roles.includes("kitchen")) return nav({ to: "/kitchen" });
  if (roles.includes("cashier")) return nav({ to: "/cashier" });
  if (roles.includes("waiter")) return nav({ to: "/waiter" });
  return nav({ to: "/admin" });
}

function AuthPage() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"waiter" | "kitchen" | "cashier">("waiter");

  const afterAuth = (userId: string, userEmail?: string | null) => {
    if (next) {
      window.location.href = next;
      return;
    }
    redirectByRole(nav, userId, userEmail);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) afterAuth(data.session.user.id, data.session.user.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, next]);

  const signIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté");
    if (data.session) afterAuth(data.session.user.id, data.session.user.email);
  };

  const signUp = async () => {
    if (!email || !password) return toast.error("Email et mot de passe requis");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name, signup_role: role },
        emailRedirectTo: window.location.origin + "/auth" + (next ? `?next=${encodeURIComponent(next)}` : ""),
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé. Vérifiez votre email puis connectez-vous.");
  };

  const signInGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth" + (next ? `?next=${encodeURIComponent(next)}` : ""),
    });
    if (result.error) return toast.error(result.error.message ?? "Erreur Google");
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) afterAuth(data.session.user.id, data.session.user.email);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <img src={logo} alt="LEKKER" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-lg" />
          <h1 className="font-serif text-3xl font-bold tracking-widest">LEKKER</h1>
          <p className="mt-1 text-sm text-muted-foreground">Espace Personnel · Staff Portal</p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Créer un compte</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-3 pt-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button className="w-full" disabled={loading} onClick={signIn} size="lg">
              Se connecter
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Vous serez redirigé vers votre dashboard selon votre rôle.
            </p>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 pt-4">
            <div>
              <Label>Nom complet</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Yassine Amrani" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Je suis…</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "waiter", label: "Serveur", icon: UserRound },
                  { v: "kitchen", label: "Cuisine", icon: ChefHat },
                  { v: "cashier", label: "Caissier", icon: ShieldCheck },
                ].map(o => {
                  const Icon = o.icon;
                  const active = role === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setRole(o.v as typeof role)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                    >
                      <Icon className="h-5 w-5" />
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Le rôle <strong>Admin</strong> est attribué uniquement par un administrateur existant.
              </p>
            </div>
            <Button className="w-full" disabled={loading} onClick={signUp} size="lg">
              Créer mon compte
            </Button>
          </TabsContent>
        </Tabs>

        <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={signInGoogle}>
          Continuer avec Google
        </Button>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Retour au site</Link>
        </div>
      </div>
    </div>
  );
}
