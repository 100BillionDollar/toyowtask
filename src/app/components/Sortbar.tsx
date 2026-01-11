"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortKey = "price" | "rating" | "popularity"

export function SortBar({ onChange }: { onChange: (v: SortKey) => void }) {
  return (
    <Select onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="price">Price</SelectItem>
        <SelectItem value="rating">Rating</SelectItem>
        <SelectItem value="popularity">Popularity</SelectItem>
      </SelectContent>
    </Select>
  )
}
