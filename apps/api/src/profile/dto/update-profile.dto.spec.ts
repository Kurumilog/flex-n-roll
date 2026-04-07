import { validate } from "class-validator";
import { UpdateProfileDto } from "./update-profile.dto";

describe("UpdateProfileDto Validation", () => {
  it("should pass with empty object (all fields optional)", async () => {
    const dto = new UpdateProfileDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should pass with valid name", async () => {
    const dto = new UpdateProfileDto();
    dto.name = "Ivan Ivanov";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with empty string name", async () => {
    const dto = new UpdateProfileDto();
    dto.name = "";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("name");
  });

  it("should fail with non-string name", async () => {
    const dto = new UpdateProfileDto();
    dto.name = 123 as any;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass with valid department", async () => {
    const dto = new UpdateProfileDto();
    dto.department = "Sales";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with empty string department", async () => {
    const dto = new UpdateProfileDto();
    dto.department = "";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass with valid timezone", async () => {
    const dto = new UpdateProfileDto();
    dto.timezone = "Europe/Minsk";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should pass with valid bio", async () => {
    const dto = new UpdateProfileDto();
    dto.bio = "Experienced manager";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with bio exceeding 280 characters", async () => {
    const dto = new UpdateProfileDto();
    dto.bio = "a".repeat(281);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("bio");
  });

  it("should pass with bio exactly 280 characters", async () => {
    const dto = new UpdateProfileDto();
    dto.bio = "a".repeat(280);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should pass with all fields provided", async () => {
    const dto = new UpdateProfileDto();
    dto.name = "Ivan Ivanov";
    dto.department = "Marketing";
    dto.timezone = "Asia/Tokyo";
    dto.bio = "Short bio";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should allow partial updates", async () => {
    const dto = new UpdateProfileDto();
    dto.name = "New Name";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
