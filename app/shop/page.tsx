import type { Metadata } from "next";
import { ShopCatalog } from "@/components/ShopCatalog";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return <ShopCatalog />;
}
