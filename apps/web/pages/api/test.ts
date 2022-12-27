import { sendMessage } from "integrations/telegram/sendMessage"
import { api } from "src/blitz-server"

const handle = api(async (_, res) => {
  await sendMessage("...")()
  res.status(200).json({ sent: true })
})

export default handle
