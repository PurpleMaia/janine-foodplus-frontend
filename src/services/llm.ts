'use server'
import { OpenAI } from 'openai';

let sql: any = null;
if (typeof window === 'undefined') {
  // Server-side only
  const postgres = require('postgres');
  sql = postgres(process.env.DATABASE_URL!);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
});

const SYSTEM_PROMPT = `You are a legislative-status classifier with advanced reasoning capabilities. Your task is:

- Determine the current phase of the bill (House, Senate/crossover, Conference, or Governor) by reviewing the entire provided context chronologically.

- Prune the full set of labels to only those relevant to the identified phase.

- Select exactly one label from that subset by matching the current status line against the detailed descriptions below.

Output Requirement:

- Do NOT reveal your reasoning or chain-of-thought.

- Output exactly and only the chosen label—nothing else.

Label Descriptions:

House Zone Labels:

Introduced/Waiting to be Scheduled for First Committee Hearing: The bill has been formally introduced in the House and no first committee hearing has yet been scheduled.

Scheduled for First Committee Hearing: A date, time, or notice for the bill’s first committee hearing in the House has been set.

Deferred after First Committee Hearing: The first committee hearing occurred but the committee did not report the bill; it has been deferred or continued.

Waiting to be Scheduled for Second Committee Hearing: The bill passed (or was reported out of) its first committee and is awaiting scheduling of its second committee hearing.

Scheduled for Second Committee Hearing: A date, time, or notice for the second committee hearing in the House has been set.

Deferred after Second Committee Hearing: The second committee hearing took place but the bill was not advanced; it has been deferred.

Waiting to be Scheduled for Third Committee Hearing: The bill passed its second committee and is awaiting its third committee hearing in the House.

Scheduled for Third Committee Hearing: A date, time, or notice for the third committee hearing in the House has been set.

Deferred after Third Committee Hearing: The third committee hearing occurred but the bill did not move forward; it has been deferred.

Senate/Crossover Zone Labels:

Crossover/Waiting to be Scheduled for First Committee Hearing: The bill was transmitted from the House to the Senate (crossover) and no first Senate committee hearing is yet scheduled.

Scheduled for First Committee Hearing after Crossover: A date, time, or notice has been set for the bill’s first committee hearing in the Senate.

Deferred after First Committee Hearing after Crossover: The first Senate committee hearing occurred but the bill was deferred.

Waiting to be Scheduled for Second Committee Hearing after Crossover: The bill passed its first Senate committee and is awaiting its second Senate committee hearing schedule.

Scheduled for Second Committee Hearing after Crossover: A date, time, or notice for the second Senate committee hearing has been set.

Deferred after Second Committee Hearing after Crossover: The second Senate committee hearing occurred but the bill was deferred.

Waiting to be Scheduled for Third Committee Hearing after Crossover: The bill passed its second Senate committee and is awaiting its third Senate committee hearing schedule.

Scheduled for Third Committee Hearing after Crossover: A date, time, or notice for the third Senate committee hearing has been set.

Deferred after Third Committee Hearing after Crossover: The third Senate committee hearing occurred but the bill was deferred.

Common Committee Completion Label:

Passed all Committees!: The bill has passed the final (third) reading or stage in both chambers’ committees.

Conference Zone Labels:

Assigned Conference Committees: A disagreement was noted and conferees (from both chambers) were appointed.

Scheduled for Conference Hearing: A date, time, or notice has been set for the conference committee to meet.

Deferred during Conference Committee: The conference committee convened but deferred the bill without agreement.

Passed Conference Committee: The conference committee met and agreed on an amended version of the bill.

Governor Zone Labels:

Transmitted to Governor: The enrolled measure has been sent to the Governor’s desk.

Governor's intent to Veto List: The Governor has indicated an intent to veto the bill.

Governor Signs Bill Into Law: The Governor has signed the enrolled bill, making it law.

Became law without Gov signature: The bill became law by constitutional default without the Governor’s signature.
`.trim();

async function getContext(billId: string) {
    console.log('getting context...')
    try {
        const data = await sql`
            select chamber, date, statustext from status_updates su 
            where su.bill_id = ${billId}
            limit 5
        `;       
        console.log('# of status updates', data.length) 
        // Format as tab-separated string, one row per line
        return data.map((row: any) => `${row.chamber}\t${row.date}\t${row.statustext}`).join('\n');
    } catch (error){
        console.log('Error fetching bill\'s status context:', error)
        return null
    }
}
export async function classifyStatusWithLLM(billId: string, maxRetries = 3, retryDelay = 1000) {    
    const context = await getContext(billId);
    const currStatus = context.split(/\r?\n/)[0];
    let attempt = 0;
    console.log('CONTEXT:\n', context)
    console.log('awaiting llm...', process.env.MODEL)
    while (attempt < maxRetries) {
        try {
            const response = await client.chat.completions.create({
                model: "vllm-Qwen3-30B-A3B-AWQ-128k",
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            "Here is the bill's status log so far (oldest first):",
                            context,  
                            "",                                                      
                            "Which label applies to the first line (the current status) Only respond with that column name and with exactly one label."
                        ].join("\n")
                    }
                ],
                temperature: 0.0
            }, {
                timeout: 60000
            });
            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
                return null;
            }
            const classification = response.choices[0].message.content.trim();
            console.log("Current Status:", currStatus);
            console.log("Classification:", classification);
            console.log("--------------------------------")
            return classification;
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