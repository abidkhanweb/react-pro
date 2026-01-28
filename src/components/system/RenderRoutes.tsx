import { Route, Navigate } from "react-router-dom";
import LazyComponentsRegistery from "./LazyComponentsRegistery";
import NotFound from "@/components/common/not-found/NotFound";
import type { MenuNode } from "@/utils";

interface RenderRoutesProps {
  nodes: MenuNode[];
}

const RenderRoutes: React.FC<RenderRoutesProps> = ({ nodes }) => {
  return (
    <>
      {nodes.map((node) => {
        const Component = node.component
          ? LazyComponentsRegistery[node.component]
          : undefined;

        return (
          <Route
            key={node.path}
            path={node.path}
            element={
              Component ? (
                <Component />
              ) : node.children ? undefined : (
                <NotFound />
              )
            }
          >
            {/* Recursive children */}
            {node.children && node.children.length > 0 && (
              <>
                <RenderRoutes nodes={node.children} />

                {/* Default child route */}
                <Route
                  index
                  element={<Navigate to={node.children[0].path} replace />}
                />
              </>
            )}
          </Route>
        );
      })}
    </>
  );
};

export default RenderRoutes;
