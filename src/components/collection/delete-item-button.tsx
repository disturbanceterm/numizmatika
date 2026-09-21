/**
 * Dugme za uklanjanje komada iz kolekcije (DELETE /api/collection/{id}) + osvježavanje strane.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteItemButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Ukloniti ovaj komad iz kolekcije? Slika se arhivira, ne briše.")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/collection/${id}`, { method: "DELETE" });
      if (!r.ok) alert(((await r.json()) as { error?: string }).error ?? "Greška pri brisanju.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={remove} disabled={busy} aria-label="Ukloni iz kolekcije">
      {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
