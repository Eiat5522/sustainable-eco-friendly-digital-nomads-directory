// Add this right at the top
import { Request } from "node-fetch";

if (typeof global.Request === "undefined") {
	(global as any).Request = Request;
}

// NextRequest needs this defined before next/server is imported
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { client } from "@/lib/sanity/client";
import { POST } from "../route";

// Mock auth module completely to avoid mongodb-adapter error
jest.mock("@/lib/auth", () => ({
	authOptions: {},
}));

jest.mock("@/lib/sanity/client", () => ({
	client: {
		patch: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		commit: jest.fn(),
		delete: jest.fn(),
		fetch: jest.fn(),
		create: jest.fn(),
	},
}));

jest.mock("next-auth/next", () => ({
	getServerSession: jest.fn(),
}));

// We'll mock NextRequest directly so we don't have to deal with the polyfill issues in Jest
jest.mock("next/server", () => {
	return {
		NextRequest: class MockNextRequest {
			private body: any;
			constructor(_url: string, init: any) {
				this.body = init.body ? JSON.parse(init.body) : {};
			}
			async json() {
				return this.body;
			}
		},
		NextResponse: {
			json: (body: any, init?: any) => ({
				status: init?.status || 200,
				json: async () => body,
			}),
		},
	};
});

describe("Bulk Operations API - Delete", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Mock admin session
		(getServerSession as jest.Mock).mockResolvedValue({
			user: { id: "admin-id", role: "admin" },
		});
	});

	it("processes hard deletes concurrently", async () => {
		const itemIds = ["id-1", "id-2", "id-3"];

		(client.delete as jest.Mock).mockImplementation(async (_id) => {
			return new Promise((resolve) => setTimeout(() => resolve(true), 10));
		});

		const req = new NextRequest(
			"http://localhost:3000/api/admin/bulk-operations",
			{
				method: "POST",
				body: JSON.stringify({
					operation: "delete",
					itemType: "listing",
					itemIds,
					softDelete: false,
					reason: "Test reason",
				}),
			},
		);

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.processed).toBe(3);
		expect(data.data.results).toHaveLength(3);

		expect(client.delete).toHaveBeenCalledTimes(3);
		expect(client.delete).toHaveBeenCalledWith("id-1");
		expect(client.delete).toHaveBeenCalledWith("id-2");
		expect(client.delete).toHaveBeenCalledWith("id-3");
	});

	it("handles partial failures correctly in concurrent deletes", async () => {
		const itemIds = ["id-1", "id-2", "id-3"];

		(client.delete as jest.Mock).mockImplementation(async (id) => {
			if (id === "id-2") {
				throw new Error("Deletion failed for id-2");
			}
			return true;
		});

		const req = new NextRequest(
			"http://localhost:3000/api/admin/bulk-operations",
			{
				method: "POST",
				body: JSON.stringify({
					operation: "delete",
					itemType: "listing",
					itemIds,
					softDelete: false,
					reason: "Test reason",
				}),
			},
		);

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.processed).toBe(2);
		expect(data.data.failed).toBe(1);
		expect(data.data.results).toHaveLength(2);
		expect(data.data.errors).toHaveLength(1);
		expect(data.data.errors[0].itemId).toBe("id-2");
		expect(data.data.errors[0].error).toBe("Deletion failed for id-2");
	});

	it("processes soft deletes concurrently", async () => {
		const itemIds = ["id-1", "id-2"];

		const req = new NextRequest(
			"http://localhost:3000/api/admin/bulk-operations",
			{
				method: "POST",
				body: JSON.stringify({
					operation: "delete",
					itemType: "listing",
					itemIds,
					softDelete: true,
					reason: "Test reason",
				}),
			},
		);

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.processed).toBe(2);

		expect(client.patch).toHaveBeenCalledTimes(2);
		expect(client.set).toHaveBeenCalledTimes(2);
		expect(client.commit).toHaveBeenCalledTimes(2);
	});
});
