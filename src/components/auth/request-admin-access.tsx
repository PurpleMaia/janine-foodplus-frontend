"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function RequestAdminAccessButton({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/request-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({
          title: "Request sent!",
          description: "Your request for Lead Advocate access has been submitted. You are currently set as Intern until review.",
        });
        setRequested(true);
      } else {
        toast({
          title: "Request failed",
          description: "Could not send your request. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleRequest} disabled={isLoading || requested} variant="secondary">
      {requested ? "Request Sent" : isLoading ? "Requesting..." : "Request Lead Advocate Access"}
    </Button>
  );
}
