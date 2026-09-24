import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Clean CSV & Excel Data Online",
  description: "Scan CSV and Excel files for duplicates, blanks, whitespace, inconsistent headers, mixed dates and text-case issues, then download a cleaned copy.",
  path: "/clean",
  keywords: ["clean CSV online", "clean Excel data", "data cleaning tool", "remove duplicate rows", "data quality checker"],
});

export default function CleanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
