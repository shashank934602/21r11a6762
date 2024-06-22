import { Hono } from 'hono';
import axios from 'axios';

const app = new Hono();
interface Product {
  company: string;
  productId: string;
  productName: string;
  price: number;
  rating: number;
  discount: number;
  availability: string;
}

app.post('/register', async (c) => {
  try {
    const body = await c.req.json();

    const response = await axios.post('http://20.244.56.144/test/register', {
      companyName: body.companyName,
      ownerName: body.ownerName,
      rollNo: `${body.rollNo}`,
      ownerEmail: body.ownerEmail,
      accessCode: "ordxkq",
    });

    const { clientID, clientSecret, authorizationToken } = response.data;

    const responseData = {
      companyName: body.companyName,
      clientID,
      clientSecret,
      ownerName: body.ownerName,
      ownerEmail: body.ownerEmail,
      rollNo: body.rollNo,
      authorizationToken,
    };

    return c.json(responseData);
  } catch (error:any) {
    console.error('Error during registration:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.get('/categories/:categoryname/products', async (c) => {
  try {
    const categoryname = c.req.param('categoryname');
    const { top = 10, minPrice = 0, maxPrice = 100000, sort_by = 'rating', sort_order = 'desc', page = 1 } = c.req.query as Record<string, any>;

    const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
    const promises = companies.map(company => {
      const url = `http://20.244.56.144/test/companies/AMZ/categories/Laptop/products?top=10&minPrice=1&maxPrice=10000`;
      return axios.get<Product[]>(url, {
        params: { top, minPrice, maxPrice }
      });
    });

    const responses = await Promise.all(promises);

    let products: Product[] = [];
    responses.forEach(response => {
      products = products.concat(response.data);
    });

    products.sort((a, b) => {
      const aValue:any = a[sort_by as keyof Product];
      const bValue:any = b[sort_by as keyof Product];
      if (sort_order === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    const startIndex = (page - 1) * top;
    const paginatedProducts = products.slice(startIndex, startIndex + parseInt(top as string));

    const productsWithIds = paginatedProducts.map(product => ({
      ...product,
      productid: `${product.company}-${product.productId}` // Example of generating productid
    }));

    return c.json(productsWithIds);
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/categories/:categoryname/products/:productid', async (c) => {
  try {
    const categoryname = c.req.param('categoryname');
    const productid = c.req.param('productid');

    const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
    let productDetails=null;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const url = `http://20.244.56.144/test/companies/${company}/categories/${categoryname}/products`;
      const response = await axios.get<Product[]>(url);

      productDetails = response.data.find(product => `${product.company}-${product.productId}` === productid);
      if (productDetails) {
        break;
      }
    }

    if (productDetails) {
      return c.json(productDetails);
    } else {
      return c.json({ error: 'Product not found' }, 404);
    }
  } catch (error) {
    console.error('Error fetching product details:', error);
    return c.json({ error: 'Failed to fetch product details' }, 500);
  }
});export default app;
