"use client";

import React, { useState, useEffect } from "react";
import { FadeIn } from "@/components/marketing/fade-in";
import type { BlogPost } from "@/lib/blog-data";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  MessageCircle,
  ChevronRight,
  Menu,
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BlogPostClient({
  post,
  relatedPosts,
}: {
  post: BlogPost;
  relatedPosts: BlogPost[];
}) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const sectionAnchors = post.sections.map((section) => ({
    id: slugify(section.title),
    title: section.title,
  }));
  
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0C0814] text-[#EFE7FF] font-sans selection:bg-[#8B5CF6] selection:text-white pb-32">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#D0B5FF] z-[60] origin-left"
        style={{ scaleX, top: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Sticky Mobile/Desktop Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0C0814]/80 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent py-5"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="group flex items-center gap-2 text-[14px] font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
            <span className="hidden sm:inline">Back to Blog</span>
          </Link>
          <div className="flex items-center gap-4">
            <button aria-label="Share" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Subtle top background only */}
      <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.08] blur-[120px] rounded-full"
          style={{ backgroundImage: "radial-gradient(circle at center, #8B5CF6 0%, transparent 70%)" }}
        />
      </div>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 pt-32 sm:px-6 lg:px-8">
        <article className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(250px,300px)] lg:gap-16">
          {/* Main Content Column */}
          <div className="mx-auto w-full max-w-3xl">
            {/* Post Header */}
            <header className="mb-12">
              <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="text-[#A78BFA]">
                  {post.category}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/50">
                  {post.heroLabel}
                </span>
              </div>

              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl [text-wrap:balance]">
                {post.title}
              </h1>
              
              <p className="mt-6 text-[18px] leading-relaxed text-white/70 [text-wrap:pretty]">
                {post.description}
              </p>

              <div className="mt-8 flex items-center justify-between border-y border-white/5 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1525] border border-white/5 text-[12px] font-bold text-white">
                    RP
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white">{post.author}</div>
                    <div className="text-[12px] text-white/50">Editorial Team</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4 text-[13px] text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#8B5CF6]/50" /> {post.date}
                  </div>
                  <div className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#8B5CF6]/50" /> {post.readingTime}
                  </div>
                </div>
              </div>
            </header>

            {/* Mobile Table of Contents */}
            <div className="mb-10 block lg:hidden">
              <button 
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#120F1B] px-5 py-4 text-[14px] font-semibold text-white"
              >
                <div className="flex items-center gap-2">
                  <Menu size={16} className="text-[#A78BFA]" />
                  In this article
                </div>
                <ChevronRight size={16} className={`transition-transform ${isTocOpen ? "rotate-90" : ""}`} />
              </button>
              {isTocOpen && (
                <div className="mt-2 rounded-xl border border-white/5 bg-[#120F1B]/50 p-5">
                  <ul className="space-y-3">
                    {sectionAnchors.map((section, index) => (
                      <li key={section.title}>
                        <a href={`#${section.id}`} className="block text-[14px] text-white/60 hover:text-white" onClick={() => setIsTocOpen(false)}>
                          {index + 1}. {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Article Body */}
            <div className="space-y-12">
              {/* Quick Takes */}
              <div className="rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-6 sm:p-8">
                <h3 className="mb-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#A78BFA]">
                  Key Takeaways
                </h3>
                <ul className="space-y-3">
                  {post.takeaways.map((item) => (
                    <li key={item} className="flex items-start text-[15px] leading-relaxed text-white/80 [text-wrap:pretty]">
                      <span className="mr-3 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editorial Quote */}
              {post.quote && (
                <blockquote className="border-l-4 border-[#8B5CF6] pl-6 italic">
                  <p className="text-[20px] leading-relaxed text-white/90 [text-wrap:balance]">
                    "{post.quote.text}"
                  </p>
                  <footer className="mt-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#A78BFA]">
                    — {post.quote.attribution}
                  </footer>
                </blockquote>
              )}

              {/* Sections */}
              {post.sections.map((section) => (
                <section key={section.title} id={slugify(section.title)} className="scroll-mt-24">
                  <h2 className="mb-5 text-[24px] font-bold tracking-tight text-white sm:text-[28px] [text-wrap:balance]">
                    {section.title}
                  </h2>
                  
                  {section.summary && (
                    <p className="mb-6 text-[18px] font-medium leading-relaxed text-[#D7C7FF] [text-wrap:pretty]">
                      {section.summary}
                    </p>
                  )}
                  
                  <div className="space-y-5 text-[17px] leading-[1.75] text-white/75">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="[text-wrap:pretty]">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.bullets?.length ? (
                    <ul className="mt-6 space-y-3 list-disc pl-5 text-[17px] leading-relaxed text-white/75">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className="pl-2 [text-wrap:pretty]">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {section.callout && (
                    <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-[15px] leading-relaxed text-white/80 italic">
                      {section.callout}
                    </div>
                  )}
                </section>
              ))}

              {/* FAQs */}
              {post.faq?.length ? (
                <section className="mt-16 border-t border-white/5 pt-12">
                  <h2 className="mb-8 text-[24px] font-bold tracking-tight text-white sm:text-[28px]">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-6">
                    {post.faq.map((item) => (
                      <div key={item.question}>
                        <h3 className="text-[17px] font-semibold text-white mb-2">
                          {item.question}
                        </h3>
                        <p className="text-[16px] leading-relaxed text-white/70 [text-wrap:pretty]">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 rounded-[24px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-8 text-center sm:p-12">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-[#A78BFA]">
                <MessageCircle size={24} />
              </div>
              <h3 className="mb-4 text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
                Want better wallet visuals for your next campaign?
              </h3>
              <p className="mx-auto mb-8 max-w-lg text-[16px] leading-relaxed text-white/70 [text-wrap:pretty]">
                LarperWallet is built for polished demos, mockups, roleplay content, and entertainment-ready visuals that feel consistent across desktop and mobile.
              </p>
              <Link href="/buy" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#8B5CF6] px-8 text-[15px] font-bold text-white transition-all hover:bg-[#7e53de]">
                Explore LarperWallet
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-8">
              {/* Desktop TOC */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-4">
                  In this article
                </h3>
                <nav className="space-y-3 border-l border-white/10 pl-4">
                  {sectionAnchors.map((section) => (
                    <a
                      key={section.title}
                      href={`#${section.id}`}
                      className="block text-[14px] leading-snug text-white/60 transition-colors hover:text-[#A78BFA]"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Related Posts */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-4">
                  Related reading
                </h3>
                <div className="grid gap-4">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="group block rounded-2xl border border-white/5 bg-[#120F1B] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.02]"
                    >
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A78BFA]">
                        {item.category}
                      </div>
                      <h4 className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-[#D0B5FF] [text-wrap:balance]">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </article>
      </main>
    </div>
  );
}
