import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(5),
  choices: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const QuizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});