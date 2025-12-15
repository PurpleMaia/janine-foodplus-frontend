'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Settings, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { InternWithBills } from "@/types/admin";
import { useAdminDashboard } from "@/hooks/use-query-admin";

interface ManageInternDialogProps {
  intern: InternWithBills;
}

export function ManageInternDialog({ intern }: ManageInternDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  

  const {
    manageIntern
  } = useAdminDashboard();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Intern</DialogTitle>
          <DialogDescription>
            {intern.username} ({intern.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adopted Bills Section */}
          <div>
            <h4 className="font-medium mb-2">Adopted Bills</h4>
            {intern.adopted_bills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No adopted bills</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {intern.adopted_bills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="text-sm">
                      <Badge variant="outline" className="mr-2">
                        {bill.bill_number || 'N/A'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {bill.bill_title || 'No Title'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Account Actions</h4>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isLoading}>
                    {intern.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {intern.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'} Intern?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {intern.account_status === 'suspended'
                        ? 'This will restore access for this intern.'
                        : 'This will temporarily revoke access for this intern.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction >
                      {intern.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Intern?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the intern
                      account and remove all their data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}