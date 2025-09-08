'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { adoptBill } from '@/services/legislation';

export function AdoptBillDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [billUrl, setBillUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Calls the adoptBill service and provides feedback via toasts.
  const handleAdoptBill = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to adopt bills.",
        variant: "destructive",
      });
      return;
    }

    if (!billUrl.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a bill URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await adoptBill(user.id, billUrl.trim());
      
      if (success) {
        toast({
          title: "Success!",
          description: `Bill has been adopted successfully.`,
        });
        setBillUrl('');
        setIsOpen(false);
      } else {
        toast({
          title: "Adoption Failed",
          description: "Bill URL not found or already adopted.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adopt bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAdoptBill();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Adopt Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adopt a Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billId">Bill URL</Label>
            <Input
              id="billUrl"
              placeholder="Paste the bill URL from the Hawaii Legislature website"
              value={billUrl}
              onChange={(e) => setBillUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL from the bill page (e.g., https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=HB&billnumber=1294&year=2025)
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdoptBill}
              disabled={isLoading || !billUrl.trim()}
            >
              {isLoading ? 'Adopting...' : 'Adopt Bill'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
