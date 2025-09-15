import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    // Ganti URL di bawah sesuai endpoint backend Anda yang melakukan clear Redis
    const backendUrl = process.env.REDIS_CLEAR_URL || 'http://localhost:8000/clear-redis'
    const body = req.body ? req.body : undefined
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const text = await response.text()
      return res.status(500).json({ message: 'Failed to clear Redis', detail: text })
    }
    return res.status(200).json({ message: 'Redis cache cleared' })
  } catch (error: any) {
    return res.status(500).json({ message: 'Error clearing Redis', error: error?.message })
  }
}
