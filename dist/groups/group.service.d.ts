import { Repository } from "typeorm";
import { Group } from "./group.entity";
import { User } from "src/user/user.entity";
import { Holding } from "src/holdings/holding.entity";
export declare class GroupService {
    private groupRepository;
    constructor(groupRepository: Repository<Group>);
    createGroupForUser(user: User, name: string): Promise<Group>;
    findGroupsByUserId(userId: number): Promise<Partial<Group>[]>;
    findGroupByUserIdAndName(userId: number, name: string): Promise<Group>;
    findFullGroupByUserIdAndName(userId: number, name: string): Promise<Group>;
    findFullGroupsByUserId(userId: number): Promise<Group[]>;
    findAllGroups(): Promise<Group[]>;
    updateGroupOnHoldingAdded(group: Group, holding: Holding): Promise<void>;
    updateGroupTotals(group: Group, holdings: Holding[]): Promise<void>;
    deleteGroup(group: Group): Promise<void>;
}
