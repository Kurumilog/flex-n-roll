import { validate } from "class-validator";
import { LoginDto } from "./login.dto";

describe("LoginDto Validation", () => {
  it("should pass with valid email and password", async () => {
    const dto = new LoginDto();
    dto.email = "test@example.com";
    dto.password = "password123";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with invalid email", async () => {
    const dto = new LoginDto();
    dto.email = "not-an-email";
    dto.password = "password123";

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("email");
  });

  it("should fail with empty email", async () => {
    const dto = new LoginDto();
    dto.email = "";
    dto.password = "password123";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("email");
  });

  it("should fail with password shorter than 6 characters", async () => {
    const dto = new LoginDto();
    dto.email = "test@example.com";
    dto.password = "12345";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("password");
  });

  it("should fail with non-string password", async () => {
    const dto = new LoginDto();
    dto.email = "test@example.com";
    dto.password = 123456 as any;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass with minimum password length (6 chars)", async () => {
    const dto = new LoginDto();
    dto.email = "test@example.com";
    dto.password = "123456";

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("should fail with missing email", async () => {
    const dto = new LoginDto();
    dto.password = "password123";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail with missing password", async () => {
    const dto = new LoginDto();
    dto.email = "test@example.com";

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should accept valid email with various formats", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.com",
      "user@subdomain.example.com",
    ];

    for (const email of validEmails) {
      const dto = new LoginDto();
      dto.email = email;
      dto.password = "password123";

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });
});
