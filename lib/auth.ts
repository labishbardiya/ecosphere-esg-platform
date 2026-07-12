import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "employee",
        input: false,
      },
      departmentId: {
        type: "number",
        required: false,
        input: true,
      },
      xpBalance: {
        type: "number",
        defaultValue: 0,
        input: false,
      },
      pointsBalance: {
        type: "number",
        defaultValue: 0,
        input: false,
      },
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Bootstrap: the first registered user becomes the org admin.
          const { rows } = await pool.query(
            'SELECT COUNT(*)::int AS count FROM "user"',
          )
          const isFirstUser = rows[0]?.count === 0
          return {
            data: { ...user, role: isFirstUser ? "admin" : "employee" },
          }
        },
      },
    },
  },
  // v0 preview iframes need SameSite=None; Secure. That breaks http://localhost
  // because browsers reject Secure cookies over plain HTTP. Only apply iframe
  // cookie policy when running in a v0/Vercel preview runtime.
  ...(process.env.V0_RUNTIME_URL || process.env.VERCEL_URL
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "lax" as const,
            secure: false,
          },
        },
      }),
})

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  departmentId: number | null
  xpBalance: number
  pointsBalance: number
}
