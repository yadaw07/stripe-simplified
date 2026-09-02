'use client';

import { useState } from 'react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';

import { useUser } from '@clerk/nextjs';

import { Button } from './ui/button';
import { Loader2Icon } from 'lucide-react';

import { toast } from 'sonner';

interface Params {
  courseId: Id<'courses'>;
}

const PurchaseButton = ({ courseId }: Params) => {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : 'skip',
  );

  const userAccess = useQuery(
    api.users.getUserAccess,
    userData ? { userId: userData._id, courseId } : 'skip',
  ) || { hasAccess: false };

  const handlePurchase = async () => {
    if (!user) {
      return toast.error('Please login to purchase', { id: 'login-error' });
    }

    setIsLoading(true);
    try {
      const { checkoutUrl } = await createCheckoutSession({ courseId });
      if (!checkoutUrl) {
        throw new Error('Failed to create checkout session');
      }

      window.location.href = checkoutUrl; // Redirect to Stripe checkout
    } catch (e: any) {
      if (e.message.includes(`Rate limit excceded.`)) {
        toast.error(`Rate limit excceded. Please try again later.`);
      } else {
        toast.error(
          e.message || 'Failed to purchase course. Please try again later.',
        );
      }
      console.error('Checkout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAccess.hasAccess) {
    return (
      <Button variant='outline' onClick={handlePurchase} disabled={isLoading}>
        Enroll now
      </Button>
    );
  }

  if (userAccess.hasAccess) {
    return <Button variant='outline'>Enrolled</Button>;
  }

  if (isLoading) {
    return (
      <Button>
        <Loader2Icon className='mr-2 size-4 animate-spin' />
        Processing...
      </Button>
    );
  }

  return <div>PurchaseButton</div>;
};

export default PurchaseButton;
