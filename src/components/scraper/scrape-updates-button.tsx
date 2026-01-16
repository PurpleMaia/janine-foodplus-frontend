'use client'
import { useState } from "react"
import { Button } from "../ui/button"
import { ListRestart, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Bill } from "@/types/legislation";
import { scrapeForUpdates } from "@/services/scraper";
import { useBills } from "@/hooks/contexts/bills-context";

interface Props {
    bill: Bill
}

// NOTE: This component does not save to the database. It only updates the UI optimistically.
// TODO: Extend this to save to the database as well.
export default function RefreshStatusesButton({ bill } : Props) {
    const [loading, setLoading] = useState<boolean>(false)
    const { setBills } = useBills()

    const handleScrapeStatuses = async () => {
        toast({
            title: `Checking ${bill.bill_number}`,
            description: `Scraping this bill for status updates...`,
            variant: 'default',
          });

        const result = await scrapeForUpdates(bill.id) // result is the full json

        if (!result) {
            console.log('Error scraping individual bill')
            toast({
                title: `Error: ${bill.bill_number}`,
                description: `Could not scrape individual bill for status updates`,
                variant: 'destructive',
            });
        } else {
            // Update the UI with LLM suggestion (optimistic)
            setBills(prevBills => 
                prevBills.map(b => 
                b.id === bill.id 
                    ? { 
                        ...b, 
                        updates: result.individualBill.updates
                    }
                    : b
                )
            );

            toast({
                title: `Done: ${bill.bill_number}`,
                description: `Successfully updated this bill.`,
                variant: 'default',
              });
            setLoading(false)
        }
    }
    return (
        <>
            <Button
                onClick={async () => {
                    setLoading(true);
                    await handleScrapeStatuses();
                }}
                disabled={loading}
              >
                { loading ? (
                    <span className="flex items-center gap-2"><RefreshCw className='animate-spin'/>Loading</span>
                ) : (
                    <span className="flex items-center gap-2"><ListRestart />Refresh Status Updates</span>
                )}
            </Button>
        </>
    )
}