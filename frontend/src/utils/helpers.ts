import { formatEther, parseEther } from 'viem';

/**
 * Formats an amount of Wei to ETH with specified decimal places
 */
export function formatWeiToEth(weiAmount: bigint, decimals: number = 4): string {
    try {
        const ethValue = formatEther(weiAmount);
        return parseFloat(ethValue).toFixed(decimals);
    } catch (error) {
        console.error('Error formatting Wei to ETH:', error);
        return '0.0000';
    }
}

/**
 * Converts ETH string to Wei
 */
export function convertEthToWei(ethAmount: string): bigint {
    try {
        return parseEther(ethAmount);
    } catch (error) {
        console.error('Error converting ETH to Wei:', error);
        return 0n;
    }
}

/**
 * Converts a string to bytes32 format
 */
export function stringToBytes32(str: string): string {
    // Pad the string to 32 bytes
    const strBytes = new TextEncoder().encode(str);
    const bytes32 = new Uint8Array(32);

    // Copy the string bytes into the bytes32 array
    bytes32.set(strBytes.slice(0, Math.min(strBytes.length, 32)));

    // Convert to hex
    return '0x' + Array.from(bytes32)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Converts bytes32 to a readable string
 */
export function bytes32ToString(bytes32: string): string {
    // Remove the 0x prefix
    const hex = bytes32.slice(2);

    // Convert the hex to bytes
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    // Convert to string and trim null bytes
    return new TextDecoder().decode(bytes).replace(/\0/g, '');
}

/**
 * Shortens an Ethereum address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Formats a date in a human-readable format
 */
export function formatDate(date: Date | number): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Calculates progress percentage
 */
export function calculateProgress(current: bigint, target: bigint): number {
    if (target === 0n) return 0;

    const progress = Number((current * 100n) / target);
    return Math.min(progress, 100); // Cap at 100%
} 