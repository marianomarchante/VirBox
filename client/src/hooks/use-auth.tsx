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
      window.location.href = '/api/auth/login';
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/user'], null);
      window.location.href = '/';
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
