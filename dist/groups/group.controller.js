"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const add_holding_dto_1 = require("./add_holding.dto");
const create_group_dto_1 = require("./create_group.dto");
const group_service_1 = require("./group.service");
const holding_service_1 = require("../holdings/holding.service");
const user_service_1 = require("../user/user.service");
const delete_holding_dto_1 = require("./delete_holding.dto");
const delete_group_dto_1 = require("./delete_group.dto");
let GroupController = class GroupController {
    constructor(groupService, holdingService, userService) {
        this.groupService = groupService;
        this.holdingService = holdingService;
        this.userService = userService;
    }
    async getUserGroups(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authorized');
        }
        const userGroups = await this.groupService.findFullGroupsByUserId(userId);
        for (const group of userGroups) {
            const groupHoldings = await this.holdingService.findHoldingsByGroupId(group.id);
            await this.groupService.updateGroupTotals(group, groupHoldings);
        }
        const updatedGroups = await this.groupService.findFullGroupsByUserId(userId);
        return updatedGroups;
    }
    async getGroupHoldings(req, groupName) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, groupName);
        const holdings = await this.holdingService.findHoldingsByGroupId(group.id);
        const sanitizedData = holdings.map(({ id, user, ...rest }) => rest);
        return sanitizedData;
    }
    async createUserGroup(req, createGroupDto) {
        if (createGroupDto.groupName === "All") {
            throw new common_1.BadRequestException('Cannot create a group with that name');
        }
        const userId = req.user.userId;
        const user = await this.userService.findUserById(userId);
        if (!user) {
            console.log('User not found');
            throw new common_1.UnauthorizedException('User not found');
        }
        const groupExists = await this.groupService.findFullGroupByUserIdAndName(userId, createGroupDto.groupName);
        if (groupExists) {
            console.log('Group exists');
            throw new common_1.BadRequestException('Group with that name already exists');
        }
        await this.groupService.createGroupForUser(user, createGroupDto.groupName);
        const groupList = await this.groupService.findFullGroupsByUserId(userId);
        if (groupList.length === 0) {
            throw new common_1.BadRequestException('Failed to fetch groups, group created succesfully');
        }
        return groupList;
    }
    async addHoldingToGroup(req, addHoldingDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authorized');
        }
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, addHoldingDto.mintAddress);
        if (!holding) {
            throw new common_1.BadRequestException('Holding not found');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, addHoldingDto.groupName);
        if (!group) {
            throw new common_1.BadRequestException('Group not found');
        }
        await this.holdingService.addHoldingToGroup(group, holding);
        await this.groupService.updateGroupOnHoldingAdded(group, holding);
        const userGroups = await this.groupService.findFullGroupsByUserId(userId);
        return userGroups;
    }
    async deleteHoldingFromGroup(req, deleteHoldingDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, deleteHoldingDto.groupName);
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, deleteHoldingDto.mintAddress);
        await this.holdingService.deleteHoldingFromGroup(holding);
        const updatedGroups = await this.groupService.findFullGroupsByUserId(userId);
        return updatedGroups;
    }
    async deleteGroup(req, deleteGroupDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authorized');
        }
        const group = await this.groupService.findFullGroupByUserIdAndName(userId, deleteGroupDto.groupName);
        await this.groupService.deleteGroup(group);
        const userGroups = await this.groupService.findFullGroupsByUserId(userId);
        return userGroups;
    }
};
exports.GroupController = GroupController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user-groups'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getUserGroups", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('group-holdings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('groupName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getGroupHoldings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-group'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "createUserGroup", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('add-to-group'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_holding_dto_1.AddHoldingDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "addHoldingToGroup", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('delete-group-holding'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delete_holding_dto_1.DeleteHoldingDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "deleteHoldingFromGroup", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('delete-group'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delete_group_dto_1.DeleteGroupDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "deleteGroup", null);
exports.GroupController = GroupController = __decorate([
    (0, common_1.Controller)('groups'),
    __metadata("design:paramtypes", [group_service_1.GroupService,
        holding_service_1.HoldingService,
        user_service_1.UserService])
], GroupController);
//# sourceMappingURL=group.controller.js.map