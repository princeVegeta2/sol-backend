import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Group } from "./group.entity";
import { User } from "src/user/user.entity";
import { Holding } from "src/holdings/holding.entity";

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(Group)
        private groupRepository: Repository<Group>,
    ) { }

    async createGroupForUser(user: User, name: string): Promise<Group> {
        const newGroup = this.groupRepository.create({
            user: user,
            name: name,
            value_usd: 0,
            value_sol: 0,
            pnl: 0,
        });

        return await this.groupRepository.save(newGroup);
    }

    async findGroupsByUserId(userId: number): Promise<Partial<Group>[]> {
        const query = `
            SELECT name, value_usd, value_sol, pnl, created_at, updated_at
            FROM groups
            WHERE user_id = $1
        `;

        const result = await this.groupRepository.query(query, [userId]);
        return result;
    }

    async findGroupByUserIdAndName(userId: number, name: string): Promise<Group> {
        const query = `
            SELECT * 
            FROM groups
            WHERE user_id = $1 AND name = $2
            `;

        const group = await this.groupRepository.query(query, [userId, name]);
        return group;
    }

    async findFullGroupByUserIdAndName(userId: number, name: string): Promise<Group> {
        return this.groupRepository.findOne({
            where: { user: { id: userId }, name: name },
            relations: ["user"],
        });
    }

    async findFullGroupsByUserId(userId: number): Promise<Group[]> {
        return this.groupRepository.find({
            where: { user: { id: userId } },
            relations: ["user"],
        });
    }

    async findAllGroups(): Promise<Group[]> {
        return this.groupRepository.find();
    }

    async updateGroupOnHoldingAdded(group: Group, holding: Holding): Promise<void> {
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

    async updateGroupTotals(group: Group, holdings: Holding[]): Promise<void> {
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

    async deleteGroup(group: Group): Promise<void> {
        await this.groupRepository.remove(group);
    }
}