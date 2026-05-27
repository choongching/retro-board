// Universal open-ended prompts for the icebreaker modal.
// Format-agnostic: the participant supplies the content and picks the column.
export const ICEBREAKER_QUESTIONS: string[] = [
  "Anything from this sprint you want to add?",
  "Anything been on your mind lately?",
  "Got a thought worth sharing?",
];

export function pickQuestion(): string {
  return ICEBREAKER_QUESTIONS[Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)];
}
