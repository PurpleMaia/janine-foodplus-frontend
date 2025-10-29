"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RequestSupervisorAccessButtonProps {
  userId: string;
  supervisorRequested: boolean;
  setRequested: (requested: boolean) => void;
}

export function RequestSupervisorAccessButton({ userId, supervisorRequested, setRequested }: RequestSupervisorAccessButtonProps) {
  const [isRequesting, setIsRequesting] = useState(false); 
  const { toast } = useToast();

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const res = await fetch("/api/supervisor/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast({
          title: "Request sent!",
          description: "Your request for Supervisor access has been submitted. Please wait for approval.",
        });
        setRequested(true);
      } else {
        const errorData = await res.json();
        toast({
          title: "Request failed",
          description: errorData.error || "Could not send your request. Please try again later.",
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
      disabled={isRequesting || supervisorRequested} 
      variant="secondary"
      className="mt-2"
    >
      {isRequesting 
        ? "Requesting..." 
        : supervisorRequested 
          ? "Supervisor Request Sent" 
          : "Request Supervisor Access"} 
    </Button>
  );
}

