"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const load = () => {
    const t = localStorage.getItem("kirano-token");
    fetch("/api/admin/categories", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((d) => setCats(d.categories || []));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setName("");
    setIcon("");
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon || "");
    setOpen(true);
  };

  const save = async () => {
    const t = localStorage.getItem("kirano-token");
    if (!name) return toast.error("Name required");
    if (editing) {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ name, icon }),
      });
      if (!res.ok) {
        const d = await res.json();
        return toast.error(d.error || "Failed");
      }
      toast.success("Updated");
    } else {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ name, icon }),
      });
      if (!res.ok) {
        const d = await res.json();
        return toast.error(d.error || "Failed");
      }
      toast.success("Created");
    }
    setOpen(false);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete category?")) return;
    const t = localStorage.getItem("kirano-token");
    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage menu categories
          </p>
        </div>
        <Button onClick={openNew}>New category</Button>
      </div>
      <div className="grid gap-3">
        {cats.map((c) => (
          <Card key={c.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{c.icon}</div>
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  order {c.order}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => del(c.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit category" : "New category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Icon (emoji)</label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
              </div>
              <Button className="w-full" onClick={save}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
