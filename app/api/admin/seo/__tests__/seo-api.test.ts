/**
 * SEO API Integration Tests
 *
 * Tests for SEO API endpoints
 * Note: These tests mock the database, auth middleware, and Next.js server components
 */

// Mock Request and Response for Node.js environment
class MockRequest {
  public url: string;
  public method: string;
  private bodyData: string | null;
  public headers: Map<string, string>;
  public adminUser: any;

  constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.bodyData = init?.body || null;
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.adminUser = null;
  }

  async json() {
    return this.bodyData ? JSON.parse(this.bodyData) : {};
  }

  get searchParams() {
    const url = new URL(this.url);
    return url.searchParams;
  }
}

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: MockRequest,
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

// Mock auth middleware
jest.mock('@/lib/middleware/authMiddleware', () => ({
  withAuthAdmin: jest.fn((request: any, handler: any) => {
    const mockReq = {
      ...request,
      adminUser: {
        _id: 'test-admin-id',
        username: 'admin',
        role: 'SUPER_ADMIN',
      },
    };
    return handler(mockReq);
  }),
  AuthenticatedRequest: {},
}));

// Mock ObjectId - must be inside factory to avoid hoisting issues
jest.mock('mongodb', () => {
  class MockObjectId {
    private id: string;
    constructor(id?: string) {
      this.id = id || 'a'.repeat(24);
    }
    toString() {
      return this.id;
    }
    static isValid(id: string): boolean {
      return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
    }
  }
  return { ObjectId: MockObjectId };
});

// Mock database
const mockProducts = {
  find: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  // For SEO products list which uses project()
  project: jest.fn(),
};

const mockSeoSettings = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockSeoRedirects = {
  find: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
};

const mockDb = {
  collection: jest.fn((name: string) => {
    switch (name) {
      case 'products':
        return mockProducts;
      case 'seoSettings':
        return mockSeoSettings;
      case 'seoRedirects':
        return mockSeoRedirects;
      default:
        return mockProducts;
    }
  }),
};

jest.mock('@/lib/db', () => ({
  getCollections: jest.fn(() =>
    Promise.resolve({
      db: mockDb,
      products: mockProducts,
    })
  ),
}));

