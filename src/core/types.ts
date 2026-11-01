import { z } from "zod";
import { QuestionSchema, QuizSchema } from "./schemas";

export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
