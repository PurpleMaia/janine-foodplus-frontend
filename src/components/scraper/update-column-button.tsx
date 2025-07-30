'use client'
import { useState } from "react"
import { Button } from "../ui/button"
import { ListRestart, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Bill } from "@/types/legislation";
import { scrapeForUpdates } from "@/services/scraper";
import { useBills } from "@/hooks/use-bills";

interface Props {
    bills: Bill[]
    onRefreshStart?: () => void
    onRefreshEnd?: () => void
}

export default function RefreshColumnButton({ bills, onRefreshStart, onRefreshEnd  } : Props) {
    const [loading, setLoading] = useState<boolean>(false)
    const { setBills } = useBills()

    const handleScrapeBillsStatuses = async () => {
        for (const bill of bills) {
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
            }
        }
    }
    return (
        <>
            <Button
                onClick={async () => {
                    setLoading(true);
                    onRefreshStart?.()

                    await handleScrapeBillsStatuses();

                    onRefreshEnd?.()
                    setLoading(false)
                }}
                variant='ghost'
                disabled={loading}
              >
                { loading ? (
                    <span className="flex items-center gap-2"><RefreshCw className='animate-spin'/></span>
                ) : (
                    <span className="flex items-center gap-2"><ListRestart /></span>
                )}
            </Button>
        </>
    )
}