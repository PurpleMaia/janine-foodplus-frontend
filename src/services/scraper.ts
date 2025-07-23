'use server'

export async function scrapeForUpdates(billId: string) {
    console.log('calling scraping service...')
    const billID = '33418b4d-6586-4093-9bf7-46c1c7ddf4ba'
    const api_url = `http://foodplus-dev.sandbox.purplemaia.org/api/scrape-individual?billID=${billID}`
    console.log('calling api:', api_url)
    const response = await fetch(api_url, {
        method: 'GET',        
      });
  
      if (!response.ok) {
        throw new Error(`Scraping API returned ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();

    console.log(data)
}