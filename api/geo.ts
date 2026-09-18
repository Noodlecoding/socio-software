export const config = { runtime: 'edge' };

export default function handler(req: Request): Response {
  const country = req.headers.get('x-vercel-ip-country') ?? '';
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
}
