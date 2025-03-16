import { useQuery } from '@tanstack/react-query';
import { tokenService } from '../lib/api-services';

export const useTokens = () => {
    return useQuery({
        queryKey: ['tokens'],
        queryFn: () => tokenService.getAllTokens().then(res => res.data),
    });
};

export const useToken = (tokenId: string) => {
    return useQuery({
        queryKey: ['tokens', tokenId],
        queryFn: () => tokenService.getTokenById(tokenId).then(res => res.data),
        enabled: !!tokenId,
    });
}; 