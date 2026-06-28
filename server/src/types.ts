export interface KnowledgePoint {
  id: string;
  noteId: string;
  name: string;
  description: string | null;
  domain: string | null;
  type: string | null;
  mastery: number;
}

export interface Question {
  id: string;
  knowledgePointId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  domain: string | null;
}
