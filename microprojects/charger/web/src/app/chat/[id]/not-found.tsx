import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold">Chat not found</h1>
        <p className="text-muted-foreground">
          The chat you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/">Start a new chat</Link>
        </Button>
      </div>
    </div>
  );
}
