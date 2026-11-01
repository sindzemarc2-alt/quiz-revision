import { QuizSchema } from "./schemas";

const bonQuiz = {
  title: "Mémoire cache",
  questions: [
    {
      id: "q1",
      question: "Que signifie un hit ?",
      choices: [
        "La donnée est dans le cache",
        "La donnée est absente du cache",
        "La RAM est pleine",
        "Le disque est lent",
      ],
      correctIndex: 0,
      explanation: "Un hit signifie que la donnée demandée est déjà dans le cache.",
    },
  ],
};

const mauvaisQuiz = {
  title: "Quiz cassé",
  questions: [
    {
      id: "q1",
      question: "Question avec seulement 3 choix ?",
      choices: ["A", "B", "C"],
      correctIndex: 5,
      explanation: "",
    },
  ],
};

console.log("Bon quiz valide ?", QuizSchema.safeParse(bonQuiz).success);

const resultat = QuizSchema.safeParse(mauvaisQuiz);
console.log("Mauvais quiz valide ?", resultat.success);
if (!resultat.success) {
  console.log(resultat.error.issues.map((i) => i.path.join(".") + " : " + i.message));
}