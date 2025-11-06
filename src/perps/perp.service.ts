import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Perp } from "./perp.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class PerpService {
    constructor(
        @InjectRepository(Perp)
        private PerpRepository: Repository<Perp>
    ) { }
}