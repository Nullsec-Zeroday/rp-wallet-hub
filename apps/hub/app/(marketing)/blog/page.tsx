import { FadeIn } from "@/components/marketing/fade-in";
import { blogCategories, blogPosts, featuredBlogPost } from "@/lib/blog-data";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";

export default function BlogPage() {
  const remainingPosts = blogPosts.filter(
    (post) => post.slug !== featuredBlogPost.slug,
  );

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#ab9ff2] selection:text-white relative pb-32">
      {/* Subtle background glow */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-ph4ntom-purple/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center px-4 pt-28 md:px-6 md:pt-36">
        {/* Header Section */}
        <FadeIn direction="up" className="w-full">
          <div className="mx-auto mb-12 md:mb-16 w-full max-w-5xl text-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 px-4 text-[11px] font-semibold text-white/80 uppercase tracking-widest mb-6">
              <Sparkles size={13} className="text-[#ab9ff2]" />
              Editorial Hub
            </div>
            <h1 className="font-display mx-auto max-w-4xl text-4xl font-medium leading-tight tracking-tight text-white md:text-5xl lg:text-6xl [text-wrap:balance]">
              Wallet mockups, demos, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent">content systems that actually hold up.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/60 [text-wrap:pretty]">
              Practical long-form articles on wallet simulators, crypto LARP-friendly mockups, launch visuals, creator workflows, safer production, and the editorial systems that make product content more discoverable.
            </p>
            
            {/* Wrap Categories */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pb-2">
              {blogCategories.map((category) => (
                <span
                  key={category}
                  className="shrink-0 rounded-full border border-white/5 bg-white/[0.02] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/60 hover:bg-white/[0.05] transition-colors cursor-default"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="flex w-full max-w-5xl flex-col gap-12 md:gap-16">
          {/* Featured Post */}
          <FadeIn direction="up">
            <Link href={`/blog/${featuredBlogPost.slug}`} className="group block">
              <div className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
                <div className="relative flex-1 p-8 md:p-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 mb-6">
                    {featuredBlogPost.heroLabel}
                  </div>
                  <h2 className="font-display text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl [text-wrap:balance] group-hover:text-[#ab9ff2] transition-colors">
                    {featuredBlogPost.title}
                  </h2>
                  <p className="mt-4 text-[16px] leading-relaxed text-white/60 [text-wrap:pretty]">
                    {featuredBlogPost.description}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3 text-[12px] font-medium text-white/40">
                    <span className="text-white/70">{featuredBlogPost.category}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{featuredBlogPost.readingTime}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{featuredBlogPost.date}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-white/[0.05] bg-white/[0.01] p-8 lg:w-[340px] lg:border-l lg:border-t-0">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">
                      Who this is for
                    </div>
                    <ul className="space-y-4">
                      {featuredBlogPost.audience.slice(0, 3).map((item) => (
                        <li key={item} className="flex items-start text-[14px] leading-snug text-white/70">
                          <span className="mr-3 text-[#ab9ff2]">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-10 inline-flex items-center gap-2 text-[14px] font-medium text-white/90">
                    Read featured guide <ArrowUpRight size={16} className="text-[#ab9ff2] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          </FadeIn>

          {/* Value Props */}
          <FadeIn direction="up">
            <div className="grid gap-6 sm:grid-cols-3">
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
                <div key={item.title} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col hover:bg-white/[0.03] transition-colors">
                  <h3 className="text-[17px] font-medium tracking-tight text-white/90">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/50 [text-wrap:pretty]">
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
                  <div className="glass-panel group flex h-full flex-col backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-3xl transition-all hover:bg-white/[0.04] hover:border-white/10 hover:shadow-xl">
                    <div className="flex flex-1 flex-col p-8">
                      <div className="mb-6 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                        <span className="text-[#ab9ff2]">{post.category}</span>
                        <span className="text-white/40">{post.readingTime}</span>
                      </div>

                      <h3 className="font-display mb-4 text-[22px] font-medium leading-tight tracking-tight text-white transition-colors group-hover:text-[#ab9ff2] [text-wrap:balance]">
                        {post.title}
                      </h3>

                      <p className="mb-8 flex-1 text-[15px] leading-relaxed text-white/50 line-clamp-3 [text-wrap:pretty]">
                        {post.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-white/[0.05] pt-6">
                        <span className="text-[13px] text-white/40">{post.date}</span>
                        <div className="flex items-center gap-1 text-[14px] font-medium text-white/80">
                          Read <ChevronRight size={16} className="text-[#ab9ff2] transition-transform group-hover:translate-x-1" />
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
            <div className="glass-panel mt-12 w-full rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 text-center md:p-16 relative overflow-hidden flex flex-col items-center shadow-xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-ph4ntom-purple/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
                <h2 className="font-display mb-4 text-3xl font-medium tracking-tight text-white md:text-4xl [text-wrap:balance]">
                  Need polished wallet visuals for your next launch?
                </h2>
                <p className="mx-auto mb-10 max-w-lg text-[16px] leading-relaxed text-white/60 [text-wrap:pretty]">
                  Explore RPWallet for mockups, demos, creator assets, and entertainment-ready wallet scenes that look clean on mobile and desktop.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  <Link href="/buy" className="flex h-12 w-full items-center justify-center rounded-full bg-white/10 border border-white/10 px-8 text-[15px] font-medium text-white transition-all hover:bg-white/15 sm:w-auto">
                    View Pricing
                  </Link>
                  <Link href="/" className="flex h-12 w-full items-center justify-center rounded-full bg-transparent px-8 text-[15px] font-medium text-white/70 transition-all hover:text-white sm:w-auto">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
