declare module "eslint/config" {
  import { Linter } from "eslint";

  export function defineConfig(
    config: Linter.FlatConfig | Linter.FlatConfig[]
  ): Linter.FlatConfig[];
}
