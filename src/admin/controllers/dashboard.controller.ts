import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from 'mongoose';
import {
  SoulSpace,
  SoulSpaceDocument,
} from '../../soul-space/entities/soul-space.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Session } from '../../game-session/entities/session.entity';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(SoulSpace.name)
    private readonly soulSpaceModel: Model<SoulSpaceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session & Document>,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async stats() {
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => (u as any).isActive).length;

    // Real counts: categories are SoulSpaces, content items = total vibes across all SoulSpaces
    const totalCategories = await this.soulSpaceModel.countDocuments();
    const agg = await this.soulSpaceModel.aggregate([
      { $project: { vibesCount: { $size: { $ifNull: ['$vibes', []] } } } },
      { $group: { _id: null, total: { $sum: '$vibesCount' } } },
    ]);
    const totalContentItems = (agg && agg[0] && agg[0].total) || 0;

    return {
      success: true,
      data: { totalUsers, activeUsers, totalCategories, totalContentItems },
    };
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get user growth time series' })
  @ApiResponse({ status: 200, description: 'Time series data for user growth' })
  async growth(@Query('range') range: string = 'daily') {
    const now = new Date();

    let labels: string[] = [];
    let aggPipeline: any[] = [];

    if (range === 'weekly') {
      const weeks = 8;
      const start = new Date();
      start.setDate(now.getDate() - (weeks - 1) * 7);

      labels = [];
      for (let i = 0; i < weeks; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i * 7);
        const year = d.getFullYear();
        const week = Math.ceil(
          ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
            new Date(year, 0, 1).getDay() +
            1) /
            7,
        );
        labels.push(`${year}-W${week}`);
      }

      aggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$createdAt' },
              week: { $isoWeek: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ];
    } else if (range === 'monthly') {
      const months = 12;
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1),
        1,
      );
      labels = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        labels.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        );
      }

      aggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
    } else {
      // daily
      const days = 7;
      const start = new Date();
      start.setDate(now.getDate() - (days - 1));
      labels = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        labels.push(d.toISOString().slice(0, 10));
      }

      aggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
    }

    const agg = await this.userModel.aggregate(aggPipeline).exec();

    // Normalize results into series aligned to labels
    const countsMap: Record<string, number> = {};
    if (Array.isArray(agg)) {
      for (const row of agg) {
        if (row._id && row.count !== undefined) {
          // For weekly grouped by {year, week}
          if (row._id.year !== undefined && row._id.week !== undefined) {
            countsMap[`${row._id.year}-W${row._id.week}`] = row.count;
          } else {
            countsMap[String(row._id)] = row.count;
          }
        }
      }
    }

    const series = labels.map((label) => ({
      label,
      count: countsMap[label] || 0,
    }));

    return { success: true, data: { range, series } };
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Get engagement metrics' })
  @ApiResponse({
    status: 200,
    description: 'Engagement metrics for the requested range',
  })
  async engagement(@Query('range') range: string = 'daily') {
    const now = new Date();

    let start: Date;
    let labels: string[] = [];

    if (range === 'weekly') {
      const weeks = 8;
      start = new Date();
      start.setDate(now.getDate() - (weeks - 1) * 7);
      for (let i = 0; i < weeks; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i * 7);
        const year = d.getFullYear();
        const week = Math.ceil(
          ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
            new Date(year, 0, 1).getDay() +
            1) /
            7,
        );
        labels.push(`${year}-W${week}`);
      }
    } else if (range === 'monthly') {
      const months = 12;
      start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      for (let i = 0; i < months; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        labels.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        );
      }
    } else {
      // daily
      const days = 7;
      start = new Date();
      start.setDate(now.getDate() - (days - 1));
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        labels.push(d.toISOString().slice(0, 10));
      }
    }

    // Summary metrics over the range
    const summaryAgg = await this.sessionModel
      .aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] },
            },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
            },
            avgParticipants: {
              $avg: { $size: { $ifNull: ['$participants', []] } },
            },
            avgAnswersSubmitted: { $avg: '$answersSubmitted' },
          },
        },
      ])
      .exec();

    const summary = (summaryAgg && summaryAgg[0]) || {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      avgParticipants: 0,
      avgAnswersSubmitted: 0,
    };

    // Time-series: sessions started per label
    let seriesAggPipeline: any[] = [];
    if (range === 'weekly') {
      seriesAggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$createdAt' },
              week: { $isoWeek: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ];
    } else if (range === 'monthly') {
      seriesAggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
    } else {
      seriesAggPipeline = [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
    }

    const seriesAgg = await this.sessionModel
      .aggregate(seriesAggPipeline)
      .exec();

    const countsMap: Record<string, number> = {};
    if (Array.isArray(seriesAgg)) {
      for (const row of seriesAgg) {
        if (row._id && row.count !== undefined) {
          if (row._id.year !== undefined && row._id.week !== undefined) {
            countsMap[`${row._id.year}-W${row._id.week}`] = row.count;
          } else {
            countsMap[String(row._id)] = row.count;
          }
        }
      }
    }

    const series = labels.map((label) => ({
      label,
      count: countsMap[label] || 0,
    }));

    return {
      success: true,
      data: {
        range,
        summary: {
          totalSessions: summary.totalSessions || 0,
          activeSessions: summary.activeSessions || 0,
          completedSessions: summary.completedSessions || 0,
          avgParticipants: Number((summary.avgParticipants || 0).toFixed(2)),
          avgAnswersSubmitted: Number(
            (summary.avgAnswersSubmitted || 0).toFixed(2),
          ),
        },
        series,
      },
    };
  }
}
