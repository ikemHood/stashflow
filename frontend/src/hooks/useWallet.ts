import { useQuery } from '@tanstack/react-query';
import { walletService } from '../lib/api-services';
// import { ApiResponse, Wallet } from '../types/api';

export const useUserWallets = (userId: string) => {
    return useQuery({
        queryKey: ['wallets'],
        queryFn: () => walletService.getUserWallets().then(res => res.data),
        enabled: !!userId,
    });
};

export const useWallet = (walletId: string) => {
    return useQuery({
        queryKey: ['wallets', walletId],
        queryFn: () => walletService.getWalletById(walletId).then(res => res.data),
        enabled: !!walletId,
    });
};

// export const useConnectWallet = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (data: { address: string, walletType: string, metadata?: Record<string, any> }) =>
//             walletService.connectWallet(data.address, data.walletType, data.metadata).then(res => res.data),
//         onSuccess: (data, _, __) => {
//             if (data.success && data.data) {
//                 // Get the current user from cache
//                 const currentUser = queryClient.getQueryData<any>(['currentUser']);
//                 if (currentUser?.data?.id) {
//                     // Invalidate the user wallets query to refetch the updated list
//                     queryClient.invalidateQueries({
//                         queryKey: ['wallets', 'user', currentUser.data.id]
//                     });
//                 }
//             }
//         },
//     });
// }; 