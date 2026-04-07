import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { UuidValidationPipe } from "./uuid-validation.pipe";

describe("UuidValidationPipe", () => {
  let pipe: UuidValidationPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UuidValidationPipe],
    }).compile();

    pipe = module.get<UuidValidationPipe>(UuidValidationPipe);
  });

  it("should be defined", () => {
    expect(pipe).toBeDefined();
  });

  describe("transform", () => {
    it("should pass valid UUID v4", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const metadata = { type: "param" } as any;

      const result = pipe.transform(validUuid, metadata);

      expect(result).toBe(validUuid);
    });

    it("should pass valid UUID with different version", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const metadata = { type: "param" } as any;

      const result = pipe.transform(validUuid, metadata);

      expect(result).toBe(validUuid);
    });

    it("should throw BadRequestException for invalid UUID", () => {
      const invalidUuid = "not-a-uuid";
      const metadata = { type: "param" } as any;

      expect(() => pipe.transform(invalidUuid, metadata)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for malformed UUID", () => {
      const malformedUuid = "550e8400-e29b-41d4-a716";
      const metadata = { type: "param" } as any;

      expect(() => pipe.transform(malformedUuid, metadata)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for UUID with wrong format", () => {
      const wrongFormat = "550e8400e29b41d4a716446655440000";
      const metadata = { type: "param" } as any;

      expect(() => pipe.transform(wrongFormat, metadata)).toThrow(
        BadRequestException,
      );
    });

    it("should pass empty string", () => {
      const metadata = { type: "param" } as any;

      const result = pipe.transform("", metadata);

      expect(result).toBe("");
    });

    it("should pass undefined value", () => {
      const metadata = { type: "param" } as any;

      const result = pipe.transform(undefined, metadata);

      expect(result).toBeUndefined();
    });

    it("should pass null value", () => {
      const metadata = { type: "param" } as any;

      const result = pipe.transform(null, metadata);

      expect(result).toBeNull();
    });

    it("should not validate for query parameters", () => {
      const invalidUuid = "not-a-uuid";
      const metadata = { type: "query" } as any;

      const result = pipe.transform(invalidUuid, metadata);

      expect(result).toBe(invalidUuid);
    });

    it("should not validate for body parameters", () => {
      const invalidUuid = "not-a-uuid";
      const metadata = { type: "body" } as any;

      const result = pipe.transform(invalidUuid, metadata);

      expect(result).toBe(invalidUuid);
    });

    it("should include invalid value in error message", () => {
      const invalidUuid = "bad-value";
      const metadata = { type: "param" } as any;

      try {
        pipe.transform(invalidUuid, metadata);
        fail("should have thrown");
      } catch (error) {
        expect((error as BadRequestException).message).toContain(
          "bad-value",
        );
      }
    });

    it("should handle UUID with uppercase letters", () => {
      const uppercaseUuid = "550E8400-E29B-41D4-A716-446655440000";
      const metadata = { type: "param" } as any;

      const result = pipe.transform(uppercaseUuid, metadata);

      expect(result).toBe(uppercaseUuid);
    });

    it("should handle UUID with mixed case", () => {
      const mixedCaseUuid = "550E8400-e29b-41D4-a716-446655440000";
      const metadata = { type: "param" } as any;

      const result = pipe.transform(mixedCaseUuid, metadata);

      expect(result).toBe(mixedCaseUuid);
    });
  });
});
