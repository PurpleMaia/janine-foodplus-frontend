import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NewBillDialog } from "./new-bill-dialog";

export default function NewBillButton() {
    const [ isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    return (
        <>
        <Button onClick={() => setIsDialogOpen(true)}>
           <CirclePlus />New Bill Card 
        </Button>

        <NewBillDialog
            isOpen={isDialogOpen}
            onClose={() => {
                setIsDialogOpen(false)
            }}
        />
        </>
    )
}