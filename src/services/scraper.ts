'use server'
// NOTE: due to the archive of 2025, bill URLS have changed
// - when going to that link it appends the 'Archives' segment and redirects, so we need to handle both cases
// - at this moment, scraping this will return NO UPDATES, luckily we don't save the updates!
// https://www.capitol.hawaii.gov/session/archives/measure_indiv_Archives.aspx?billtype=SB&billnumber=1186&year=2025
const api_url = `http://foodplus-dev.sandbox.purplemaia.org/api/scrape-individual`
// const api_url = `http://localhost:3000/api/scrape-individual`

export async function scrapeForUpdates(billID: string) {
    console.log('calling scraping service...')
    console.log('calling api:', api_url)
    const response = await fetch(api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({classifier: billID})        
      });
  
      if (!response.ok) {
        throw new Error(`Scraping API returned ${response.status}: ${response.statusText}`);
      }
  
    const data = await response.json();

    console.log('result: ', data)
    // test
    return data
}

export async function findBill(billURL: string) {
  console.log('calling scraping service...')
    console.log('calling api:', api_url)
    const response = await fetch(api_url, {
        method: 'POST',        
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({classifier: billURL})    
      });
  
      if (!response.ok) {
        throw new Error(`Scraping API returned ${response.status}: ${response.statusText}`);
      }
  
    const data = await response.json();

    console.log('result: ', data)

    return data
}