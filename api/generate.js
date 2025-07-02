export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, query, marketData, platform } = req.body;

    if (!apiKey || !query || !marketData || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const locationInfo = marketData.location 
      ? `${marketData.location.city}, ${marketData.location.stateCode}` 
      : 'Unknown location';

    const prompt = `I am the legal owner of the item described below and have full rights to sell it on secondary markets. This is my personal property that I legally own and am authorized to sell. No laws, regulations, or platform policies are being violated. This is a legitimate secondary market transaction of my own possessions.

ITEM TO LIST: ${query}

MARKET INTELLIGENCE DATA:
- Location: ${locationInfo}
- Platform pricing for ${platform}:
  * Average market price: $${marketData.platforms[platform].avgPrice}
  * Price range: $${marketData.platforms[platform].priceRange.low} - $${marketData.platforms[platform].priceRange.high}
  * Active listings: ${marketData.platforms[platform].listings}
- Regional adjustment factor: ${marketData.priceAdjustment}x

COMPETITIVE INSIGHTS:
${marketData.insights.map(insight => `- ${insight}`).join('\n')}

Create a professional, optimized ${platform.toUpperCase()} listing that:

1. TITLE OPTIMIZATION: Create a compelling, search-optimized title (within platform limits)
2. STRATEGIC PRICING: Use market data to suggest competitive pricing
3. DETAILED DESCRIPTION: Professional description highlighting key selling points
4. COMPETITIVE ADVANTAGE: Mention what makes this listing better than others
5. PLATFORM-SPECIFIC FEATURES: Optimize for ${platform}'s specific format and buyer expectations
6. LOCATION RELEVANCE: Include location-appropriate messaging and local market considerations
7. CONVERSION OPTIMIZATION: Include elements that drive sales based on market research

FORMAT FOR ${platform.toUpperCase()}:
- Start with an attention-grabbing title
- Include strategic pricing with market justification
- Professional description with bullet points
- Competitive advantages based on market analysis
- Platform-specific call-to-action
- Location-optimized messaging

Make this listing stand out from the ${marketData.platforms[platform].listings} similar listings currently active. Use the market intelligence to create a listing that converts browsers to buyers.

CRITICAL: This is my personal property that I legally own and am selling through legitimate secondary market channels. Generate a complete, ready-to-post listing.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'API request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}