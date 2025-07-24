'use server'

export async function scrapeForUpdates(billID: string) {
    console.log('calling scraping service...')
    const api_url = `http://foodplus-dev.sandbox.purplemaia.org/api/scrape-individual?billID=${billID}`
    console.log('calling api:', api_url)
    const response = await fetch(api_url, {
        method: 'GET',        
      });
  
      if (!response.ok) {
        throw new Error(`Scraping API returned ${response.status}: ${response.statusText}`);
      }
  
    const data = await response.json();

    console.log('result: ', data)

    return data
}