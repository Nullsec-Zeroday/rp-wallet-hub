import { FadeIn } from "@/components/marketing/fade-in";
import { blogCategories, blogPosts, featuredBlogPost } from "@/lib/blog-data";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";

export default function BlogPage() {
  const remainingPosts = blogPosts.filter(
    (post) => post.slug !== featuredBlogPost.slug,
  );

  return (
    <div className="min-h-screen bg-[#0C0814] text-[#EFE7FF] font-sans overflow-x-hidden selection:bg-[#8B5CF6] selection:text-white relative pb-32">
      {/* Subtle background, removing heavy aurora for cleaner look */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-10 blur-[120px]"
          style={{ backgroundImage: "radial-gradient(circle at center, #8B5CF6 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-[#0C0814]/80" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center px-4 pt-28 md:px-6 md:pt-36">
        {/* Header Section */}
        <FadeIn direction="up" className="w-full">
          <div className="mx-auto mb-12 md:mb-16 w-full max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#D7C7FF] mb-6">
              <Sparkles size={13} />
              Editorial Hub
            </div>
            <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl [text-wrap:balance]">
              Wallet mockups, demos, and <span className="text-[#A78BFA]">content systems that actually hold up.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/70 [text-wrap:pretty]">
              Practical long-form articles on wallet simulators, crypto LARP-friendly mockups, launch visuals, creator workflows, safer production, and the editorial systems that make product content more discoverable.
            </p>
            
            {/* Wrap Categories */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 pb-2">
              {blogCategories.map((category) => (
                <span
                  key={category}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="flex w-full max-w-5xl flex-col gap-12 md:gap-16">
          {/* Featured Post - Stacked gracefully on mobile */}
          <FadeIn direction="up">
            <Link href={`/blog/${featuredBlogPost.slug}`} className="group block">
              <div className="flex flex-col lg:flex-row overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#120F1B] transition-colors hover:border-white/15">
                <div className="relative flex-1 p-6 md:p-8 lg:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#D7C7FF] mb-4">
                    {featuredBlogPost.heroLabel}
                  </div>
                  <h2 className="text-2xl font-bold leading-snug tracking-tight text-white md:text-4xl [text-wrap:balance] group-hover:text-[#D0B5FF] transition-colors">
                    {featuredBlogPost.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/70 md:text-[16px] [text-wrap:pretty]">
                    {featuredBlogPost.description}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] font-medium text-white/50">
                    <span className="text-[#D7C7FF]">{featuredBlogPost.category}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{featuredBlogPost.readingTime}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{featuredBlogPost.date}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-white/[0.08] bg-[#161320] p-6 lg:w-[340px] lg:border-l lg:border-t-0 lg:p-8">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-4">
                      Who this is for
                    </div>
                    <ul className="space-y-2">
                      {featuredBlogPost.audience.slice(0, 3).map((item) => (
                        <li key={item} className="flex items-start text-[14px] leading-snug text-white/80">
                          <span className="mr-2 text-[#8B5CF6]">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-white">
                    Read featured guide <ArrowUpRight size={16} className="text-[#A78BFA] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          </FadeIn>

          {/* Value Props - Simple clean cards */}
          <FadeIn direction="up">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Richer structure",
                  body: "Built around takeaways, checklists, and deeper narrative pacing.",
                },
                {
                  title: "Actionable depth",
                  body: "Focus on workflows and systems that readers actually care about.",
                },
                {
                  title: "Clean readability",
                  body: "Designed for reading, not just marketing. Fast, clean, and focused.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-[16px] font-bold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/60 [text-wrap:pretty]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Standard Blog Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remainingPosts.map((post, i) => (
              <FadeIn key={post.slug} delay={i * 50} direction="up" className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className="group flex h-full flex-col rounded-[20px] border border-white/[0.08] bg-[#120F1B] transition-colors hover:border-white/15">
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em]">
                        <span className="text-[#A78BFA]">{post.category}</span>
                        <span className="text-white/40">{post.readingTime}</span>
                      </div>

                      <h3 className="mb-3 text-[18px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-[#D0B5FF] [text-wrap:balance]">
                        {post.title}
                      </h3>

                      <p className="mb-6 flex-1 text-[14px] leading-relaxed text-white/60 line-clamp-3 [text-wrap:pretty]">
                        {post.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-4">
                        <span className="text-[12px] text-white/50">{post.date}</span>
                        <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
                          Read <ChevronRight size={14} className="text-[#A78BFA] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* CTA Section */}
          <FadeIn direction="up">
            <div className="mt-8 w-full rounded-[24px] border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-8 text-center md:p-12">
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl [text-wrap:balance]">
                Need polished wallet visuals for your next launch?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-[15px] leading-relaxed text-white/70 [text-wrap:pretty]">
                Explore RP Wallet for mockups, demos, creator assets, and entertainment-ready wallet scenes that look clean on mobile and desktop.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/buy" className="flex h-11 w-full items-center justify-center rounded-xl bg-[#8B5CF6] px-8 text-[14px] font-bold text-white transition-all hover:bg-[#7e53de] sm:w-auto">
                  View Pricing
                </Link>
                <Link href="/" className="flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-8 text-[14px] font-bold text-white transition-all hover:bg-white/[0.1] sm:w-auto">
                  Back to Home
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
