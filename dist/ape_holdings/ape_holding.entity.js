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
exports.ApeHolding = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let ApeHolding = class ApeHolding {
};
exports.ApeHolding = ApeHolding;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ApeHolding.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ApeHolding.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mint_address', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ApeHolding.prototype, "mintAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 6, nullable: false }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 12, nullable: false }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 12, nullable: false }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "average_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "value_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "value_sol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 30, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ApeHolding.prototype, "pnl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ApeHolding.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ApeHolding.prototype, "updatedAt", void 0);
exports.ApeHolding = ApeHolding = __decorate([
    (0, typeorm_1.Entity)('ape_holdings')
], ApeHolding);
//# sourceMappingURL=ape_holding.entity.js.map