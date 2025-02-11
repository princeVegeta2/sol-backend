import { Controller, Get, Post, Delete, Body, UseGuards, Request, Query, BadGatewayException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddHoldingDto } from './add_holding.dto';
import { CreateGroupDto } from './create_group.dto';
import { GroupService } from './group.service';
import { HoldingService } from 'src/holdings/holding.service';
import { UserService } from 'src/user/user.service';
import { notContains } from 'class-validator';
import { DeleteHoldingDto } from './delete_holding.dto';
import { DeleteGroupDto } from './delete_group.dto';

@Controller('groups')
export class GroupController {
    constructor(
        private readonly groupService: GroupService,
        private readonly holdingService: HoldingService,
        private readonly userService: UserService,
    ) {}

    // Call on mount
    @UseGuards(JwtAuthGuard)
    @Get('user-groups')
    async getUserGroups(@Request() req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException('User not authorized');
        }

        // Find all groups for that user
        const userGroups =  await this.groupService.findFullGroupsByUserId(userId);

        // Update group stats
        for (const group of userGroups) {
            const groupHoldings = await this.holdingService.findHoldingsByGroupId(group.id);
            await this.groupService.updateGroupTotals(group, groupHoldings);
        }
        // Return updated groups
        const updatedGroups = await this.groupService.findFullGroupsByUserId(userId);
        return updatedGroups;
    }

    @UseGuards(JwtAuthGuard)
    @Get('group-holdings')
    async getGroupHoldings(@Request() req, @Query('groupName') groupName: string) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, groupName);

        const holdings = await this.holdingService.findHoldingsByGroupId(group.id);
        const sanitizedData = holdings.map(( {id, user, ...rest} ) => rest);

        return sanitizedData;
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-group')
    async createUserGroup(@Request() req, @Body() createGroupDto: CreateGroupDto) {
        if (createGroupDto.groupName === "All") {
            throw new BadRequestException('Cannot create a group with that name');
        }
        const userId = req.user.userId;
        const user = await this.userService.findUserById(userId);
        if (!user) {
            console.log('User not found');
            throw new UnauthorizedException('User not found');
        }
        // Check if group name already exists for that user
        const groupExists = await this.groupService.findFullGroupByUserIdAndName(userId, createGroupDto.groupName);
        if (groupExists) {
            console.log('Group exists');
            throw new BadRequestException('Group with that name already exists');
        }
        await this.groupService.createGroupForUser(user, createGroupDto.groupName);
        const groupList = await this.groupService.findFullGroupsByUserId(userId);
        if (groupList.length === 0) {
            throw new BadRequestException('Failed to fetch groups, group created succesfully');
        }
        return groupList;
    }

    @UseGuards(JwtAuthGuard)
    @Post('add-to-group')
    async addHoldingToGroup(@Request() req, @Body() addHoldingDto: AddHoldingDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException('User not authorized');
        }

        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, addHoldingDto.mintAddress);
        if (!holding) {
            throw new BadRequestException('Holding not found');
        }

        const group = await this.groupService.findFullGroupByUserIdAndName(userId, addHoldingDto.groupName);
        if (!group) {
            throw new BadRequestException('Group not found');
        }

        await this.holdingService.addHoldingToGroup(group, holding);
        await this.groupService.updateGroupOnHoldingAdded(group, holding);
        // Finally return all groups again
        const userGroups = await this.groupService.findFullGroupsByUserId(userId);
        return userGroups;
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete-group-holding')
    async deleteHoldingFromGroup(@Request() req, @Body() deleteHoldingDto: DeleteHoldingDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, deleteHoldingDto.groupName);
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, deleteHoldingDto.mintAddress);

        await this.holdingService.deleteHoldingFromGroup(holding);
        const updatedGroups = await this.groupService.findFullGroupsByUserId(userId);
        return updatedGroups;
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete-group')
    async deleteGroup(@Request() req, @Body() deleteGroupDto: DeleteGroupDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, deleteGroupDto.groupName);
        await this.groupService.deleteGroup(group);
        const userGroups = await this.groupService.findFullGroupsByUserId(userId);
        return userGroups;
    }

}