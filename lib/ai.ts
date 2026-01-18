import { createAzure } from "@ai-sdk/azure";

export const azure = createAzure({
  apiKey: "9bd2d13588a14f4cae62325fc68d7d64",
  resourceName: "aim-australia-east",
});

// Available models
export const models = {
  main: "gpt-5-hiring",
  mini: "gpt-5-mini-hiring",
};
