'use client'
import type { Bill, BillStatus } from '@/types/legislation';
import { useState } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classifyStatusWithLLM } from '@/services/llm';
import { useRouter } from 'next/navigation';
import { useCardUpdate } from '@/hooks/update-cards';

interface ButtonProps {
    bills: Bill[];
}

export default function AIUpdateButton({ bills }: ButtonProps) {
  const [loading, setLoading] = useState<boolean>(false); // State for dialog visibility
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { billStatuses } = useCardUpdate()

  // Handler to trigger LLM classification for all bills
  const handleAIUpdate = async () => {
    setLoadingIds(bills.map(b => b.id));
    for (const bill of bills) {
      toast({
        title: `Classifying ${bill.bill_number}`,
        description: `AI is categorizing this bill...`,
        variant: 'default',
      });
      // await classifyStatusWithLLM(bill.id); // Assume this is async
      await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000)); // Simulate async work
      setLoadingIds(ids => ids.filter(id => id !== bill.id));
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
        disabled={loadingIds.length > 0}
      >
        { loading ? (
          <span className="flex items-center gap-2"><RefreshCw className='animate-spin'/>Loading</span>
        ) : (
          <span className="flex items-center gap-2"><WandSparkles />AI Update</span>
        )}
      </Button>
      {/* Optionally, pass loadingIds to LLMUpdateDialog to disable bill cards */}
      {/* <LLMUpdateDialog bills={bills} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} loadingIds={loadingIds} /> */}
    </>
  );
}