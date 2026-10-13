import { config } from "dotenv";

// Les tests utilisent exclusivement la base de test.
config({ path: ".env.test", quiet: true });
