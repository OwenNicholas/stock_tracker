import { NextRequest } from 'next/server';
import { ProductController } from '../controllers/productController';

const productController = new ProductController();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create a new request with the ID as a search param for the controller
  const url = new URL(request.url);
  url.searchParams.set('id', params.id);
  const newRequest = new Request(url.toString(), request);
  
  return productController.getProductById(newRequest);
} 