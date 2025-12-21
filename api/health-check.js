export default function handler(req, res) {
    res.status(200).json({ status: 'alive', message: 'Vercel is working' });
}
