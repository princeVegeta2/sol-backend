import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllUsers(): Promise<import("../user/user.entity").User[]>;
    getAllHoldings(userId?: number, mintAddress?: string): Promise<import("../holdings/holding.entity").Holding[]>;
    getAllEntries(userId?: number, mintAddress?: string): Promise<void | import("../entries/entry.entity").Entry[]>;
    getAllExits(userId?: number, mintAddress?: string): Promise<import("../exits/exit.entity").Exit[]>;
    getAllBalances(userId?: number): Promise<void | import("../balance/sol_balance.entity").SolBalance[]>;
    getAllStats(userId?: number): Promise<import("../stats/stats.entity").Stat | import("../stats/stats.entity").Stat[]>;
    deleteHoldings(userId?: number, mintAddress?: string): Promise<void>;
    deleteEntries(userId?: number, mintAddress?: string): Promise<void>;
    deleteExits(userId?: number, mintAddress?: string): Promise<void>;
    deleteBalanceByUserId(userId: number): Promise<void>;
    deleteStatByUserId(userId: number): Promise<void>;
}
