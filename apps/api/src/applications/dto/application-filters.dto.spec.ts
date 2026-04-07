import { validate } from "class-validator";
import { ApplicationFiltersDto } from "./application-filters.dto";
import { ApplicationIntent, ApplicationUrgency, ApplicationStatus } from "./create-application.dto";

describe("ApplicationFiltersDto Validation", () => {
  it("should pass with empty object (all fields optional)", async () => {
    const dto = new ApplicationFiltersDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should pass with valid intent filter", async () => {
    const dto = new ApplicationFiltersDto();
    dto.intent = ApplicationIntent.COMMERCIAL;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with invalid intent enum", async () => {
    const dto = new ApplicationFiltersDto();
    dto.intent = "invalid" as any;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("intent");
  });

  it("should pass with valid urgency filter", async () => {
    const dto = new ApplicationFiltersDto();
    dto.urgency = ApplicationUrgency.HIGH;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with invalid urgency enum", async () => {
    const dto = new ApplicationFiltersDto();
    dto.urgency = "invalid" as any;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("urgency");
  });

  it("should pass with valid status filter", async () => {
    const dto = new ApplicationFiltersDto();
    dto.status = ApplicationStatus.ASSIGNED;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with invalid status enum", async () => {
    const dto = new ApplicationFiltersDto();
    dto.status = "invalid" as any;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("status");
  });

  it("should pass with valid limit", async () => {
    const dto = new ApplicationFiltersDto();
    dto.limit = 10;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with limit less than 1", async () => {
    const dto = new ApplicationFiltersDto();
    dto.limit = 0;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("limit");
  });

  it("should fail with non-integer limit", async () => {
    const dto = new ApplicationFiltersDto();
    dto.limit = 10.5;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass with valid offset", async () => {
    const dto = new ApplicationFiltersDto();
    dto.offset = 20;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with negative offset", async () => {
    const dto = new ApplicationFiltersDto();
    dto.offset = -1;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("offset");
  });

  it("should fail with non-integer offset", async () => {
    const dto = new ApplicationFiltersDto();
    dto.offset = 10.5;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass with all filters combined", async () => {
    const dto = new ApplicationFiltersDto();
    dto.intent = ApplicationIntent.TECHNICAL;
    dto.urgency = ApplicationUrgency.HIGH;
    dto.status = ApplicationStatus.PROCESSING;
    dto.limit = 5;
    dto.offset = 10;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should have default limit of 20", () => {
    const dto = new ApplicationFiltersDto();

    expect(dto.limit).toBe(20);
  });

  it("should have default offset of 0", () => {
    const dto = new ApplicationFiltersDto();

    expect(dto.offset).toBe(0);
  });
});
