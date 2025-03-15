import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApeHolding } from "./ape_holding.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class ApeHoldingService {
    constructor(
        @InjectRepository(ApeHolding)
        private apeHoldingRepository: Repository<ApeHolding>,
    ) { }

    async createApeHolding(apeHoldingData: {
        user: User,
        mintAddress: string;
        amount: number;
        price: number;
        average_price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
    }): Promise<ApeHolding> {
        const newApeHolding = this.apeHoldingRepository.create(apeHoldingData);
        return this.apeHoldingRepository.save(newApeHolding);
    }

    async findApeHoldingsByUserId(userId: number): Promise<ApeHolding[] | null> {
        const result = await this.apeHoldingRepository.find({
            where: { user: { id: userId } }, // TypeORM automatically joins user_id
        });
    
        result.forEach((holding) => {
            console.log(`Holding ${holding.mintAddress} fetched`); // Will now work
        });
        return result;
    }
    
    

    async findApeHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeHolding | null> {
        const query = `
            SELECT *
            FROM ape_holdings
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.apeHoldingRepository.query(query, [userId, mintAddress]);
        return result[0] || null;
    }

    async updateApeHoldingEntry(
        holding: ApeHolding,
        amount: number,       // newly purchased tokens (purchaseAmount)
        price: number,        // new price for those tokens
        newUsdValue: number | string,
        newSolValue: number | string,
        additionalUsdValue: number | string,
        additionalSolValue: number | string,
    ): Promise<ApeHolding> {
        // Convert to float to avoid TypeORM string issues
        console.log("Parsing holdingAmount");
        const holdingAmount = parseFloat(holding.amount.toString());
        console.log("Parsing oldAvgPrice");
        const oldAvgPrice = parseFloat(holding.average_price?.toString() || '0');  // existing average price, default 0
        console.log("Parsing purchaseAmount");
        const purchaseAmount = parseFloat(amount.toString());

        // 1) Sum up total tokens
        const combinedAmount = holdingAmount + purchaseAmount;
        const roundedAmount = parseFloat(combinedAmount.toFixed(12)); // or keep more decimals if desired

        // 2) Recalculate average price (only if purchaseAmount > 0 and combinedAmount > 0)
        //    Weighted average cost approach:
        //    newAvgPrice = ((holdingAmount * oldAvgPrice) + (purchaseAmount * price)) / combinedAmount
        let newAvgPrice = oldAvgPrice;
        if (purchaseAmount > 0 && combinedAmount > 0) {
            const oldTotalCost = holdingAmount * oldAvgPrice;
            const newPurchaseCost = purchaseAmount * price;
            const totalCost = oldTotalCost + newPurchaseCost;
            newAvgPrice = totalCost / combinedAmount;
        }

        // Round or clamp the new average price to match DB scale if needed
        // e.g. if you have average_price: numeric(15,15), you might do:
        const roundedAvgPrice = parseFloat(newAvgPrice.toFixed(15));

        // 3) Convert the "value" inputs to numeric
        const oldUsdVal = Number(newUsdValue);
        const oldSolVal = Number(newSolValue);
        const addUsdVal = Number(additionalUsdValue);
        const addSolVal = Number(additionalSolValue);

        // 4) Combine old portion + new portion
        const finalUsdVal = oldUsdVal + addUsdVal;   // numeric sum
        const finalSolVal = oldSolVal + addSolVal;

        // 5) Round them to 4 decimal places to match your DB scale
        const roundedUsdValue = parseFloat(finalUsdVal.toFixed(4));
        const roundedSolValue = parseFloat(finalSolVal.toFixed(4));

        // 6) Assign back to holding
        try {
            holding.price = price;
        } catch (err) {
            throw new Error(`Failed to update holding price of ${holding.id}. Error: ${err}`)
        }
        holding.amount = roundedAmount;
        holding.value_usd = roundedUsdValue;
        holding.value_sol = roundedSolValue;
        holding.average_price = roundedAvgPrice;  // store the new average cost in USD

        return this.apeHoldingRepository.save(holding);
    }

    async updateApeHoldingExit(
        holding: ApeHolding,
        amount: number,
        oldUsdValue: number,
        oldSolValue: number,
        subtractedUsdValue: number,
        subtractedSolValue: number
    ): Promise<ApeHolding> {
        // 1. Convert to float
        const holdingAmount = parseFloat(holding.amount.toString());
        const exitAmount = parseFloat(amount.toString());

        // 2. Subtract token amounts
        const combinedAmount = holdingAmount - exitAmount;
        const finalAmount = parseFloat(combinedAmount.toFixed(12));

        // 3. Convert "value" inputs to float
        const oldUsd = parseFloat(oldUsdValue.toString());
        const oldSol = parseFloat(oldSolValue.toString());
        const subtractUsd = parseFloat(subtractedUsdValue.toString());
        const subtractSol = parseFloat(subtractedSolValue.toString());

        // 4. Numeric addition (or subtraction) => leftover
        const leftoverUsd = oldUsd - subtractUsd;
        const leftoverSol = oldSol - subtractSol;

        // 5. Round them => valid decimal strings
        const finalUsd = parseFloat(leftoverUsd.toFixed(4));
        const finalSol = parseFloat(leftoverSol.toFixed(4));

        holding.amount = finalAmount;
        holding.value_usd = finalUsd;
        holding.value_sol = finalSol;

        // average_price doesn't change for partial sells in average-cost approach
        // holding.average_price = holding.average_price;

        return this.apeHoldingRepository.save(holding);
    }

    async updateApeHoldingPrice(holding: ApeHolding, price: number, solPrice: number): Promise<ApeHolding> {
        const usdValue = holding.amount * price;
        holding.price = price;
        holding.value_usd = usdValue;
        holding.value_sol = usdValue / solPrice;
        return this.apeHoldingRepository.save(holding);
    }

    async updateApeHoldingPnl(holding: ApeHolding, newMarketPrice: number): Promise<ApeHolding> {
        // "average_price" is the user’s cost basis, previously computed 
        // when they bought tokens. We do NOT change it on a price refresh.

        const costBasis = parseFloat(holding.average_price.toString()); // cost basis
        const holdingAmount = parseFloat(holding.amount.toString());    // how many tokens the user currently holds

        // PnL = (marketPrice - costBasis) * amount
        const newPnL = (newMarketPrice - costBasis) * holdingAmount;

        // Optionally clamp to 4 decimals to match DB scale
        holding.pnl = parseFloat(newPnL.toFixed(4));

        return this.apeHoldingRepository.save(holding);
    }

    async deleteApeHolding(holding: ApeHolding): Promise<void> {
        await this.apeHoldingRepository.remove(holding);
    }

    async calculateApeHoldingsValueByUserId(userId: number): Promise<{ apeHoldingsSolValue: number, apeHoldingsUsdValue: number }> {
        const holdings = await this.findApeHoldingsByUserId(userId);
        const apeHoldingsSolValue = holdings.reduce((acc, holding) => {
            const val = typeof holding.value_sol === 'string'
              ? parseFloat(holding.value_sol) : holding.value_sol;
            return acc + val;
          }, 0);
          
        const apeHoldingsUsdValue = holdings.reduce((acc, holding) => {
            const val = typeof holding.value_usd === 'string'
              ? parseFloat(holding.value_usd) : holding.value_usd;
            return acc + val;
          }, 0);

        return({
            apeHoldingsSolValue,
            apeHoldingsUsdValue
        });
    }
}