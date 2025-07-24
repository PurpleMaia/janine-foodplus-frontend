'use client'
import type { Bill, BillStatus, TempBill } from '@/types/legislation';
import { useState } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classifyStatusWithLLM } from '@/services/llm';
import { useBills } from '@/hooks/use-bills';
import { updateBillStatusServerAction } from '@/services/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';

interface Props {
    bill: Bill
}

export default function AIUpdateSingleButton({ bill } : Props) {
  const [loading, setLoading] = useState<boolean>(false); // State for dialog visibility
  const { toast } = useToast();  
  const { bills, setBills, setTempBills } = useBills()
  

  // Helper function to get column index based on status ID
  const getColumnIndex = (statusId: BillStatus): number => {
    const index = KANBAN_COLUMNS.findIndex(col => col.id === statusId);
    return index !== -1 ? index : 0; // Default to 0 if not found
  };

  // Handler to trigger LLM classification for all bills
  const handleAIUpdate = async () => {     
      // Mark bill as processing
      setBills(prevBills => 
        prevBills.map(b => 
          b.id === bill.id 
            ? { ...b, llm_processing: true }
            : b
        )
      );      

      toast({
        title: `Classifying ${bill.bill_number}`,
        description: `AI is categorizing this bill...`,
        variant: 'default',
      });

      const classification = await classifyStatusWithLLM(bill.id); 
      // await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000)); // Simulate async work

      // const classification = 'deferred1'

      if (!classification) {
        console.log('Error classifying bill status with LLM...')
        toast({
          title: `Error: ${bill.bill_number}`,
          description: `Could not classify bill status with LLM`,
          variant: 'destructive',
        });
      } else {
        // const currentColumnIdx = getColumnIndex(bill.current_status);
        const targetColumnIdx = getColumnIndex(classification);

         // Create temp bill for the original position
        const tempBill: TempBill = {
          id: bill.id,
          current_status: bill.current_status,          
          suggested_status: classification,
          target_idx: targetColumnIdx
        };      

        // Set temp bill 
        setTempBills(prevBills => 
            prevBills.map(b => 
              b.id === bill.id 
                ? tempBill
                : b
            )
          );   

        // Update the UI with LLM suggestion (optimistic)
        setBills(prevBills => 
          prevBills.map(b => 
            b.id === bill.id 
              ? { 
                  ...b, 
                  previous_status: b.current_status, // Store original status
                  current_status: classification,
                  llm_suggested: true,
                  llm_processing: false
                }
              : b
          )
        );
      }

      toast({
        title: `Done: ${bill.bill_number}`,
        description: `AI finished categorizing this bill.`,
        variant: 'default',
      });


    setLoading(false)
    toast({
      title: 'Finished AI Categorizing',
      description: 'Please reject or accept the changes',
      variant: 'default'      
    })
  };  

  return (
    <>
      <Button
        onClick={async () => {
          setLoading(true);
          await handleAIUpdate();
        }}
        disabled={loading || bill.llm_processing}
      >
        { loading || bill.llm_processing ? (
          <span className="flex items-center gap-2"><RefreshCw className='animate-spin'/>Loading</span>
        ) : (
          <span className="flex items-center gap-2"><WandSparkles />AI Update</span>
        )}
      </Button>    
    </>
  );
}

