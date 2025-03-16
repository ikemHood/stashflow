import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { milestoneService, transactionService } from '../lib/api-services';
import { CreateMilestoneRequest, Milestone } from '../types/api';

// API-specific milestone hooks that complement the context functionality
export const useUserMilestones = (userId: string) => {
    return useQuery({
        queryKey: ['milestones', 'user', userId],
        queryFn: () => milestoneService.getUserMilestones().then(res => res.data),
        enabled: !!userId,
    });
};

export const useMilestone = (milestoneId: string) => {
    return useQuery({
        queryKey: ['milestones', milestoneId],
        queryFn: () => milestoneService.getMilestoneById(milestoneId).then(res => res.data),
        enabled: !!milestoneId,
    });
};

export const useCreateMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMilestoneRequest) =>
            milestoneService.createMilestone(data).then(res => res.data),
        onSuccess: (data) => {
            if (data.success && data.data) {
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    queryClient.invalidateQueries({
                        queryKey: ['milestones', 'user', currentUser.data.id]
                    });
                }
            }
        },
    });
};

export const useUpdateMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ milestoneId, data }: { milestoneId: string; data: Partial<Milestone> }) =>
            milestoneService.updateMilestone(milestoneId, data).then(res => res.data),
        onSuccess: (data, variables) => {
            if (data.success && data.data) {
                queryClient.invalidateQueries({
                    queryKey: ['milestones', variables.milestoneId]
                });
            }
        },
    });
};

export const useDeleteMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (milestoneId: string) =>
            milestoneService.deleteMilestone(milestoneId).then(res => res.data),
        onSuccess: (data) => {
            if (data.success) {
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    queryClient.invalidateQueries({
                        queryKey: ['milestones', 'user', currentUser.data.id]
                    });
                }
            }
        },
    });
};

// Transaction hooks
export const useDepositToMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ milestoneId, data }: {
            milestoneId: string;
            data: {
                amount: number,
                walletAddress?: string,
                txHash?: string,
                metadata?: Record<string, any>
            }
        }) => transactionService.depositToMilestone(milestoneId, data).then(res => res.data),
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: ['milestones']
                });
                queryClient.invalidateQueries({
                    queryKey: ['transactions', 'milestone', variables.milestoneId]
                });
            }
        },
    });
};

export const useWithdrawFromMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ milestoneId, data }: {
            milestoneId: string;
            data: {
                amount: number,
                walletAddress?: string,
                txHash?: string,
                metadata?: Record<string, any>
            }
        }) => transactionService.withdrawFromMilestone(milestoneId, data).then(res => res.data),
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: ['milestones']
                });
                queryClient.invalidateQueries({
                    queryKey: ['transactions', 'milestone', variables.milestoneId]
                });
            }
        },
    });
}; 