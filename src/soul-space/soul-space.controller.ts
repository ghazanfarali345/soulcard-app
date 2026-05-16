import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SoulSpaceService } from './soul-space.service';
import { CreateSoulSpaceDto } from './dto/create-soul-space.dto';
import { UpdateSoulSpaceDto } from './dto/update-soul-space.dto';
import { BulkCreateSoulSpaceDto } from './dto/bulk-create-soul-space.dto';
import { SoulSpace } from './entities/soul-space.entity';

@ApiTags('Soul Spaces')
@ApiBearerAuth('access-token')
@Controller('soul-spaces')
export class SoulSpaceController {
  constructor(private readonly soulSpaceService: SoulSpaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new soul space' })
  @ApiResponse({ status: 201, description: 'The soul space has been successfully created.', type: SoulSpace })
  create(@Body() createSoulSpaceDto: CreateSoulSpaceDto) {
    return this.soulSpaceService.create(createSoulSpaceDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create multiple soul spaces' })
  @ApiResponse({ status: 201, description: 'The soul spaces have been successfully created.', type: [SoulSpace] })
  bulkCreate(@Body() bulkCreateDto: BulkCreateSoulSpaceDto) {
    return this.soulSpaceService.bulkCreate(bulkCreateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all soul spaces' })
  @ApiResponse({ status: 200, description: 'Return all soul spaces.', type: [SoulSpace] })
  findAll() {
    return this.soulSpaceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a soul space by id' })
  @ApiResponse({ status: 200, description: 'Return the soul space.', type: SoulSpace })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  findOne(@Param('id') id: string) {
    return this.soulSpaceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a soul space' })
  @ApiResponse({ status: 200, description: 'The soul space has been successfully updated.', type: SoulSpace })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  update(
    @Param('id') id: string,
    @Body() updateSoulSpaceDto: UpdateSoulSpaceDto,
  ) {
    return this.soulSpaceService.update(id, updateSoulSpaceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a soul space' })
  @ApiResponse({ status: 204, description: 'The soul space has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  remove(@Param('id') id: string) {
    return this.soulSpaceService.remove(id);
  }
}
