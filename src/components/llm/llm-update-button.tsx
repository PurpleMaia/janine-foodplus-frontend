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

      // Mark bill as processing and store bill index
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

      // const classification = await classifyStatusWithLLM(bill.id); 
      const classification = 'scheduled1'

      if (!classification) {
        console.log('Error classifying bill status with LLM...')
        toast({
          title: `Error: ${bill.bill_number}`,
          description: `Could not classify bill status with LLM`,
          variant: 'destructive',
        });
      } else {
        await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000)); // Simulate async work
              
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