// @ts-nocheck
import request from 'supertest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('API - Listing Management', () => {
  const regularAgent = request.agent(BASE_URL);
  const ownerAgent = request.agent(BASE_URL);
  let createdListingId;

  const regularUser = {
    name: 'Regular User',
    email: `regular-${Date.now()}@example.com`,
    password: 'password123',
  };

  const ownerUser = {
    name: 'Owner User',
    email: `owner-${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    // Register and login regular user
    const regularRegisterRes = await regularAgent.post('/api/auth/register').send(regularUser);
    expect([200, 201]).toContain(regularRegisterRes.status);
    const regularLoginRes = await regularAgent.post('/api/auth/login').send({
      email: regularUser.email,
      password: regularUser.password,
    });
    regularUserCookie = regularLoginRes.headers['set-cookie'];

    // Register and login owner user
    await agent.post('/api/auth/register').send(ownerUser);
    const ownerLoginRes = await agent.post('/api/auth/login').send({
      email: ownerUser.email,
      password: ownerUser.password,
    });
    ownerUserCookie = ownerLoginRes.headers['set-cookie'];

    // Create a listing as the owner
    const listingData = {
      title: 'Test Listing for Deletion',
      listingType: 'Campsite',
      country: 'USA',
      city: 'Testville',
      address: '123 Test St',
    };
    const createListingRes = await agent
      .post('/api/listings')
      .set('Cookie', ownerUserCookie)
      .send(listingData);
    
    expect(createListingRes.status).toBe(201);
    createdListingId = createListingRes.body.data._id;
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should prevent a regular user from accessing an admin-only API route', async () => {
      const res = await agent
        .post('/api/admin/reviews/moderate')
        .set('Cookie', regularUserCookie)
        .send({ reviewId: 'some-review-id', action: 'approve' });

      expect(res.status).toBe(403);
    });
  });

  describe('Unauthorized Modification', () => {
    it('should prevent a regular user from deleting a listing they do not own', async () => {
      const res = await agent
        .delete(`/api/listings/${createdListingId}`)
        .set('Cookie', regularUserCookie);

      expect(res.status).toBe(403);
    });
  });
  
  afterAll(async () => {
    if (createdListingId) {
      try {
        await ownerAgent
          .delete(`/api/listings/${createdListingId}`)
          .set('Cookie', ownerUserCookie);
      } catch {
        // ignore cleanup failures
      }
    }
  });  });
