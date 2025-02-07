import { AddHoldingDto } from './add_holding.dto';
import { CreateGroupDto } from './create_group.dto';
import { GroupService } from './group.service';
import { HoldingService } from 'src/holdings/holding.service';
import { UserService } from 'src/user/user.service';
import { DeleteHoldingDto } from './delete_holding.dto';
import { DeleteGroupDto } from './delete_group.dto';
export declare class GroupController {
    private readonly groupService;
    private readonly holdingService;
    private readonly userService;
    constructor(groupService: GroupService, holdingService: HoldingService, userService: UserService);
    getUserGroups(req: any): Promise<import("./group.entity").Group[]>;
    getGroupHoldings(req: any, groupName: string): Promise<{
        mintAddress: string;
        amount: number;
        price: number;
        average_price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
        createdAt: Date;
        updatedAt: Date;
        group: import("./group.entity").Group;
    }[]>;
    createUserGroup(req: any, createGroupDto: CreateGroupDto): Promise<Partial<import("./group.entity").Group>[]>;
    addHoldingToGroup(req: any, addHoldingDto: AddHoldingDto): Promise<import("./group.entity").Group[]>;
    deleteHoldingFromGroup(req: any, deleteHoldingDto: DeleteHoldingDto): Promise<{
        messsage: string;
    }>;
    deleteGroup(req: any, deleteGroupDto: DeleteGroupDto): Promise<{
        message: string;
    }>;
}
