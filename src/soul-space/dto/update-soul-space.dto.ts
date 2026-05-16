import { PartialType } from '@nestjs/swagger';
import { CreateSoulSpaceDto } from './create-soul-space.dto';

export class UpdateSoulSpaceDto extends PartialType(CreateSoulSpaceDto) {}
