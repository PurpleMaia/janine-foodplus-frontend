
import React from 'react';
import type { TempBill, Bill } from '@/types/legislation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Eye, Ghost } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useBills } from '@/hooks/use-bills';

interface TempBillCardProps {
    tempBill: TempBill;
    onTempCardClick: (tempBill: TempBill) => void;
    className?: string;
  }

export const TempBillCard: React.FC<TempBillCardProps> = ({ 
    tempBill, 
    onTempCardClick,
    className 
  }) => {
    const { bills } = useBills();
    
    // Get the actual bill data for display
    const actualBill = bills.find(b => b.id === tempBill.id);
    
    if (!actualBill) {
      return null; // Bill not found
    }

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onTempCardClick(tempBill)
    }
  
    return (
        <>        
            {/* Add click handler to the content div */}
            <div 
                className="flex flex-col p-3 w-full min-h-[80px] cursor-pointer "
                onClick={handleCardClick}                
                role="button"
                tabIndex={0}
            > 
                <Card className={cn(
                    "relative transition-all duration-300",
                    "border-2 border-dashed border-gray-300 bg-gray-50/80",
                    "hover:border-blue-300 hover:bg-blue-50/50",
                    "opacity-75 w-full",
                    className
                )}>
            
                    <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                        {actualBill.bill_number}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        Moved
                        </Badge>
                    </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-0">
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 text-wrap">
                        {actualBill.description}
                    </p>
                    
                    {/* Status change indicator */}
                    <div className="flex items-center gap-2 mb-3 text-xs">
                        <Badge variant="outline" className="text-xs bg-gray-100">
                        {tempBill.current_status}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        {tempBill.suggested_status}
                        </Badge>
                    </div>

                    </CardContent>
                </Card>
            </div>
        </>
    );
  };