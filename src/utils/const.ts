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
