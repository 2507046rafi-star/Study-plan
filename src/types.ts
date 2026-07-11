export interface GoalItem {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export interface CardImage {
  id: string;
  url: string; // Base64 data url or Object URL
  name: string; // Original file name
  caption: string;
  filter: "none" | "grayscale" | "sepia" | "blur" | "high-contrast" | "warm" | "cool";
  aspectRatio: "1:1" | "4:3" | "16:9" | "portrait";
}

export type CardLayout = "vertical-compact" | "dual-column" | "image-header" | "minimalist-stack";

export interface CardTheme {
  id: string;
  name: string;
  bgGradient: string; // CSS background gradient or Tailwind class
  cardBg: string; // CSS background for the card
  textColor: string;
  titleColor: string;
  subtitleColor: string;
  accentBg: string;
  accentText: string;
  borderColor: string;
  fontHeading: string;
  fontBody: string;
  buttonClass: string;
  badgeHigh: string;
  badgeMedium: string;
  badgeLow: string;
}

export interface CardData {
  title: string;
  subtitle: string;
  date: string;
  userName: string;
  goals: GoalItem[];
  images: CardImage[];
  footerQuote: string;
  themeId: string;
  layout: CardLayout;
  showProgress: boolean;
  progressStyle: "bar" | "percentage" | "none";
}
