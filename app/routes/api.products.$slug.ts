import { type LoaderFunctionArgs } from "react-router";
import { ProductService } from "~/core/domain/product/product.service";

// Enable CORS for external access (e.g., from BarberFlow)
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { slug } = params;

  if (!slug) {
    return Response.json({ error: "Product slug is required" }, { status: 400 });
  }

  try {
    const product = await ProductService.getProductBySlug(slug);

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product, {
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specific BarberFlow domain
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
