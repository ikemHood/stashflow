import { db } from '../db';
import { tokens } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define system stable coins
const systemTokens = [
    {
        address: '0x0FDC9F2fa2345f1aEE20A146D68e5d23F31F71Ea2',  // USDC on Ethereum
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        isActive: true,
        isSystem: true
    },
    {
        address: '0xFDC9F2fa2345f1aEE20A146D68e5d23F31F71Ea2',  // USDT on Ethereum
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        isActive: true,
        isSystem: true
    },
    // {
    //     address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',  // DAI on Ethereum
    //     name: 'Dai Stablecoin',
    //     symbol: 'DAI',
    //     decimals: 18,
    //     image: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    //     isActive: true,
    //     isSystem: true
    // },
    // {
    //     address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',  // BUSD
    //     name: 'Binance USD',
    //     symbol: 'BUSD',
    //     decimals: 18,
    //     image: 'https://cryptologos.cc/logos/binance-usd-busd-logo.png',
    //     isActive: true,
    //     isSystem: true
    // }
];

/**
 * Set up initial system tokens (stable coins)
 */
export async function setupTokens() {
    try {
        console.log('Setting up system tokens...');

        // Create tokens if they don't exist
        for (const token of systemTokens) {
            const existingToken = await db.select()
                .from(tokens)
                .where(eq(tokens.address, token.address))
                .limit(1);

            if (existingToken.length === 0) {
                console.log(`Creating token: ${token.name} (${token.symbol})`);

                // Remove isSystem field as it doesn't exist in the tokens table
                const { isSystem, ...tokenData } = token;

                await db.insert(tokens).values(tokenData);
            }
        }

        console.log('System tokens setup completed successfully');
    } catch (error) {
        console.error('Error setting up system tokens:', error);
    }
} 