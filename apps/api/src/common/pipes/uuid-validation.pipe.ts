import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { isUUID } from "class-validator";

@Injectable()
export class UuidValidationPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === "param" && value && !isUUID(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }
    return value;
  }
}
