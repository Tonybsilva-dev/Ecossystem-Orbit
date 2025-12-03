/**
 * Test Server Helper
 * 
 * Creates a test server instance for integration testing with supertest.
 * This helper sets up a React Router server using Express that can be used
 * in integration tests.
 */

import express from "express";
import { createRequestHandler } from "@react-router/express";
import type { Express } from "express";

let testApp: Express | null = null;

/**
 * Create a test Express app with React Router handler.
 * 
 * This function creates an Express application that uses the React Router
 * build to handle requests. The app can be used with supertest for integration
 * testing.
 * 
 * @returns Express app instance
 */
export async function createTestApp(): Promise<Express> {
  if (!testApp) {
    const app = express();

    // Create request handler using the server build
    // In test environment, we import the build dynamically
    const handler = createRequestHandler({
      build: async () => {
        // Import the server build
        // For tests, we need to ensure the build exists
        // If running tests without build, this will fail
        // @ts-expect-error - Build file is JavaScript, no types available
        return await import("../../build/server/index.js");
      },
      mode: process.env.NODE_ENV || "test",
      getLoadContext() {
        // Return empty context for tests
        // Can be extended to provide test-specific context if needed
        return {};
      },
    });

    // Handle all routes with React Router
    // Use app.use instead of app.all("*") to avoid path-to-regexp issues
    app.use(handler);

    testApp = app;
  }

  return testApp;
}

