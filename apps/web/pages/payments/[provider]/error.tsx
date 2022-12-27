import { Locale } from "@prisma/client"
import { useRouter } from "next/router"
import { z } from "zod"

const ErrorQuery = z
  .object({
    txId: z.string().uuid(),
    uniqueID: z.string(),
    errorCode: z.string().transform(Number),
    ErrorCode: z.string().transform(Number),
    errorText: z.string(),
    ErrorText: z.string(),
    lang: z.enum(["HE", "EN"]).transform((it) => Locale[it.toLowerCase() as Locale]),
    mid: z.string(),
    cardExp: z.string().length(4),
    personalId: z.string(),
    cardToken: z.string(),
    cardMask: z.string(),
    authNumber: z.string(),
    numberOfPayments: z.string().transform(Number),
    firstPayment: z.string(),
    periodicalPayment: z.string(),
    cgUid: z.string(),
    responseMac: z.string(),
    userData2: z.string().transform(Number),
    userData1: z.string().transform(Number),
  })
  .transform(({ userData1, userData2, ...rest }) => ({
    ...rest,
    orgId: userData1,
    venueId: userData2,
  }))

export default function PaymentError() {
  const { query } = useRouter()

  return (
    <div>
      bad job my dude and man
      <pre>{JSON.stringify(query, null, 2)}</pre>
    </div>
  )
}
