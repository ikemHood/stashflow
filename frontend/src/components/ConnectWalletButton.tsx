import React, { useCallback, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface ConnectWalletButtonProps {
    onConnect?: (address: string) => void;
    className?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
    onConnect,
    className = "w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left hover:bg-gray-50"
}) => {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();

    // Use callback for event handlers
    const handleConnect = useCallback(() => {
        open();
    }, [open]);

    // Effect to call onConnect when address becomes available
    useEffect(() => {
        if (isConnected && address && onConnect) {
            onConnect(address);
        }
    }, [isConnected, address, onConnect]);

    return (
        <button
            onClick={handleConnect}
            className={className}
        >
            <div className="w-12 h-12 mr-4 flex-shrink-0">
                <img src="/assets/wallet.svg" alt="Connect wallet icon" className="w-full h-full" />
            </div>
            <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Connect crypto wallet</h3>
                <p className="text-xs text-gray-500">
                    Connect your wallet, authorise connection and top up if needed.
                </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
};

export default ConnectWalletButton; 