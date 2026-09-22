import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
        <Compass className="h-5 w-5" aria-hidden="true" />
      </div>
      <h1 className="font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has moved. Let's get you back on track.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
