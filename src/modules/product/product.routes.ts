import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { requireOperator } from "../../plugins/auth.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { ProductService } from "./product.service.js";

export async function productRoutes(app: FastifyInstance) {
  // Público: consumido pelos tenant apps para exibir planos (ex: onboarding do barber-flow).
  app.get("/products/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    const product = await ProductService.getProductBySlug(slug);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  });

  app.register(async (operatorApp) => {
    operatorApp.addHook("preHandler", requireOperator);

    operatorApp.get("/products", async () => ProductService.listProducts());

    // Aceita slug ou id — admin UI usa o mesmo param pros dois casos.
    operatorApp.get("/products/:id/full", async (request) => {
      const { id } = request.params as { id: string };
      const product = (await ProductService.getProductBySlug(id, true)) ?? (await ProductService.getProductById(id, true));
      if (!product) throw new NotFoundError("Product not found");
      return product;
    });

    operatorApp.post("/products", async (request, reply) => {
      const body = request.body as { name?: string; slug?: string; description?: string; logo?: string };
      if (!body.name || !body.slug) throw new ValidationError("name e slug são obrigatórios");
      const product = await ProductService.createProduct({ name: body.name, slug: body.slug, description: body.description, logo: body.logo });
      return reply.status(201).send(product);
    });

    operatorApp.patch("/products/:id", async (request) => {
      const { id } = request.params as { id: string };
      return ProductService.updateProduct(id, request.body as Record<string, unknown>);
    });

    operatorApp.delete("/products/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await ProductService.deleteProduct(id);
      return reply.status(204).send();
    });

    operatorApp.get("/products/:id/analytics", async (request) => {
      const { id } = request.params as { id: string };
      return ProductService.getProductAnalytics(id);
    });

    // Plans
    operatorApp.post("/products/:id/plans", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        price?: number;
        interval?: "MONTHLY" | "YEARLY";
        features?: string[];
        limits?: Prisma.InputJsonValue;
        featureIds?: string[];
      };
      if (!body.name || body.price === undefined || !body.interval) {
        throw new ValidationError("name, price e interval são obrigatórios");
      }
      const plan = await ProductService.createPlan({
        productId: id,
        name: body.name,
        price: body.price,
        interval: body.interval,
        features: body.features ?? [],
        limits: body.limits,
        featureIds: body.featureIds,
      });
      return reply.status(201).send(plan);
    });

    operatorApp.patch("/plans/:id", async (request) => {
      const { id } = request.params as { id: string };
      return ProductService.updatePlan(id, request.body as Record<string, unknown>);
    });

    operatorApp.delete("/plans/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await ProductService.deletePlan(id);
      return reply.status(200).send(result);
    });

    // Features
    operatorApp.get("/products/:id/features", async (request) => {
      const { id } = request.params as { id: string };
      return ProductService.listFeatures(id);
    });

    operatorApp.post("/products/:id/features", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { key?: string; name?: string; description?: string };
      if (!body.key || !body.name) throw new ValidationError("key e name são obrigatórios");
      const feature = await ProductService.createFeature({ productId: id, key: body.key, name: body.name, description: body.description });
      return reply.status(201).send(feature);
    });

    operatorApp.patch("/features/:id", async (request) => {
      const { id } = request.params as { id: string };
      return ProductService.updateFeature(id, request.body as Record<string, unknown>);
    });

    operatorApp.delete("/features/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await ProductService.deleteFeature(id);
      return reply.status(204).send();
    });
  });
}
