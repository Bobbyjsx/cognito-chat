import type { Metadata } from "next";

export const APP_URL = "https://cognito.bobslab.xyz";
export const APP_NAME = "Cognito";
export const APP_TITLE = "Cognito - Multi-Model AI Chat";
export const APP_DESCRIPTION =
  "Why pay for Gemini, Claude, and ChatGPT separately? Cognito puts every model in one chat, on one subscription.";

export const OG_IMAGE = {
  url: "/images/og.webp",
  width: 1200,
  height: 630,
  alt: APP_TITLE,
  type: "image/webp",
} as const;

export const OG_IMAGE_PNG = {
  url: "/images/og.png",
  width: 1200,
  height: 630,
  alt: APP_TITLE,
  type: "image/png",
} as const;

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    nosnippet: true,
  },
};

export const indexRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-video-preview": -1,
    "max-snippet": -1,
  },
};

export const FAQS = [
  {
    id: "what-is-cognito",
    question: "What is Cognito?",
    answer:
      "Cognito is a multi-model AI workspace that brings multiple leading AI models into one application. Instead of maintaining separate subscriptions and switching between different AI apps, you can access your models from one unified workspace.",
  },
  {
    id: "why-use-cognito",
    question: "Why use Cognito instead of ChatGPT, Claude, or Gemini?",
    answer:
      "Cognito is designed for people who want access to multiple AI models rather than committing to just one. You can switch between models, compare responses, maintain one conversation history, and manage your files from a single workspace.",
  },
  {
    id: "separate-subscriptions",
    question: "Do I need separate subscriptions for each AI model?",
    answer:
      "No. Cognito's goal is to give you access to multiple leading AI models through a single Cognito subscription, so you don't need to maintain separate premium subscriptions for each provider.",
  },
  {
    id: "switch-models",
    question: "Can I switch AI models during a conversation?",
    answer:
      "Yes. Cognito is designed around model switching. You can change models during a conversation without having to start over in another application.",
  },
  {
    id: "compare-responses",
    question: "Can I compare responses from different models?",
    answer:
      "Yes. Cognito allows you to use different models to get alternative perspectives on the same problem, making it easier to compare answers and choose the response that works best for you.",
  },
  {
    id: "upload-files",
    question: "Can I upload files?",
    answer:
      "Yes. Cognito supports file attachments so you can give your AI conversations additional context from documents and other supported files.",
  },
  {
    id: "conversation-history",
    question: "Does Cognito keep my conversation history?",
    answer:
      "Yes. Your conversations are organized in a unified history so you can return to previous work without searching through multiple AI applications.",
  },
  {
    id: "who-is-it-for",
    question: "Who is Cognito for?",
    answer:
      "Cognito is designed for anyone who regularly uses AI. It can be useful for developers, students, researchers, writers, professionals, creators, and anyone who wants access to multiple AI models without managing multiple AI subscriptions.",
  },
  {
    id: "is-cognito-model",
    question: "Is Cognito another AI model?",
    answer:
      "No. Cognito is the workspace. It brings multiple AI models together so you can choose the right intelligence for the task at hand.",
  },
] as const;