// Helper to create mock request
function createMockRequest(
  method: string,
  url: string,
  body?: object
): MockRequest {
  return new MockRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

describe('SEO API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/seo (Dashboard Stats)', () => {
    it('should return dashboard statistics', async () => {
      // Mock product aggregation for stats
      mockProducts.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: null,
            total: 100,
            averageScore: 75,
            excellent: 20,
            good: 40,
            needsWork: 25,
            poor: 10,
            notAudited: 5,
          },
        ]),
      });

      // Import handler after mocks
      const { GET } = await import('@/app/api/admin/seo/route');

      const request = createMockRequest('GET', 'http://localhost:3000/api/admin/seo');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      // API returns stats directly, not nested under 'stats' property
      expect(data).toHaveProperty('totalProducts');
    });
  });

  describe('GET /api/admin/seo/products', () => {
    it('should return paginated products with SEO data', async () => {
      const mockProductDocs = [
        {
          _id: { toString: () => 'prod-1' },
          name: 'Product 1',
          slug: 'product-1',
          images: ['img1.jpg'],
          seo: { seoScore: 80 },
        },
        {
          _id: { toString: () => 'prod-2' },
          name: 'Product 2',
          slug: 'product-2',
          images: ['img2.jpg'],
          seo: { seoScore: 60 },
        },
      ];

      // Mock the chained methods: find().project().sort().skip().limit().toArray()
      mockProducts.find.mockReturnValue({
        project: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockProductDocs),
              }),
            }),
          }),
        }),
      });
      mockProducts.countDocuments.mockResolvedValue(2);

      const { GET } = await import('@/app/api/admin/seo/products/route');

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/admin/seo/products?page=1&per_page=20'
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('products');
      // API uses flat structure with 'page', 'perPage', 'total', 'totalPages'
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('total');
    });

    it('should filter by score range', async () => {
      mockProducts.find.mockReturnValue({
        project: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });
      mockProducts.countDocuments.mockResolvedValue(0);

      const { GET } = await import('@/app/api/admin/seo/products/route');

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/admin/seo/products?score_min=70&score_max=100'
      );
      await GET(request as any);

      expect(mockProducts.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'seo.seoScore': expect.objectContaining({
            $gte: 70,
            $lte: 100,
          }),
        })
      );
    });
  });

  describe('PATCH /api/admin/seo/products/bulk', () => {
    it('should bulk update product SEO fields', async () => {
      mockProducts.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const { PATCH } = await import('@/app/api/admin/seo/products/bulk/route');

      const request = createMockRequest(
        'PATCH',
        'http://localhost:3000/api/admin/seo/products/bulk',
        {
          updates: [
            {
              productId: 'a'.repeat(24),
              seo: {
                focusKeyword: 'gấu bông',
                seoTitle: 'Mua Gấu Bông Cao Cấp',
              },
            },
          ],
        }
      );

      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('updated');
    });

    it('should validate request body', async () => {
      const { PATCH } = await import('@/app/api/admin/seo/products/bulk/route');

      const request = createMockRequest(
        'PATCH',
        'http://localhost:3000/api/admin/seo/products/bulk',
        {
          updates: [], // Empty updates should fail
        }
      );

      const response = await PATCH(request as any);

      expect(response.status).toBe(400);
    });
  });

  describe('GET/PUT /api/admin/seo/settings', () => {
    it('should return SEO settings', async () => {
      mockSeoSettings.findOne.mockResolvedValue({
        _id: { toString: () => 'settings-1' },
        titleTemplate: '%title% | Shop Gấu Bông',
        organization: {
          name: 'Shop Gấu Bông',
          url: 'https://shop-gaubong.com',
        },
        updatedAt: new Date(),
      });

      const { GET } = await import('@/app/api/admin/seo/settings/route');

      const request = createMockRequest('GET', 'http://localhost:3000/api/admin/seo/settings');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('settings');
    });

    it('should update SEO settings', async () => {
      mockSeoSettings.findOneAndUpdate.mockResolvedValue({
        _id: { toString: () => 'settings-1' },
        titleTemplate: 'New Template | %sitename%',
        organization: {
          name: 'Updated Shop',
          url: 'https://new-shop.com',
        },
        updatedAt: new Date(),
      });

      const { PUT } = await import('@/app/api/admin/seo/settings/route');

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/admin/seo/settings',
        {
          titleTemplate: 'New Template | %sitename%',
          organization: {
            name: 'Updated Shop',
            url: 'https://new-shop.com',
          },
        }
      );

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('settings');
    });
  });

  describe('POST /api/admin/seo/audit', () => {
    it('should run audit for single product', async () => {
      mockProducts.findOne.mockResolvedValue({
        _id: { toString: () => 'prod-1' },
        name: 'Test Product With Good Title Length',
        slug: 'test-product',
        price: 100000,
        images: ['img.jpg'],
        shortDescription: 'Short description',
        seo: {
          focusKeyword: 'test product',
          seoTitle: 'Test Product With Good Title Length For SEO',
          seoDescription:
            'This is a good SEO description that is long enough to meet the minimum requirements for search engine optimization.',
        },
      });
      mockProducts.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const { POST } = await import('@/app/api/admin/seo/audit/route');

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/admin/seo/audit',
        {
          productId: 'a'.repeat(24),
        }
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('audit');
      expect(data.audit).toHaveProperty('score');
      expect(data.audit).toHaveProperty('issues');
      expect(data.audit).toHaveProperty('passed');
    });
  });

  describe('Redirects API', () => {
    describe('GET /api/admin/seo/redirects', () => {
      it('should return paginated redirects', async () => {
        const mockRedirects = [
          {
            _id: { toString: () => 'redirect-1' },
            source: '/old-url',
            destination: '/new-url',
            type: 301,
            enabled: true,
            hitCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockSeoRedirects.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockRedirects),
              }),
            }),
          }),
        });
        mockSeoRedirects.countDocuments.mockResolvedValue(1);

        const { GET } = await import('@/app/api/admin/seo/redirects/route');

        const request = createMockRequest('GET', 'http://localhost:3000/api/admin/seo/redirects');
        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('redirects');
        expect(data).toHaveProperty('total');
      });
    });

    describe('POST /api/admin/seo/redirects', () => {
      it('should create a new redirect', async () => {
        mockSeoRedirects.findOne.mockResolvedValue(null); // No existing redirect
        mockSeoRedirects.insertOne.mockResolvedValue({
          insertedId: { toString: () => 'new-redirect-id' },
        });

        const { POST } = await import('@/app/api/admin/seo/redirects/route');

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/admin/seo/redirects',
          {
            source: '/old-product',
            destination: '/new-product',
            type: 301,
            enabled: true,
          }
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('redirect');
      });

      it('should reject duplicate source', async () => {
        mockSeoRedirects.findOne.mockResolvedValue({
          _id: { toString: () => 'existing' },
          source: '/old-product',
        });

        const { POST } = await import('@/app/api/admin/seo/redirects/route');

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/admin/seo/redirects',
          {
            source: '/old-product',
            destination: '/new-product',
            type: 301,
          }
        );

        const response = await POST(request as any);

        // Duplicate source returns 409 Conflict
        expect(response.status).toBe(409);
      });
    });
  });
});
