import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog-data";

export const siteConfig = {
  name: "RPWallet",
  url: "https://rpwallet.app",
  description:
    "RPWallet is a crypto wallet simulator and fake crypto wallet app for entertainment, creator content, demos, and crypto roleplay. Create realistic Phantom and Trust Wallet screenshots, edit balances, add tokens, and simulate wallet activity with no real crypto involved.",
  ogImage: "/opengraph-image.png",
  // TODO: Replace legacy social handles after RPWallet accounts are created.
  xHandle: "@LarperWallet",
};

export const homepageFaq = [
  {
    question: "How do I create a fake crypto wallet screenshot?",
    answer:
      "Use RPWallet to open a simulated wallet interface, choose a Phantom-style or Trust Wallet-style screen, set the token balances and activity you want, then capture the screen for entertainment, demo, or content production. RPWallet does not hold or move real crypto.",
  },
  {
    question: "Can I make a fake Phantom wallet balance?",
    answer:
      "Yes. RPWallet includes a realistic Phantom-style wallet simulator where you can customize token balances, prices, wallet details, and activity for screenshots or videos. It is a simulator only and cannot send, receive, swap, or store real funds.",
  },
  {
    question: "What is a LARP wallet?",
    answer:
      "A LARP wallet is a simulated crypto wallet used for roleplay, creator content, product demos, and visual mockups. It looks like a wallet on screen, but it has no blockchain access, private keys, seed phrases, or real assets.",
  },
  {
    question: "Is RPWallet a real crypto wallet app?",
    answer:
      "No. RPWallet is a wallet simulator and visual production tool. It never asks for a seed phrase, never connects to your real wallet, and cannot process real blockchain transactions.",
  },
];

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
      default: "Fake Crypto Wallet App & Phantom Wallet Simulator | RPWallet",
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [
      "crypto wallet simulator",
      "fake crypto wallet",
      "fake crypto wallet screen",
      "fake crypto wallet screenshot",
      "fake crypto wallet screenshot generator",
      "fake crypto wallet app",
      "phantom wallet simulator",
      "trust wallet simulator",
      "ledger wallet simulator",
      "larp wallet",
      "larp wallet crypto",
      "larp wallet app",
      "larp wallet free",
      "larp crypto",
      "crypto larp",
      "fake phantom wallet",
      "fake phantom wallet screenshot",
      "fake phantom wallet balance",
      "fake phantom wallet app",
      "fake phantom wallet generator",
      "fake phantom wallet ios",
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
      "RPWallet",
    ],
    authors: [{ name: "RPWallet Team" }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "technology",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: "Fake Crypto Wallet App & Phantom Wallet Screenshot Generator",
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
      title: "Fake Crypto Wallet App & Phantom Wallet Simulator",
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
    alternateName: [
      "Fake Crypto Wallet App",
      "Phantom Wallet Simulator",
      "LARP Wallet",
      "Fake Phantom Wallet Generator",
      "Crypto Wallet Screenshot Generator",
    ],
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
      name: "RPWallet Team",
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
      "Trust Wallet-style simulation",
      "Fake crypto wallet screenshot creation",
      "Fake Phantom wallet balance editing",
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
      "https://t.me/LarperWallet_bot",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://t.me/LarperWallet_bot",
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
      name: "RPWallet Team",
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
