import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SoulSpace, SoulSpaceDocument } from './entities/soul-space.entity';
import { CreateSoulSpaceDto } from './dto/create-soul-space.dto';
import { UpdateSoulSpaceDto } from './dto/update-soul-space.dto';
import { BulkCreateSoulSpaceDto } from './dto/bulk-create-soul-space.dto';

@Injectable()
export class SoulSpaceService {
  constructor(
    @InjectModel(SoulSpace.name)
    private soulSpaceModel: Model<SoulSpaceDocument>,
  ) {}

  async create(createSoulSpaceDto: CreateSoulSpaceDto): Promise<SoulSpace> {
    const createdSoulSpace = new this.soulSpaceModel(createSoulSpaceDto);
    return createdSoulSpace.save();
  }

  async bulkCreate(bulkCreateDto: BulkCreateSoulSpaceDto): Promise<SoulSpace[]> {
    return this.soulSpaceModel.insertMany(bulkCreateDto.data);
  }

  async findAll(): Promise<SoulSpace[]> {
    return this.soulSpaceModel.find().exec();
  }

  async findOne(id: string): Promise<SoulSpace> {
    const soulSpace = await this.soulSpaceModel.findById(id).exec();
    if (!soulSpace) {
      throw new NotFoundException(`SoulSpace with ID "${id}" not found`);
    }
    return soulSpace;
  }

  async update(
    id: string,
    updateSoulSpaceDto: UpdateSoulSpaceDto,
  ): Promise<SoulSpace> {
    const existingSoulSpace = await this.soulSpaceModel
      .findByIdAndUpdate(id, updateSoulSpaceDto, { new: true })
      .exec();
    if (!existingSoulSpace) {
      throw new NotFoundException(`SoulSpace with ID "${id}" not found`);
    }
    return existingSoulSpace;
  }

  async remove(id: string): Promise<void> {
    const result = await this.soulSpaceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`SoulSpace with ID "${id}" not found`);
    }
  }
}
