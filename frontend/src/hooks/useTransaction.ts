import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../lib/api-services';
import { CreateTransactionRequest, PaginationParams, ApiResponse } from '../types/api';

export const useMilestoneTransactions = (milestoneId: string, params?: PaginationParams) => {
    return useQuery({
        queryKey: ['transactions', 'milestone', milestoneId, params],
        queryFn: () => transactionService.getMilestoneTransactions(milestoneId, params).then(res => res.data),
        enabled: !!milestoneId,
    });
};

export const useCreateDepositTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTransactionRequest) =>
            transactionService.depositToMilestone(data.milestoneId, {
                amount: parseFloat(data.amount),
                txHash: data.txHash,
                metadata: data.metadata
            }).then((res: any) => res.data),
        onSuccess: (data: ApiResponse<any>) => {
            if (data.success && data.data) {
                // Get current user from cache
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    // Invalidate relevant queries
                    const userId = currentUser.data.id;
                    const walletId = data.data.walletId;

                    // Invalidate user transactions
                    queryClient.invalidateQueries({
                        queryKey: ['transactions', 'user', userId]
                    });

                    // Invalidate wallet transactions
                    queryClient.invalidateQueries({
                        queryKey: ['transactions', 'wallet', walletId]
                    });

                    // Invalidate the specific wallet to update its balance
                    queryClient.invalidateQueries({
                        queryKey: ['wallets', walletId]
                    });
                }
            }
        },
    });
};

export const useCreateWithdrawalTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTransactionRequest) =>
            transactionService.withdrawFromMilestone(data.milestoneId, {
                amount: parseFloat(data.amount),
                txHash: data.txHash,
                metadata: data.metadata
            }).then((res: any) => res.data),
        onSuccess: (data: ApiResponse<any>) => {
            if (data.success && data.data) {
                // Get current user from cache
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    // Invalidate relevant queries
                    const userId = currentUser.data.id;
                    const walletId = data.data.walletId;

                    // Invalidate user transactions
                    queryClient.invalidateQueries({
                        queryKey: ['transactions', 'user', userId]
                    });

                    // Invalidate wallet transactions
                    queryClient.invalidateQueries({
                        queryKey: ['transactions', 'wallet', walletId]
                    });

                    // Invalidate the specific wallet to update its balance
                    queryClient.invalidateQueries({
                        queryKey: ['wallets', walletId]
                    });
                }
            }
        },
    });
}; 