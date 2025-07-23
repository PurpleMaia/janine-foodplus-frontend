import { NextApiRequest, NextApiResponse } from 'next';

export async function POST(request: Request) {
  try {
    const { url, options = {} } = await request.json();

    if (!url) {
      return Response.json({ message: 'URL is required' }, { status: 400 });
    }

    // Make API call to external scraping service
    const billID = '33418b4d-6586-4093-9bf7-46c1c7ddf4ba'
    const response = await fetch(`http://foodplus-dev.sandbox.purplemaia.org//api/scrape-individual?billID=${billID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCRAPING_API_KEY}`,
        'User-Agent': 'NextJS-Scraper/1.0',
      },
      body: JSON.stringify({
        url: url,
        format: 'json',
        wait: 2000, // Wait 2 seconds for JS to load
        ...options
      }),
    });

    if (!response.ok) {
      throw new Error(`Scraping API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return Response.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return Response.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}