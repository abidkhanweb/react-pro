import { Routes, Route } from "react-router-dom"
import { useTheme } from "next-themes"
import LazyComponentsRegistery from "@/components/system/LazyComponentsRegistery";
import Layout from "@/components/featured/layout/Layout";
import NotFound from "@/components/common/not-found/NotFound";
import { MENU } from '@/utils/index'
import { useEffect } from "react";

function App() {
  const { theme, setTheme } = useTheme()

  useEffect(()=>{
    console.log(theme)
    setTheme("light")
  },[])
  return (
    <>
      <Routes>
        {MENU.map((main) => (
          <Route key={main.path} path={main.path} element={<Layout />}>
            {main.children?.map((sub) => {
              const Component = LazyComponentsRegistery[sub?.component];

              return (
                <Route
                  key={sub?.path}
                  path={sub?.path}
                  element={Component ? <Component /> : <NotFound />}
                />
              );
            })}
          </Route>
        ))}
      </Routes>

      {/* <button
        className="btn border p-[10px] m-[10px] text-[30px]"
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        className="btn border p-[10px] m-[10px] text-[30px]"
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
      <button
        className="btn border p-[10px] m-[10px] text-[30px]"
        onClick={() => setTheme("system")}
      >
        System
      </button> */}
      <div>
        {/* <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
      </div>
    </>
  );
}

export default App
