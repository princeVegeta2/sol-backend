export declare class SolanaService {
    private readonly connection;
    private readonly solMint;
    constructor();
    getTokenQuoteSolInput(outputMint: string, solAmount: number, slippage: number, price: number): Promise<any>;
    getTokenQuoteSolOutput(inputMint: string, tokenAmount: number, slippage: number): Promise<any>;
    getTokenQuoteSolInputTest(outputMint: string, solAmount: number, slippage: number): Promise<any>;
    getTokenQuoteSolOutputTest(inputMint: string, tokenAmount: number, slippage: number): Promise<any>;
    getTokenData(mintAddress: string): Promise<any>;
    getBulkTokenData(mintAddresses: string[]): Promise<any[]>;
    getTokenPrice(mintAddress: string): Promise<number>;
    getTokenSellPrice(mintAddress: string): Promise<number>;
    private getTokenMetadata;
}
