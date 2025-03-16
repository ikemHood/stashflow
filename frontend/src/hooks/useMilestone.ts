import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { milestoneService } from '../lib/api-services';
import { CreateMilestoneRequest, Milestone } from '../types/api';

export const useUserMilestones = (userId: string) => {
    return useQuery({
        queryKey: ['milestones'],
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
                // Get current user from cache
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    // Invalidate user milestones query to refetch with the new milestone
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
                // Invalidate the specific milestone
                queryClient.invalidateQueries({
                    queryKey: ['milestones', variables.milestoneId]
                });

                // Get current user from cache
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    // Invalidate user milestones
                    queryClient.invalidateQueries({
                        queryKey: ['milestones', 'user', currentUser.data.id]
                    });
                }
            }
        },
    });
};

export const useDeleteMilestone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (milestoneId: string) =>
            milestoneService.deleteMilestone(milestoneId).then(res => res.data),
        onSuccess: (data, milestoneId) => {
            if (data.success) {
                // Get current user from cache
                const currentUser = queryClient.getQueryData<any>(['currentUser']);
                if (currentUser?.data?.id) {
                    // Invalidate user milestones query
                    queryClient.invalidateQueries({
                        queryKey: ['milestones', 'user', currentUser.data.id]
                    });
                }

                // Remove the specific milestone from cache
                queryClient.removeQueries({
                    queryKey: ['milestones', milestoneId]
                });
            }
        },
    });
}; 