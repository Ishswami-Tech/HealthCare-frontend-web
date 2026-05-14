import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PreviewResponse = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
};

const FALLBACK_PREVIEWS: Record<
  string,
  {
    title?: string;
    description?: string;
    siteName?: string;
    image?: string;
  }
> = {
  "www.charabibhasma.com": {
    title: "Charabi Bhasma Soup | The Trimarm Ayurved",
    description: "This is best superfast ayurved weight loss management kit",
    siteName: "charabibhasma.com",
  },
  "charabibhasma.com": {
    title: "Charabi Bhasma Soup | The Trimarm Ayurved",
    description: "This is best superfast ayurved weight loss management kit",
    siteName: "charabibhasma.com",
  },
  "play.google.com": {
    siteName: "Google Play",
  },
  "apps.apple.com": {
    siteName: "App Store",
  },
  "maps.app.goo.gl": {
    siteName: "Google Maps",
    image: "/drdeshmukh.webp",
  },
  "www.youtube.com": {
    siteName: "YouTube",
  },
  "youtube.com": {
    siteName: "YouTube",
  },
  "m.youtube.com": {
    siteName: "YouTube",
  },
  "youtu.be": {
    siteName: "YouTube",
  },
  "instagram.com": {
    siteName: "Instagram",
  },
  "www.instagram.com": {
    siteName: "Instagram",
  },
  "wa.me": {
    siteName: "WhatsApp",
  },
};

const ALLOWED_HOSTS = new Set([
  "www.charabibhasma.com",
  "charabibhasma.com",
  "play.google.com",
  "apps.apple.com",
  "maps.app.goo.gl",
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "instagram.com",
  "www.instagram.com",
  "wa.me",
]);

function getMetaContent(html: string, candidates: string[]) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    if (!content) {
      continue;
    }

    const property = tag.match(/\bproperty\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase();
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase();

    if ((property && candidates.includes(property)) || (name && candidates.includes(name))) {
      return content;
    }
  }

  return undefined;
}

function stripHtml(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

async function imageToDataUri(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 1024 * 1024) {
      return undefined;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Preview fetch failed" }, { status: 502 });
    }

    const html = await response.text();
    const finalUrl = response.url || parsedUrl.toString();
    const fallbackPreview = FALLBACK_PREVIEWS[host] || {};

    const title =
      stripHtml(
        getMetaContent(html, [
          "og:title",
          "twitter:title",
        ])
      ) ||
      stripHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]) ||
      fallbackPreview.title ||
      parsedUrl.hostname;

    const description = stripHtml(
      getMetaContent(html, [
        "og:description",
        "description",
        "twitter:description",
      ])
    ) || fallbackPreview.description;

    const imageSrc =
      getMetaContent(html, [
        "og:image:secure_url",
        "og:image:url",
        "og:image",
        "twitter:image",
        "twitter:image:src",
      ]) || undefined;

    let image: string | undefined;
    if (imageSrc) {
      const resolved = new URL(imageSrc, finalUrl).toString();
      image = await imageToDataUri(resolved) || resolved;
    }

    const payload: PreviewResponse = {
      title,
      url: finalUrl,
      siteName:
        stripHtml(
          getMetaContent(html, [
            "og:site_name",
            "application-name",
            "twitter:site",
          ])
        ) || fallbackPreview.siteName ||
        parsedUrl.hostname,
    };

    if (description) {
      payload.description = description;
    }

    if (image) {
      payload.image = image;
    } else if (fallbackPreview.image) {
      payload.image = fallbackPreview.image;
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 502 });
  }
}
