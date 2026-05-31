import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog-data";

export const siteConfig = {
  name: "LarperWallet",
  url: "https://larperwallet.com",
  description:
    "LarperWallet is the #1 crypto wallet simulator and fake crypto wallet app. A pixel-perfect Phantom wallet simulator for content creators, product demos, and crypto roleplay. Set any balance, simulate P2P transactions, and create indistinguishable wallet screenshots instantly.",
  ogImage: "/opengraph-image.png",
  xHandle: "@LarperWallet",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function buildTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export function buildDefaultMetadata(): Metadata {
  const ogImageUrl = absoluteUrl(siteConfig.ogImage);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: "LarperWallet — #1 Crypto Wallet Simulator | Fake Phantom, Trust & Ledger Wallet App",
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [
      "crypto wallet simulator",
      "fake crypto wallet",
      "fake crypto wallet app",
      "phantom wallet simulator",
      "trust wallet simulator",
      "ledger wallet simulator",
      "larp wallet",
      "larp crypto",
      "crypto larp",
      "fake phantom wallet",
      "fake phantom app",
      "crypto wallet simulator app",
      "fake wallet app",
      "fake bitcoin wallet",
      "wallet mockup app",
      "crypto roleplay wallet",
      "fake crypto balance",
      "portfolio screenshot app",
      "crypto demo wallet",
      "wallet simulator app",
      "crypto screenshot tool",
      "hardware wallet simulator",
      "simulated crypto wallet",
      "wallet roleplay app",
      "LarperWallet",
    ],
    authors: [{ name: "LarperWallet Team" }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "technology",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: buildTitle("Show Off Millions in Crypto Instantly"),
      description: siteConfig.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: buildTitle("Show Off Millions in Crypto Instantly"),
      description: siteConfig.description,
      creator: siteConfig.xHandle,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/logos/icon_512x512_nonglass.png",
    },
    alternates: {
      canonical: siteConfig.url,
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteConfig.name,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export function buildWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: ["FinanceApplication", "EntertainmentApplication"],
    operatingSystem: "iOS, Android, Windows, macOS",
    browserRequirements: "Requires a modern web browser with PWA support",
    softwareVersion: "2.0",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "19.00",
      highPrice: "69.00",
      priceCurrency: "USD",
      offerCount: "3",
    },
    author: {
      "@type": "Organization",
      name: "LarperWallet Team",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Pixel-perfect Phantom wallet simulation",
      "Customizable token balances",
      "Live token price feeds",
      "Peer-to-peer simulated transactions",
      "Push notifications for incoming transfers",
      "Progressive web app — no app store required",
    ],
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.png"),
    description: siteConfig.description,
    sameAs: [
      "https://x.com/LarperWallet",
      "https://t.me/LarperWallet_support_bot",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://t.me/LarperWallet_support_bot",
      availableLanguage: "English",
    },
  };
}

export function buildBlogPostingSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    author: {
      "@type": "Organization",
      name: "LarperWallet Team",
    },
    datePublished: post.date,
    dateModified: post.date,
    image: absoluteUrl(post.image),
    wordCount: post.readingTime.split(" ")[0] ? parseInt(post.readingTime.split(" ")[0]) * 200 : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };
}

export function buildFaqSchema(
  faq: Array<{ question: string; answer: string }> | undefined,
) {
  if (!faq?.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      item: absoluteUrl(breadcrumb.item),
    })),
  };
}

export function buildSiteNavigationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: [
      "Home",
      "Features",
      "Pricing",
      "Blog",
      "Login",
    ],
    url: [
      absoluteUrl("/"),
      absoluteUrl("/#features"),
      absoluteUrl("/buy"),
      absoluteUrl("/blog"),
      absoluteUrl("/sign-in"),
    ],
  };
}
