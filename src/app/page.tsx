import type { Metadata } from "next";
import HomepageClient from "@/components/HomepageClient";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/");

export default function Home() {
  return <HomepageClient />;
}
