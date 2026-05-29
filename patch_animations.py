import re

file_path = "apps/hub/components/marketing/landing-content.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Remove global variants
content = re.sub(
    r"const fadeInUp = \{.*?\n\};\n\nconst staggerContainer = \{.*?\n\};\n",
    "",
    content,
    flags=re.DOTALL
)

# 2. Add isMobile state and local variants inside LandingContent
insertion = """  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return true;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fadeInUp = {
    initial: isMobile ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: isMobile ? 0 : 0.02,
      },
    },
    viewport: { once: true },
  };
"""

content = content.replace(
    "export default function LandingContent() {\n  const USE_NEW_MOBILE_LOOP = false;",
    "export default function LandingContent() {\n  const USE_NEW_MOBILE_LOOP = false;\n" + insertion
)

# 3. Replace inline initial={{ ... }} with initial={isMobile ? false : { ... }}
# We only want to target entry animations, not the text carousel which uses exit={{...}}
# The text carousel has `key={`text-${activeSlide}`}` so we can avoid it if we want,
# but `initial={isMobile ? false : ...}` is safe because it just skips the initial animation,
# and subsequent animations (when key changes) will still animate. Wait, if initial is false,
# it disables the initial animation for the component. For AnimatePresence, if initial is false,
# it disables mount animations.

content = re.sub(
    r"initial=\{\{ (.*?) \}\}",
    r"initial={isMobile ? false : { \1 }}",
    content
)

# Let's also handle initial="initial" -> we don't need to change this because it uses the variants
# which are already patched above.

with open(file_path, "w") as f:
    f.write(content)

print("Patched successfully!")
