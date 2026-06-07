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
    <div className="min-h-screen text-white font-sans selection:bg-[#ab9ff2] selection:text-white pb-32">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent z-[60] origin-left"
        style={{ scaleX, top: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Sticky Mobile/Desktop Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/40 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent py-5"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="group flex items-center gap-2 text-[14px] font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
            <span className="hidden sm:inline">Back to Blog</span>
          </Link>
          <div className="flex items-center gap-4">
            <button aria-label="Share" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Subtle top background only */}
      <div className="fixed top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-ph4ntom-purple/10 blur-[120px] rounded-full"
        />
      </div>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 pt-32 sm:px-6 lg:px-8">
        <article className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(250px,300px)] lg:gap-16">
          {/* Main Content Column */}
          <div className="mx-auto w-full max-w-3xl">
            {/* Post Header */}
            <header className="mb-12">
              <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                <span className="text-[#ab9ff2]">
                  {post.category}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/50">
                  {post.heroLabel}
                </span>
              </div>

              <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl [text-wrap:balance]">
                {post.title}
              </h1>
              
              <p className="mt-6 text-[18px] md:text-[20px] leading-relaxed text-white/60 [text-wrap:pretty]">
                {post.description}
              </p>

              <div className="mt-8 flex items-center justify-between border-y border-white/5 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#161618] border border-white/10 text-[13px] font-bold text-white shadow-lg">
                    RP
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-white/90">{post.author}</div>
                    <div className="text-[13px] text-white/50">Editorial Team</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4 text-[13px] font-medium text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-white/40" /> {post.date}
                  </div>
                  <div className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-white/40" /> {post.readingTime}
                  </div>
                </div>
              </div>
            </header>

            {/* Mobile Table of Contents */}
            <div className="mb-10 block lg:hidden">
              <button 
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="glass-panel flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <Menu size={16} className="text-[#ab9ff2]" />
                  In this article
                </div>
                <ChevronRight size={16} className={`text-white/50 transition-transform ${isTocOpen ? "rotate-90" : ""}`} />
              </button>
              {isTocOpen && (
                <div className="glass-panel mt-2 rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-md">
                  <ul className="space-y-4">
                    {sectionAnchors.map((section, index) => (
                      <li key={section.title}>
                        <a href={`#${section.id}`} className="block text-[14px] font-medium text-white/60 hover:text-[#ab9ff2] transition-colors" onClick={() => setIsTocOpen(false)}>
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
              <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 backdrop-blur-md shadow-xl">
                <h3 className="mb-6 text-[12px] font-bold uppercase tracking-widest text-[#ab9ff2]">
                  Key Takeaways
                </h3>
                <ul className="space-y-4">
                  {post.takeaways.map((item) => (
                    <li key={item} className="flex items-start text-[16px] leading-relaxed text-white/80 [text-wrap:pretty]">
                      <span className="mr-4 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ab9ff2]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editorial Quote */}
              {post.quote && (
                <blockquote className="border-l-[3px] border-[#ab9ff2] pl-8 py-2 my-12">
                  <p className="font-display text-[22px] md:text-[26px] font-medium leading-relaxed text-white/90 [text-wrap:balance]">
                    "{post.quote.text}"
                  </p>
                  <footer className="mt-4 text-[13px] font-medium uppercase tracking-widest text-white/50">
                    — {post.quote.attribution}
                  </footer>
                </blockquote>
              )}

              {/* Sections */}
              {post.sections.map((section) => (
                <section key={section.title} id={slugify(section.title)} className="scroll-mt-32">
                  <h2 className="font-display mb-6 text-[26px] font-medium tracking-tight text-white sm:text-[32px] [text-wrap:balance]">
                    {section.title}
                  </h2>
                  
                  {section.summary && (
                    <p className="mb-8 text-[18px] md:text-[20px] leading-relaxed text-white/90 [text-wrap:pretty]">
                      {section.summary}
                    </p>
                  )}
                  
                  <div className="space-y-6 text-[16px] md:text-[18px] leading-[1.8] text-white/60">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="[text-wrap:pretty]">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.bullets?.length ? (
                    <ul className="mt-8 space-y-4 list-disc pl-5 text-[16px] md:text-[18px] leading-relaxed text-white/60">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className="pl-2 [text-wrap:pretty] marker:text-[#ab9ff2]">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {section.callout && (
                    <div className="glass-panel mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-[16px] leading-relaxed text-white/80 italic backdrop-blur-sm">
                      {section.callout}
                    </div>
                  )}
                </section>
              ))}

              {/* FAQs */}
              {post.faq?.length ? (
                <section className="mt-20 border-t border-white/5 pt-16">
                  <h2 className="font-display mb-10 text-[26px] font-medium tracking-tight text-white sm:text-[32px]">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-8">
                    {post.faq.map((item) => (
                      <div key={item.question}>
                        <h3 className="text-[18px] font-medium text-white/90 mb-3">
                          {item.question}
                        </h3>
                        <p className="text-[16px] leading-relaxed text-white/60 [text-wrap:pretty]">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Bottom CTA */}
            <div className="glass-panel mt-20 rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 text-center sm:p-16 backdrop-blur-md shadow-xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-ph4ntom-purple/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#161618] text-[#ab9ff2] shadow-lg">
                  <MessageCircle size={24} />
                </div>
                <h3 className="font-display mb-4 text-3xl font-medium tracking-tight text-white md:text-4xl [text-wrap:balance]">
                  Want better wallet visuals?
                </h3>
                <p className="mx-auto mb-10 max-w-lg text-[16px] leading-relaxed text-white/60 [text-wrap:pretty]">
                  RPWallet is built for polished demos, mockups, roleplay content, and entertainment-ready visuals that feel consistent across desktop and mobile.
                </p>
                <Link href="/buy" className="inline-flex h-12 items-center justify-center rounded-full bg-white/10 border border-white/10 px-8 text-[15px] font-medium text-white transition-all hover:bg-white/15">
                  Explore RPWallet
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-10">
              {/* Desktop TOC */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">
                  In this article
                </h3>
                <nav className="space-y-4 border-l border-white/10 pl-5">
                  {sectionAnchors.map((section) => (
                    <a
                      key={section.title}
                      href={`#${section.id}`}
                      className="block text-[14px] font-medium leading-snug text-white/50 transition-colors hover:text-[#ab9ff2]"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Related Posts */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6 pl-2">
                  Related reading
                </h3>
                <div className="grid gap-4">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="glass-panel group block rounded-3xl border border-white/5 bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.03] hover:border-white/10 backdrop-blur-md"
                    >
                      <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#ab9ff2]">
                        {item.category}
                      </div>
                      <h4 className="font-display text-[18px] font-medium leading-snug text-white/90 transition-colors group-hover:text-white [text-wrap:balance]">
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
