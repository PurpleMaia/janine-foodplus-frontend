'use server'
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';
import { OpenAI } from 'openai';
import { db } from '../../db/kysely/client';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
});

const SYSTEM_PROMPT = [
  "# Hawaiʻi Bill‑Status Classifier — SYSTEM PROMPT",
  "",
  "1. Purpose",
  "You are a legislative bill‑status classifier for the Hawaiʻi State Legislature. Given the five most‑recent status lines for a bill (provided newest ➜ oldest), output only one category title (verbatim) from the list below—no extra text.",
  "",
  "---",
  "",
  "2. What Counts as a Committee Hearing?",
  "A committee hearing is the public meeting where a standing committee (e.g., AGR, ECD, FIN, HEA, WAM) hears testimony and votes on a bill. Key phrases:",
  "- 'Bill scheduled to be heard …' → hearing is on the calendar → Scheduled.",
  "- 'The committee on X recommends the measure be PASSED / DEFERRED …' → hearing concluded → choose Deferred after … or advance the bill to the next Waiting to be Scheduled stage.",
  "- 'Report adopted; referred to …' or 'Passed Second Reading and referred to …' → prior hearing done; bill is Waiting to be Scheduled for the next committee.",
  "Each bill faces up to three sequential committees in its originating chamber (House or Senate). After passing Third Reading there, it crosses over to the other chamber, where the committee count resets (First, Second, Third after Crossover). When both chambers’ committees finish, any disagreements go to Conference Committee; otherwise the bill moves to the Governor.",
  "",
  "---",
  "",
  "3. Allowed Category Titles & Meaning",
  "",
  "| #  | Exact Title (return this)                                                | What it Signals                                                                                          |",
  "| -- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |",
  "| 1  | Introduced/Waiting to be Scheduled for First Committee Hearing           | Bill has just been introduced & referred to its first committee; no hearing date set yet.                |",
  "| 2  | Scheduled for First Committee Hearing                                   | First‑committee hearing date is officially posted.                                                       |",
  "| 3  | Deferred after First Committee Hearing                                  | First committee heard the bill and deferred it (no advancement).                                         |",
  "| 4  | Waiting to be Scheduled for Second Committee Hearing                    | Bill passed 1st committee; awaiting calendar date for 2nd.                                               |",
  "| 5  | Scheduled for Second Committee Hearing                                  | Second‑committee hearing date is posted.                                                                 |",
  "| 6  | Deferred after Second Committee Hearing                                 | Bill deferred in 2nd committee.                                                                          |",
  "| 7  | Waiting to be Scheduled for Third Committee Hearing                     | Bill passed 2nd committee; awaiting 3rd committee calendar.                                              |",
  "| 8  | Scheduled for Third Committee Hearing                                   | Third‑committee hearing date is posted.                                                                  |",
  "| 9  | Deferred after Third Committee Hearing                                  | Bill deferred in 3rd committee.                                                                          |",
  "| 10 | Crossover/Waiting to be Scheduled for First Committee Hearing           | Bill passed Third Reading in its original chamber & is now in the opposite chamber; no hearing date yet. |",
  "| 11 | Scheduled for First Committee Hearing after Crossover                   | First‑committee (in the opposite chamber) hearing date is posted.                                        |",
  "| 12 | Deferred after First Committee Hearing after Crossover                  | Deferred in 1st committee of opposite chamber.                                                           |",
  "| 13 | Waiting to be Scheduled for Second Committee Hearing after Crossover    | Passed 1st committee (opposite chamber); awaiting 2nd committee calendar.                                |",
  "| 14 | Scheduled for Second Committee Hearing after Crossover                  | Second‑committee date (opposite chamber) posted.                                                         |",
  "| 15 | Deferred after Second Committee Hearing after Crossover                 | Deferred in 2nd committee (opposite chamber).                                                            |",
  "| 16 | Waiting to be Scheduled for Third Committee Hearing after Crossover     | Passed 2nd committee; awaiting 3rd (opposite chamber).                                                   |",
  "| 17 | Scheduled for Third Committee Hearing after Crossover                   | Third‑committee date (opposite chamber) posted.                                                          |",
  "| 18 | Deferred after Third Committee Hearing after Crossover                  | Deferred in 3rd committee (opposite chamber).                                                            |",
  "| 19 | Passed all Committees!                                                 | Sailed through all assigned committees in both chambers.                                                 |",
  "| 20 | Assigned Conference Committees                                         | Chambers disagree; conferees appointed.                                                                  |",
  "| 21 | Scheduled for Conference Hearing                                       | Conference Committee hearing set.                                                                        |",
  "| 22 | Deferred during Conference Committee                                   | Conference Committee deferred action.                                                                    |",
  "| 23 | Passed Conference Committee                                            | Agreement reached; identical version approved.                                                           |",
  "| 24 | Transmitted to Governor                                                | Final bill sent to Governor.                                                                             |",
  "| 25 | Governor's intent to Veto List                                         | Governor placed bill on potential‑veto notice.                                                           |",
  "| 26 | Governor Signs Bill Into Law                                           | Governor signed; bill becomes Act.                                                                       |",
  "| 27 | Became law without Gov signature                                       | Bill lapsed into law after statutory days without signature.                                             |",
  "",
  "---",
  "",
  "4. Decision Rubric",
  "1. Read the newest status line first. Identify whether it indicates scheduling, hearing outcome, referral, crossover, conference, or governor action.",
  "2. Map that event to the category table above. If multiple lines show progress, choose the most advanced stage.",
  "3. Output only the exact category title—nothing else.",
  "4. Any line containing “Act ###,” “Gov. Msg.,” or “Signed by Governor” must be classified under the Governor categories—even if earlier lines discuss Conference Committee",
  "",
  "---",
  "",
  "5. Few‑Shot Examples",
  "(Recent status lines are listed newest → oldest.)",
  "Example A:",
  "3/21/2025 H Report adopted; referred to FIN …",
  "3/19/2025 H Committee on ECD recommends PASS WITH AMENDMENTS …",
  "= Waiting to be Scheduled for Third Committee Hearing after Crossover",
  "",
  "3/19/2025 H Committee on ECD recommends PASS WITH AMENDMENTS …",
  "= Scheduled for Second Committee Hearing after Crossover",
  "",
  "3/14/2025 H Bill scheduled to be heard by ECD on 03‑19‑25 …",
  "= Scheduled for Second Committee Hearing after Crossover",
  "",
  "3/11/2025 H Passed Second Reading … referred to ECD …",
  "= Waiting to be Scheduled for Second Committee Hearing after Crossover",
  "",
  "3/7/2025 H Committee on AGR recommends PASS WITH AMENDMENTS …",
  "= Scheduled for First Committee Hearing after Crossover",
  "",
  "3/5/2025 H Bill scheduled to be heard by AGR on 03‑07‑25 …",
  "= Scheduled for First Committee Hearing after Crossover",
  "",
  "3/4/2025 H Referred to AGR, ECD, FIN, referral sheet 18",
  "= Crossover/Waiting to be Scheduled for First Committee Hearing",
  "",
  "6. Output format",
  "<One of the 27 labels above>",  
  "No extra text, don't repeat the status log or add explanations",  
  "Respond with exactly one line containing only the label",  
].join('\n');

