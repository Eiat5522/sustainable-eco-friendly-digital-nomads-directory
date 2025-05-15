import { Schema } from 'mongodb';

export const sessionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["sessionToken", "userId", "expires"],
      properties: {
        sessionToken: {
          bsonType: "string",
          description: "Session token must be a string and is required"
        },
        userId: {
          bsonType: "string",
          description: "User ID must be a string and is required"
        },
        expires: {
          bsonType: "date",
          description: "Expiry date must be a date and is required"
        },
        lastAccessed: {
          bsonType: "date",
          description: "Last accessed timestamp"
        },
        userAgent: {
          bsonType: "string",
          description: "User agent string from the client"
        },
        ipAddress: {
          bsonType: "string",
          description: "IP address of the client"
        }
      }
    }
  },
  indexes: [
    { key: { sessionToken: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { expires: 1 }, expireAfterSeconds: 0 }
  ]
};
