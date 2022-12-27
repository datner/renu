import { hash256 } from "@blitzjs/auth"
import { Ctx } from "blitz"
import forgotPassword from "./forgotPassword"
import db from "db"
import previewEmail from "preview-email"
import { beforeEach, describe, vi, it, expect } from "vitest"

beforeEach(async () => {
  await db.$reset()
})

vi.mock("@blitzjs/auth", async () => {
  const blitzjsAuth = await vi.importActual<object>("@blitzjs/auth")
  return { ...blitzjsAuth, generateToken: vi.fn().mockReturnValue("test-token") }
})
vi.mock("preview-email")

describe.skip("forgotPassword mutation", () => {
  it("does not throw error if user doesn't exist", async () => {
    await expect(forgotPassword({ email: "no-user@email.com" }, {} as Ctx)).resolves.not.toThrow()
  })

  it("works correctly", async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: "user@example.com",
        restaurant: {
          create: {
            logo: "",
            slug: "example",
          },
        },
        tokens: {
          // Create old token to ensure it's deleted
          create: {
            type: "RESET_PASSWORD",
            hashedToken: "token",
            expiresAt: new Date(),
            sentTo: "user@example.com",
          },
        },
      },
      include: { tokens: true },
    })

    // Invoke the mutation
    await forgotPassword({ email: user.email }, {} as Ctx)

    const tokens = await db.token.findMany({ where: { userId: user.id } })
    const token = tokens[0]
    if (!user.tokens[0]) throw new Error("Missing user token")
    if (!token) throw new Error("Missing token")

    // delete's existing tokens
    expect(tokens.length).toBe(1)

    expect(token.id).not.toBe(user.tokens[0].id)
    expect(token.type).toBe("RESET_PASSWORD")
    expect(token.sentTo).toBe(user.email)
    expect(token.hashedToken).toBe(hash256("test-token"))
    expect(token.expiresAt > new Date()).toBe(true)
    expect(previewEmail).toBeCalled()
  })
})
