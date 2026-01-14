import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  profilePicUrl: string | null;
  isAdmin: boolean;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      window.location.href = '/api/login';
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      window.location.href = '/api/logout';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  };
}
