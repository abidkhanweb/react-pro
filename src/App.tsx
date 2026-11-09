import { Route, Routes } from "react-router-dom";
import Layout from "@/components/featured/layout/Layout";
import NotFound from "@/components/common/not-found/NotFound";
import LazyComponentsRegistery from "@/components/system/LazyComponentsRegistery";
import { MENU } from "@/utils/constant/routes";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {MENU.map(({ path, component }) => {
          const Page = LazyComponentsRegistery[component];
          return <Route key={path} path={path} element={<Page />} />;
        })}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
