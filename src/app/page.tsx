import { getAllBills } from '@/services/legislation';
import { KanbanBoardOrSpreadsheet } from './KanbanBoardOrSpreadsheet';

export default async function Home() {
  const initialBills = await getAllBills();
  console.log(initialBills);
  return <KanbanBoardOrSpreadsheet initialBills={initialBills} />;
}
