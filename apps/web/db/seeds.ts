import db, { ClearingProvider } from "./index"

/*
 * This seed function is executed when you run `blitz db seed`.
 *
 * Probably you want to use a library like https://chancejs.com
 * to easily generate realistic data.
 */
const seed = async () => {
  console.log("start seeding....")
  console.log("TODO: Write seeds ;)")

  await db.clearingProfile.findUniqueOrThrow({ where: { provider: ClearingProvider.CREDIT_GUARD } })
}

export default seed
