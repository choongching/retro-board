// Universal open-ended prompts for the icebreaker modal.
// Format-agnostic: the participant supplies the content and picks the column.
export const ICEBREAKER_QUESTIONS: string[] = [
  "Hey there, do you have any particular notes to add from this sprint?",
  "Anything been on your mind about the past few weeks?",
  "Got a thought you haven't shared yet?",
];

export function pickQuestion(): string {
  return ICEBREAKER_QUESTIONS[Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)];
}
