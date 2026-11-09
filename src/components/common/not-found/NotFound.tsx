import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
const NotFound = () => {
  return (
    <PageLayout title="Page not found">
      <p className="text-muted-foreground">This address does not match an admin page.</p>
      <div><Button asChild><Link to="/">Return to dashboard</Link></Button></div>
    </PageLayout>
  );
};

export default NotFound
