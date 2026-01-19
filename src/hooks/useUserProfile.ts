import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User as PrismaUser } from '@prisma/client';

interface UserProfile extends PrismaUser {
  // Additional fields can be added here
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from database
    fetch(`/api/user/profile`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, [user]);

  return { profile, loading };
}
