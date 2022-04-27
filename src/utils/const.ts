export const version = "0.1.0";
export const swaggerSpec = {
  apiFolder: "src/pages/api",
  schemaFolders: ["src/models"],
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CyberProfile API",
      version: version,
    },
  },
};

export const NotFoundError = new Error("Not Found");

export const CERAMIC_API_URL = "https://ceramic-clay.3boxlabs.com";

export const model = {
  schemas: {
    idxTable:
      "ceramic://k3y52l7qbv1fryjn62sggjh1lpn11c56qfofzmty190d62hwk1cal1c7qc5he54ow",
    basicProfile:
      "ceramic://k3y52l7qbv1frxt706gqfzmq6cbqdkptzk8uudaryhlkf6ly9vx21hqu4r6k1jqio",
  },
  definitions: {
    basicProfile:
      "kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic",
  },
};
