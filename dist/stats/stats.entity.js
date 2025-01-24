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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stat = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let Stat = class Stat {
};
exports.Stat = Stat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Stat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Stat.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_purchased', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "tokens_purchased", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_entries', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "total_entries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_exits', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "total_exits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_holdings', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "current_holdings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "total_pnl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "unrealized_pnl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "realized_pnl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Stat.prototype, "winrate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Stat.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Stat.prototype, "updatedAt", void 0);
exports.Stat = Stat = __decorate([
    (0, typeorm_1.Entity)('stats')
], Stat);
//# sourceMappingURL=stats.entity.js.map