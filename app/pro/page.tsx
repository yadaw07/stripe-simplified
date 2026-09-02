'use client';

import { useState } from 'react';

import { api } from '@/convex/_generated/api';
import { useAction, useQuery } from 'convex/react';

import { useUser } from '@clerk/nextjs';
import { PRO_PLANS } from '@/constants';

import { Check, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

const proPage = () => {
  const [loadingPlan, setLoadingPlan] = useState('');
  const { user, isLoaded: isUserLoaded } = useUser();

  const userData = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user?.id } : 'skip',
  );
  const userSubscription = useQuery(
    api.subscriptions.getUserSubscription,
    userData ? { userId: userData?._id } : 'skip',
  );

  const isYearlySubscriptionActive =
    userSubscription?.planType === 'year' &&
    userSubscription?.status === 'active';

  const createProPlanCheckoutSession = useAction(
    api.stripe.createProPlanCheckoutSession,
  );

  const handlePlanSelection = async (planId: string) => {
    if (!user) {
      toast.error('Please login to select a plan.', {
        id: 'login-error',
        position: 'top-center',
        duration: 3000,
      });
      return;
    }

    setLoadingPlan(planId);
    try {
      const { checkoutUrl } = await createProPlanCheckoutSession({
        planId: planId as 'month' | 'year',
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (e: any) {
      if (e.message.includes(`Rate limit excceded.`)) {
        toast.error(`Rate limit excceded. Please try again later.`);
      } else {
        toast.error(
          e.message || 'Failed to purchase pro plan. Please try again later.',
        );
      }
      console.error('Checkout error:', e);
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className='container mx-auto max-w-6xl px-4 py-16 h-screeen'>
      <h1 className='text-4xl font-bold text-center mb-4 text-gray-800'>
        Choose Your Pro Journey
      </h1>
      <p className='text-xl text-center mb-12 text-gray-600'>
        Unlock premium features and accelerate your learning
      </p>

      {isUserLoaded && userSubscription?.status === 'active' && (
        <div className='bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-md'>
          <p className='text-blue-700'>
            You have an active{' '}
            <span className='font-semibold'>{userSubscription.planType}</span>{' '}
            subscription.
          </p>
        </div>
      )}

      <div className='grid md:grid-cols-2 gap-8 items-stretch'>
        {PRO_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col transition-all duration-300 ${plan.highlighted ? 'border-purple-400 shadow-lg hover:shadow-xl' : 'hover:border-purple-200 hover:shadow-md'}`}
          >
            <CardHeader className='grow'>
              <CardTitle
                className={`text-2xl ${plan.highlighted ? 'text-purple-600' : 'text-gray-800'}`}
              >
                {plan.title}
              </CardTitle>
              <CardDescription className='mt-2'>
                <span className='text-3xl font-bold text-gray-900'>
                  {plan.price}
                </span>
                <span className='text-gray-600 ml-1'>{plan.period}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className='space-y-3'>
                {plan.features.map((feature, i) => (
                  <li key={i} className='flex items-center'>
                    <Check
                      className={`h-5 w-5 ${plan.highlighted ? 'text-purple-500' : 'text-green-500'} mr-2 shrink-0`}
                    />
                    <span className='text-gray-700'>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className='mt-auto'>
              <Button
                onClick={() => handlePlanSelection(plan.id)}
                className={`w-full py-6 text-lg ${
                  plan.highlighted
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                }`}
                disabled={
                  userSubscription?.status === 'active' &&
                  (userSubscription?.planType === plan.id ||
                    isYearlySubscriptionActive)
                }
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2Icon className='mr-2 size-4 animate-spin' />
                    Processing...
                  </>
                ) : isUserLoaded &&
                  userSubscription?.status === 'active' &&
                  userSubscription.planType === plan.id ? (
                  'Current Plan'
                ) : isUserLoaded &&
                  plan.id === 'month' &&
                  isYearlySubscriptionActive ? (
                  'Yearly Plan Active'
                ) : (
                  plan.ctaText
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default proPage;
