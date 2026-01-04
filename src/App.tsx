import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FaviconSwitcher from "./components/FaviconSwitcher";
import TitleSwitcher from "./components/TitleSwitcher";
import { GlobalEventListener } from "@/components/GlobalEventListener";

import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

// Pages
import TesterDashboard from "./pages/TesterDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import TesterAuthPage from "./pages/TesterAuthPage";
import PosterAuthPage from "./pages/PosterAuthPage";
import ManagerAuthPage from "./pages/ManagerAuthPage";
import RoleAuthHub from "./pages/RoleAuthHub";
import MasterLoginPage from "./pages/MasterLoginPage"; // <--- NEW PAGE
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import TimeCard from "./pages/TimeTracking";
import UtilitiesHub from "./pages/UtilitiesHub";
import MacbookPricer from "./pages/tools/MacbookPricer";
import InStorePricer from "./pages/tools/InStorePricer";
import LabelInventoryPage from "./pages/LabelInventoryPage";
import FrontCounterPOS from "./pages/FrontCounterPOS";
import PhotoGallery from "./pages/PhotoGallery";
import TodoPage from "./pages/TodoPage";
import LandingPage from "./pages/LandingPage";

/* -------------------- session helpers -------------------- */
function getAnyToken(): string | null {
  try {
    return (
      localStorage.getItem("synergy_auth_token") ||
      sessionStorage.getItem("synergy_auth_token") ||
      null
    );
  } catch {
    return null;
  }
}

function getSessionUser(): { id: string | number; name: string; role?: string } | null {
  try {
    const raw = localStorage.getItem("synergy_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRole(): string | null {
  try {
    return localStorage.getItem("synergy_role");
  } catch {
    return null;
  }
}

/* -------------------- Guards -------------------- */

// 1. GATEKEEPER GUARD (Protects the Auth Hub)
const IS_DEV = import.meta.env.DEV; // Check if running locally

function GatekeeperGuard({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("synergy_token"); // Gatekeeper token from Google
  
  // In Dev, allow access without token. In Prod, require token.
  if (!IS_DEV && !token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// 2. ROLE GUARD (Protects Dashboards)
function RequireAuth({ requireRole }: { requireRole?: "poster" | "tester" | "manager" }) {
  const token = getAnyToken();
  const user = getSessionUser();
  const storedRole = (getRole() || user?.role || "").toLowerCase();
  const location = useLocation();

  if (!token && !user) {
    const to =
      requireRole === "tester" ? "/login/testers" :
      requireRole === "poster" ? "/login/posters" :
      requireRole === "manager" ? "/login/manager" :
      "/login/posters";
    return <Navigate to={to} replace state={{ from: location.pathname + location.search }} />;
  }

  if (requireRole) {
    if (requireRole === "manager") {
      if (storedRole !== "manager" || !token) {
        return <Navigate to="/login/manager" replace state={{ from: location.pathname + location.search }} />;
      }
    } else if (storedRole !== requireRole) {
      const to = requireRole === "tester" ? "/login/testers" : "/login/posters";
      return <Navigate to={to} replace state={{ from: location.pathname + location.search }} />;
    }
  }

  return <Outlet />;
}

/* -------------------- Layouts + Wrappers -------------------- */

const queryClient = new QueryClient();

function RootLayout() {
  return <Outlet />;
}

function TesterLoginRoute() {
  const nav = useNavigate();
  const location = useLocation() as any;
  const from = location?.state?.from || "/tester";
  return (
    <TesterAuthPage
      onAuth={(u: { id: number; name: string; token?: string }) => {
        try {
          localStorage.setItem("synergy_user", JSON.stringify({ ...u, role: "tester" }));
          localStorage.setItem("synergy_role", "tester");
          if (u.token) localStorage.setItem("synergy_auth_token", u.token);
        } catch {}
        nav(from, { replace: true });
      }}
    />
  );
}

function PosterLoginRoute() {
  const nav = useNavigate();
  const location = useLocation() as any;
  
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get("action") === "logout") {
    console.log("⚡ [App] Processing Logout Action...");
    localStorage.removeItem("synergy_user");
    localStorage.removeItem("synergy_token");
    localStorage.removeItem("synergy_tester");
    localStorage.removeItem("synergy_admin");
    localStorage.removeItem("synergy_role");
  }

  const from = location?.state?.from || "/poster";
  
  return (
    <PosterAuthPage
      onAuth={(u: { id: number; name: string; token?: string }) => {
        try {
          localStorage.setItem("synergy_user", JSON.stringify({ ...u, role: "poster" }));
          localStorage.setItem("synergy_role", "poster");
          if (u.token) localStorage.setItem("synergy_auth_token", u.token);
        } catch {}
        nav(from, { replace: true });
      }}
    />
  );
}

function ManagerLoginRoute() {
  const nav = useNavigate();
  const location = useLocation() as any;
  const from = location?.state?.from || "/manager";
  return (
    <ManagerAuthPage
      onAuth={(u: { id: number; name: string; token?: string }) => {
        try {
          localStorage.setItem("synergy_user", JSON.stringify({ ...u, role: "manager" }));
          localStorage.setItem("synergy_role", "manager");
          localStorage.setItem("synergy_auth_token", u.token || `manager-session-${u.id}`);
        } catch {}
        nav(from, { replace: true });
      }}
    />
  );
}

/* -------------------- Main Component -------------------- */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />

      <BrowserRouter>
        <FaviconSwitcher />
        <TitleSwitcher />
        <Routes>
          <Route path="/" element={<RootLayout />}>
            {/* 
               ROOT LOGIC:
               - Dev Mode: Show RoleAuthHub directly.
               - Prod Mode: Show MasterLoginPage (Google Login).
            */}
            <Route index element={IS_DEV ? <RoleAuthHub /> : <MasterLoginPage />} />

            {/* 
               PROTECTED HUB:
               - Prod: Requires Gatekeeper Token.
               - Dev: Passes through.
            */}
            <Route 
              path="hub" 
              element={
                <GatekeeperGuard>
                  <RoleAuthHub />
                </GatekeeperGuard>
              } 
            />

            {/* Role Login Pages (Protected behind Gatekeeper via navigation flow) */}
            <Route path="login" element={<Navigate to="/hub" replace />} />
            <Route path="login/testers" element={<TesterLoginRoute />} />
            <Route path="login/posters" element={<PosterLoginRoute />} />
            <Route path="login/manager" element={<ManagerLoginRoute />} />

            {/* Apps (Role Protected) */}
            <Route element={<RequireAuth requireRole="poster" />}>
              <Route path="poster" element={<Index />} />
            </Route>
            <Route element={<RequireAuth requireRole="tester" />}>
              <Route path="tester" element={<TesterDashboard />} />
            </Route>
            <Route element={<RequireAuth requireRole="manager" />}>
              <Route path="manager" element={<ManagerDashboard />} />
            </Route>

            {/* Utilities */}
            <Route path="utilities" element={<UtilitiesHub />} />
            <Route path="utilities/macbook-pricer" element={<MacbookPricer />} />
            <Route path="utilities/in-store-pricer" element={<InStorePricer />} /> 

            <Route path="labelinventory" element={<LabelInventoryPage/>} />
            <Route path="frontcounter" element={<FrontCounterPOS/>} />
            <Route path="photogallery" element={<PhotoGallery/>} />

            <Route path="timecard" element={<TimeCard/>} />
            <Route path="todopage" element={<TodoPage user={undefined}/>} />
            <Route path="landing" element={<LandingPage/>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      <Toaster />
      <GlobalEventListener />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;