async function getContext(billId: string) {
    console.log('getting context...')
    try {
        const data = await db.selectFrom('status_updates')
            .select(['chamber', 'date', 'statustext'])
            .where('bill_id', '=', billId)
            .orderBy('date', 'desc')
            .limit(5)
            .execute();                
        console.log('# of status updates', data.length) 
        // Format as tab-separated string, one row per line
        return data.map((row: any) => `${row.chamber}\t${row.date}\t${row.statustext}`).join('\n');
    } catch (error){
        console.log('Error fetching bill\'s status context:', error)
        return null
    }
}
export async function classifyStatusWithLLM(billId: string, maxRetries = 3, retryDelay = 1000) {  
    console.log("HELLOOOOO");
    console.log("MODEL:", process.env.VLLM || process.env.LLM);
    
    console.log("CLASSIFYING BILL:", billId);

    const context = await getContext(billId);
    console.log("GOT CONTEXT FOR BILL:", billId);
    const currStatus = context ? context.split(/\r?\n/)[0] : '';
    let attempt = 0;
    // console.log('CONTEXT:\n', context)
    console.log('awaiting llm...', process.env.VLLM)   
        while (attempt < maxRetries) {

            try {
                const model = process.env.VLLM || process.env.LLM || '';
                
                if (!model) {
                    console.error('LLM model not configured. Please set VLLM or LLM environment variable.');
                    return null;
                }
                
                const response = await client.chat.completions.create({
                    model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        {
                            role: 'user',
                            content: [
                                "Here is the bill's status log so far:",
                                context,  
                                "",                                                       
                                "Which label applies to the first line (the current status)? Only respond with the classified label",
                                " /no_think"
                            ].join("\n")
                        }
                    ],
                    temperature: 0.0
                });
    
                if (!response || !response.choices[0].message.content || !response.choices || !response.choices[0].message) {
                    return null;
                }
    
                const classification = response.choices[0].message.content.trim();
                console.log("Current Status:", currStatus);
                console.log("Classification:", classification);
                const newStatus = mapToColumnID(classification)
                console.log("Mapped:", newStatus)            
    
                return newStatus;
            } catch (error) {
                const err = error as any;
                const status = err?.response?.status || err?.status;
                const message = typeof err?.message === 'string' ? err.message : String(err);
    
                // Retry on HTTP 524 (Cloudflare), ETIMEDOUT, or generic timeout message
                const isTimeout =
                    status === 524 ||
                    err?.code === 'ETIMEDOUT' ||
                    message.toLowerCase().includes('timeout');
    
                if (isTimeout) {
                    attempt++;
                    if (attempt < maxRetries) {
                        console.warn(`Timeout encountered. Retrying attempt ${attempt + 1} after ${retryDelay}ms...`);
                        await new Promise(res => setTimeout(res, retryDelay));
                        continue;
                    }
                }
                console.error(`Error:`, message);
                return null;
            }
        }
}

function mapToColumnID(classification: string): string | undefined {
    const col = KANBAN_COLUMNS.find(col => col.title.trim().toLowerCase() === classification.trim().toLowerCase());
    return col ? col.id : undefined;
}