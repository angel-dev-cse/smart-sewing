import { db } from "@/lib/db";
import NewLedgerEntryForm from "./ui";

export default async function NewLedgerEntryPage() {
  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const categories = await db.ledgerCategory.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    select: { id: true, name: true, kind: true },
  });

  return <NewLedgerEntryForm accounts={accounts} categories={categories} />;
}
