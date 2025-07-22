'use client'
import type { Bill, BillStatus } from '@/types/legislation';
import { useState } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classifyStatusWithLLM } from '@/services/llm';
import { useBills } from '@/hooks/use-bills';
import { updateBillStatusServerAction } from '@/services/legislation';

export default function AIUpdateButton() {
  const [loading, setLoading] = useState<boolean>(false); // State for dialog visibility
  const { toast } = useToast();  
  const { bills, setBills } = useBills()

  // Handler to trigger LLM classification for all bills
  const handleAIUpdate = async () => {        
    for (const bill of bills) {
      toast({
        title: `Classifying ${bill.bill_number}`,
        description: `AI is categorizing this bill...`,
        variant: 'default',
      });
      const classification = await classifyStatusWithLLM(bill.id); 
      if (!classification) {
        console.log('Error classifying bill status with LLM...')
        toast({
          title: `Error: ${bill.bill_number}`,
          description: `Could not classify bill status with LLM`,
          variant: 'destructive',
        });
      } else {
        // await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000)); // Simulate async work
  
        // const classification = 'scheduled1'
      
        // Update the UI optimistically (same pattern as drag & drop in kanban-board)
        const newBills = Array.from(bills);
        const billIndex = newBills.findIndex(b => b.id === bill.id);
        
        if (billIndex > -1) {
          const updatedBill = { ...newBills[billIndex], current_status: classification };
          newBills.splice(billIndex, 1, updatedBill);
          setBills(newBills); // This will trigger UI updates in your kanban board
        }

        // Update the server
        await updateBillStatusServerAction(bill.id, classification)
      }


      toast({
        title: `Done: ${bill.bill_number}`,
        description: `AI finished categorizing this bill.`,
        variant: 'default',
      });
    }

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
        disabled={loading}
      >
        { loading ? (
          <span className="flex items-center gap-2"><RefreshCw className='animate-spin'/>Loading</span>
        ) : (
          <span className="flex items-center gap-2"><WandSparkles />AI Update</span>
        )}
      </Button>    
    </>
  );
}