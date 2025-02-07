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
exports.GroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const group_entity_1 = require("./group.entity");
let GroupService = class GroupService {
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }
    async createGroupForUser(user, name) {
        const newGroup = this.groupRepository.create({
            user: user,
            name: name,
            value_usd: 0,
            value_sol: 0,
            pnl: 0,
        });
        return await this.groupRepository.save(newGroup);
    }
    async findGroupsByUserId(userId) {
        const query = `
            SELECT name, value_usd, value_sol, pnl, created_at, updated_at
            FROM groups
            WHERE user_id = $1
        `;
        const result = await this.groupRepository.query(query, [userId]);
        return result;
    }
    async findGroupByUserIdAndName(userId, name) {
        const query = `
            SELECT * 
            FROM groups
            WHERE user_id = $1 AND name = $2
            `;
        const group = await this.groupRepository.query(query, [userId, name]);
        return group;
    }
    async findFullGroupByUserIdAndName(userId, name) {
        return this.groupRepository.findOne({
            where: { user: { id: userId } },
            relations: ["user"],
        });
    }
    async findFullGroupsByUserId(userId) {
        return this.groupRepository.find({
            where: { user: { id: userId } },
            relations: ["user"],
        });
    }
    async findAllGroups() {
        return this.groupRepository.find();
    }
    async updateGroupOnHoldingAdded(group, holding) {
        const groupValueUsd = parseFloat(group.value_usd.toString() || '0');
        const groupValueSol = parseFloat(group.value_sol.toString() || '0');
        const groupPnl = parseFloat(group.pnl.toString() || '0');
        const holdingValueUsd = parseFloat(holding.value_usd.toString() || '0');
        const holdingValueSol = parseFloat(holding.value_sol.toString() || '0');
        const holdingPnl = parseFloat(holding.pnl.toString() || '0');
        const newGroupValueUsd = groupValueUsd + holdingValueUsd;
        const newGroupValueSol = groupValueSol + holdingValueSol;
        const newGroupPnl = groupPnl + holdingPnl;
        const roundedGroupValueUsd = parseFloat(newGroupValueUsd.toFixed(4));
        const roundedGroupValueSol = parseFloat(newGroupValueSol.toFixed(4));
        const roundedGroupPnl = parseFloat(newGroupPnl.toFixed(4));
        group.value_usd = roundedGroupValueUsd;
        group.value_sol = roundedGroupValueSol;
        group.pnl = roundedGroupPnl;
        await this.groupRepository.save(group);
    }
    async updateGroupTotals(group, holdings) {
        const totalValueUsd = holdings.reduce((sum, holding) => sum + Number(holding.value_usd || 0), 0);
        const totalValueSol = holdings.reduce((sum, holding) => sum + Number(holding.value_sol || 0), 0);
        const totalPnl = holdings.reduce((sum, holding) => sum + Number(holding.pnl || 0), 0);
        const roundedValueUsd = parseFloat(totalValueUsd.toFixed(4));
        const roundedValueSol = parseFloat(totalValueSol.toFixed(4));
        const roundedPnl = parseFloat(totalPnl.toFixed(4));
        group.value_usd = roundedValueUsd;
        group.value_sol = roundedValueSol;
        group.pnl = roundedPnl;
        await this.groupRepository.save(group);
    }
    async deleteGroup(group) {
        await this.groupRepository.remove(group);
    }
};
exports.GroupService = GroupService;
exports.GroupService = GroupService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GroupService);
//# sourceMappingURL=group.service.js.map