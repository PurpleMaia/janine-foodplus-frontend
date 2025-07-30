import { CirclePlus } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { NewBillDialog } from "./new-bill-dialog";
import { useBills } from "@/hooks/use-bills";

export default function NewBillButton() {
    const { refreshBills } = useBills()
    const [ isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    return (
        <>
        <Button onClick={() => setIsDialogOpen(true)}>
           <CirclePlus />New Bill Card 
        </Button>

        <NewBillDialog
            isOpen={isDialogOpen}
            onClose={() => {
                refreshBills
                setIsDialogOpen(false)
            }}
        />
        </>
    )
}