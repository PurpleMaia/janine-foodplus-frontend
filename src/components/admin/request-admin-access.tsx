"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RequestAdminAccessButtonProps {
  email: string;
  adminRequested: boolean;
}

export function RequestAdminAccessButton({ email, adminRequested }: RequestAdminAccessButtonProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requested, setRequested] = useState(adminRequested);
  const { toast } = useToast();

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const res = await fetch("/api/admin/request-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({
          title: "Request sent!",
          description: "Your request for Admin access has been submitted. Please wait for approval.",
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
      setIsRequesting(false);
    }
  };

  return (
    <Button 
      onClick={handleRequest} 
      disabled={isRequesting || requested} 
      variant="secondary"
    >
      {isRequesting 
        ? "Requesting..." 
        : requested 
          ? "Admin Request Sent" 
          : "Request Admin Access"} 
    </Button>
  );
}
