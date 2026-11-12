import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "@/components/featured/layout/Layout";
import NotFound from "@/components/common/not-found/NotFound";
import LazyComponentsRegistery from "@/components/system/LazyComponentsRegistery";
import { MENU } from "@/utils/constant/routes";
import { AuthProvider } from "@/modules/auth/AuthProvider";
import { RequireRole, RequireSession, SessionGate } from "@/modules/auth/AuthGate";
const LoginPage = lazy(() => import("@/modules/auth/LoginPage"));

function App() {
  return (
    <AuthProvider>
      <SessionGate>
        <Suspense fallback={<p role="status" className="p-6">Loading page...</p>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireSession />}>
            <Route element={<Layout />}>
              {MENU.map(({ path, component }) => {
                const Page = LazyComponentsRegistery[component];
                return <Route key={path} path={path} element={<RequireRole path={path}><Page /></RequireRole>} />;
              })}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
      </SessionGate>
    </AuthProvider>
  );
}

export default App;
