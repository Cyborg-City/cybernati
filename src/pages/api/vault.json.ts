import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { shouldShowPost } from "@/utils/markdown";

export const GET: APIRoute = async () => {
  try {
    // Get all vault items
    const vaultItems = await getCollection("vault");

    // Filter visible vault items based on environment
    const isDev = import.meta.env.DEV;
    const visibleVaultItems = vaultItems.filter((item: any) =>
      shouldShowPost(item, isDev)
    );

    // Map to command palette format
    const commandPaletteData = visibleVaultItems.map((item: any) => ({
      id: item.id,
      title: item.data.title,
      description: item.data.description,
      url: `/vault/${item.id}`,
      type: "vault" as const,
      date: item.data.date,
      tags: item.data.tags || [],
    }));

    // Sort by date (newest first)
    commandPaletteData.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return new Response(JSON.stringify(commandPaletteData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale for 24 hours
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch vault items" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
