import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "../ui/button";
  import { Input } from "../ui/input";
  import { Label } from "../ui/label";
  import { Alert, AlertDescription } from "../ui/alert";
  import { Loader2, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
  import { useEffect, useState } from "react";
import { Bill } from "@/types/legislation";
import { findBill } from "@/services/scraper";
import { toast } from "@/hooks/use-toast";
import { findExistingBillByURL, insertNewBill, updateFoodRelatedFlagByURL } from "@/services/legislation";
import { useBills } from "@/contexts/bills-context";


interface NewBillDialogProps {
    isOpen: boolean;
    onClose: () => void;
  }
export function NewBillDialog({ isOpen, onClose }: NewBillDialogProps) {
    const { bills, setBills } = useBills()
    const [isAlreadyInDB, setIsAlreadyInDB] = useState<boolean>(false)
    const [url, setUrl] = useState<string>('')
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [billPreview, setBillPreview] = useState<Bill | null>(null)
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [foodRelatedSelection, setFoodRelatedSelection] = useState<boolean | null>(null);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setUrl('');
            setBillPreview(null);
            setError('');
            setIsAlreadyInDB(false);
            setIsLoading(false);
            setIsUpdating(false);
            setFoodRelatedSelection(null);
        }
    }, [isOpen]);    

    const handleUrlSubmit = async () => {
        if (!url.trim()) {
            setError('Please enter a bill URL')
            return
        }

        if (!url.includes('www.capitol.hawaii.gov')) {
            setError('Please enter a valid bill url (e.g. from capitol.hawaii.gov')
            return
        }

        scrapeForBill(url)
    }

    const scrapeForBill = async (url: string) => {
        setIsLoading(true);
        setError('');
        setBillPreview(null);
        setIsAlreadyInDB(false);

        // check for this url already in db
        const existing = await findExistingBillByURL(url)
        if (existing) {
            console.log('found existing bill: ', existing)
            setIsAlreadyInDB(true)
            setBillPreview(existing)
            setIsLoading(false)
            return
        } else {
            setError('Could not find bill in database, inserting now...')
        }

        const result = await findBill(url) // result is the full json

        if (!result) {
            console.log('Error scraping url')
            toast({
                title: `Error: `,
                description: `Could not scrape url for bill info`,
                variant: 'destructive',
            });
            setError('Could not scrape url for bill info')
        } else {
            setBillPreview(result)  
            setIsLoading(false)
            return
        }         
    }

    //--------- HAVE NOT TESTED FULLY -------------
    const handleCreateBill = async () => {
        if (!billPreview) return;

        setIsLoading(true);
        try {
            const result = await insertNewBill(billPreview)           
            if (result) {
                const newBills = bills.push(result)                
                console.log('made newBills', newBills)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create bill card');
        } finally {
            onClose()
            toast({
                title: `Successfully updated bill: `,
                description: `Bill ${billPreview?.bill_number} is now in our database`,
            });
            setIsLoading(false);
        }
    };

    const handleUpdateFoodRelated = async () => {
        setIsUpdating(true)
        
        const result = await updateFoodRelatedFlagByURL(url, foodRelatedSelection)

        // Update local state - remove LLM flags
        setBills(prevBills => 
            prevBills.map(b => 
              b.id === billPreview?.id 
                ? { 
                    ...b, 
                    food_related: foodRelatedSelection 
                  }
                : b
              )
            );

        if (!result) {
            console.log('Error updating bill')
        } else {
            onClose()
            toast({
                title: `Successfully updated bill: `,
                description: `${billPreview?.bill_number} is now set as ${!foodRelatedSelection ? 'not' : ''} food-related`,
            });            
            setIsUpdating(false)
        }      
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0"> {/* Larger, full height, flex-col ensures footer is at bottom */}
            {/* Header */}
            <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-lg font-semibold">Create a New Bill Card</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Paste in the URL of the bill to get started
                        </DialogDescription>
                    </div>
                     {/* The 'X' close button is part of DialogContent by default */}
                </div>
            </DialogHeader>
        
            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 p-4 overflow-auto">
                {/* URL Input Form */}
                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="bill-url">Bill URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="bill-url"
                                type="url"
                                placeholder="https://www.capitol.hawaii.gov/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                                disabled={isLoading}
                            />
                            <Button 
                                onClick={handleUrlSubmit}
                                disabled={isLoading || !url.trim()}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Find Bill'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {billPreview && (
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold">Bill Preview</h3>
                            <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                            >
                                View Original <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Bill Number</Label>
                                <p className="font-mono text-sm">{billPreview.bill_number}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                <p className="text-sm">{billPreview.current_status ? billPreview.current_status : 'Not assigned'}</p>
                            </div>                                                        
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                                <p className="text-sm font-medium">{billPreview.bill_title}</p>
                            </div>                
                            
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Committee Assignment</Label>
                                <p className="text-sm">{billPreview.committee_assignment}</p>
                            </div>                                                        
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="text-sm font-medium">{billPreview.description}</p>
                        </div>                        

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Created at</Label>
                                <p className="font-mono text-sm">{billPreview.created_at ? billPreview.created_at.toDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                                <p className="font-mono text-sm">{billPreview.updated_at ? billPreview.updated_at.toDateString() : 'N/A'}</p>
                            </div>                                                        
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Food-related?</Label>
                            <p className="font-mono text-sm">{billPreview.food_related ? 'True' : 'False'}</p>
                        </div>                                                        
                    </div>
                )}

                 {isAlreadyInDB && (
                    <Alert className="my-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>            
                            <p className="my-4">This bill exists in our overall database.</p>
                            
                            { !billPreview?.food_related && (
                                <>
                                    <p className="my-4">However, it is not flagged as a food-related bill. Click &quot;Yes&quot; if you want this bill in our Kanban Board/Spreadsheet.</p>
                                </>
                                
                            )}
                            {isAlreadyInDB && (
                                <div className="border-t pt-4 space-y-3">
                                    {/* Already in Database Message */}
                                    <Label className="text-sm font-medium">Is this bill food-related?</Label>
                                    <div className="flex gap-3">
                                        <Button
                                            variant={foodRelatedSelection === true ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setFoodRelatedSelection(true)}
                                            disabled={isUpdating}
                                        >
                                            Yes
                                        </Button>
                                        <Button
                                            variant={foodRelatedSelection === false ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setFoodRelatedSelection(false)}
                                            disabled={isUpdating}
                                        >
                                            No
                                        </Button>
                                    </div>                                            
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                
            </div>
            {/* Footer (contains the close button) - Removed sticky and bottom-0 */}
            <DialogFooter className="p-4 border-t bg-background z-10 mt-auto sm:justify-between"> {/* mt-auto pushes it down if ScrollArea doesn't fill space */}
              <div className='flex gap-2'>
                {billPreview && !isAlreadyInDB && (
                    <Button 
                        onClick={handleCreateBill}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            'Create Bill Card'
                        )}
                    </Button>
                )}
                {isAlreadyInDB && foodRelatedSelection !== null && (
                    <Button
                        onClick={handleUpdateFoodRelated}
                        disabled={isUpdating}
                        size="sm"
                        className="w-full"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Updating...
                            </>
                        ) : (
                            'Update Bill'
                        )}
                    </Button>
                )}
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    );    
}   
