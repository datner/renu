import type { NextApiHandler } from "next"

const handler: NextApiHandler = (_, res) => res.status(201).json({ healthy: true })
export default handler
