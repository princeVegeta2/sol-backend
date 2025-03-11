export declare class SolanaService {
    private readonly connection;
    private readonly solMint;
    private readonly rpcUrl;
    constructor();
    getTokenQuoteSolInput(outputMint: string, solAmount: number, slippage: number, outputTokenUsdPrice: number): Promise<any>;
    getTokenQuoteSolOutput(inputMint: string, tokenAmount: number, slippage: number): Promise<any>;
    getTokenQuoteSolInputTest(outputMint: string, solAmount: number, slippage: number): Promise<any>;
    getTokenQuoteSolOutputTest(inputMint: string, tokenAmount: number, slippage: number): Promise<any>;
    getTokenData(mintAddress: string): Promise<any>;
    getBulkTokenData(mintAddresses: string[]): Promise<any[]>;
    getTokenPrice(mintAddress: string): Promise<number>;
    getTokenSellPrice(mintAddress: string): Promise<number>;
    private getTokenMetadata;
    getTokenDecimals(mintAddress: string): Promise<any>;
    getTokenMeta(mintAddress: string): Promise<{
        name: any;
        symbol: any;
        decimals: any;
        image: any;
    }>;
}
