type TrainDirection = "East" | "West";

export type Train = {
  id: string;
  type: string;
  direction: TrainDirection;
  delay: number;
  dest: string;
  length: number | null;
};

export type Section = {
  id: string;
  trains: Train[];
};
