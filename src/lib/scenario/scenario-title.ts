import { titleCase } from "@/lib/utils";

export function buildScenarioTitle(visibleProblem: string, neighborhoodType: string) {
  return `${titleCase(visibleProblem)} in ${neighborhoodType}`;
}
