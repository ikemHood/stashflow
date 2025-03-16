import { useQuery } from '@tanstack/react-query';
import { roleService } from '../lib/api-services';

export const useRoles = () => {
    return useQuery({
        queryKey: ['roles'],
        queryFn: () => roleService.getAllRoles().then(res => res.data),
    });
};

export const useRole = (roleId: string) => {
    return useQuery({
        queryKey: ['roles', roleId],
        queryFn: () => roleService.getRoleById(roleId).then(res => res.data),
        enabled: !!roleId,
    });
}; 