"use server"

import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function getDepartments() {
  return db.select().from(departments).orderBy(asc(departments.name))
}
