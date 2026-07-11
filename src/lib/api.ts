export interface EnhancedGoals {
  smart: string;
  motivational: string;
  minimal: string;
}

export interface SuggestedCaptions {
  captions: string[];
}

export async function enhanceGoalText(goalText: string): Promise<EnhancedGoals> {
  const response = await fetch("/api/ai/enhance-goal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ goalText }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to communicate with AI server");
  }

  return response.json();
}

export async function suggestCaptions(goalTitle: string, captionContext?: string): Promise<SuggestedCaptions> {
  const response = await fetch("/api/ai/suggest-captions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ goalTitle, captionContext }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to communicate with AI server");
  }

  return response.json();
}
