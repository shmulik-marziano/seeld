import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        pencil: "hsl(var(--pencil))",
        "pencil-light": "hsl(var(--pencil-light))",
        cream: "hsl(var(--cream))",
        "cream-dark": "hsl(var(--cream-dark))",
        terracotta: {
          DEFAULT: "hsl(var(--terracotta))",
          light: "hsl(var(--terracotta-light))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          light: "hsl(var(--sage-light))",
        },
        seeld: {
          mint: "hsl(var(--seeld-mint))",
          coral: "hsl(var(--seeld-coral))",
          blush: "hsl(var(--seeld-blush))",
          sky: "hsl(var(--seeld-sky))",
          sand: "hsl(var(--seeld-sand))",
          teal: "hsl(var(--seeld-teal))",
          dark: "hsl(var(--seeld-dark))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      /* Modern soft, layered shadows — brand-tinted (deep teal) for a premium, cohesive depth */
      boxShadow: {
        sm: "0 1px 2px 0 rgb(10 61 61 / 0.04), 0 1px 3px 0 rgb(10 61 61 / 0.06)",
        DEFAULT: "0 2px 4px -1px rgb(10 61 61 / 0.05), 0 4px 12px -2px rgb(10 61 61 / 0.08)",
        md: "0 4px 8px -2px rgb(10 61 61 / 0.06), 0 8px 20px -4px rgb(10 61 61 / 0.10)",
        lg: "0 8px 16px -4px rgb(10 61 61 / 0.07), 0 16px 32px -8px rgb(10 61 61 / 0.12)",
        xl: "0 12px 24px -6px rgb(10 61 61 / 0.08), 0 24px 48px -12px rgb(10 61 61 / 0.16)",
        "2xl": "0 24px 48px -12px rgb(10 61 61 / 0.18), 0 40px 80px -20px rgb(10 61 61 / 0.22)",
        glow: "0 0 0 1px rgb(94 198 198 / 0.12), 0 8px 32px -8px rgb(94 198 198 / 0.45)",
        "glow-gold": "0 0 0 1px rgb(214 158 46 / 0.12), 0 8px 32px -8px rgb(214 158 46 / 0.40)",
        inner: "inset 0 2px 4px 0 rgb(10 61 61 / 0.05)",
        none: "none",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0a3d3d 0%, #155e5e 50%, #1d7a7a 100%)",
        "mint-gradient": "linear-gradient(135deg, #5ec6c6 0%, #3da3a3 100%)",
        "mesh-light":
          "radial-gradient(at 0% 0%, rgb(94 198 198 / 0.10) 0px, transparent 50%), radial-gradient(at 100% 0%, rgb(244 162 97 / 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgb(144 190 109 / 0.08) 0px, transparent 50%), radial-gradient(at 0% 100%, rgb(231 111 81 / 0.06) 0px, transparent 50%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "doodle-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(2deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-12px) translateX(6px)" },
          "66%": { transform: "translateY(8px) translateX(-4px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 0 12px hsl(var(--primary) / 0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "tilt": {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slide-in 0.3s ease-out",
        "doodle-float": "doodle-float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "tilt": "tilt 10s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
