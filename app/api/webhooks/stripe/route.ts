import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import stripe from '@/lib/stripe';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import resend from '@/lib/resend';
import PurchaseConfirmationEmail from '@/emails/PurchaseConfirmationEmail';
import ProPlanActivatedEmail from '@/emails/ProPlanActivatedEmail';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  console.log('🔔 Stripe Webhook received!');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(
          event.data.object as Stripe.Subscription,
          event.type,
        );
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}

// Handle one-time purchase (checkout completed)
const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  console.log('Processing checkout session:', session.id);

  const stripeCustomerId = session.customer as string;
  const courseId = session.metadata?.courseId;
  const courseTitle = session.metadata?.courseTitle;
  const courseImage = session.metadata?.courseImage;

  if (!courseId || !stripeCustomerId || !courseImage || !courseTitle) {
    throw new Error('Missing metadata in checkout session');
  }

  try {
    const user = await convex.query(api.users.getUserByStripeCustomerId, {
      stripeCustomerId,
    });

    if (!user) throw new Error('User not found');

    // Save purchase data to convex db
    await convex.mutation(api.purchases.recordPurchase, {
      userId: user._id,
      courseId: courseId as Id<'courses'>,
      amount: session.amount_total as number,
      stripePurchaseId: session.id,
    });

    console.log('Purchase created successfully');

    await resend.emails.send({
      from: 'ProLearner <onboarding@resend.dev>',
      to: user.email,
      subject: 'Purchase Confirmed',
      react: PurchaseConfirmationEmail({
        customerName: user.name!,
        courseTitle,
        courseImage,
        courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/courses${courseId}`,
        purchaseAmount: session.amount_total! / 100,
      }),
    });
    console.log('Purchase confirmation email sent successfully');
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

// Handle subscription created and updated
const handleSubscriptionUpsert = async (
  subscription: Stripe.Subscription,
  eventType: string,
) => {
  const stripeCustomerId = subscription.customer as string;

  const user = await convex.query(api.users.getUserByStripeCustomerId, {
    stripeCustomerId,
  });
  if (!user) {
    throw new Error(
      `User not found for stripe customer id: ${stripeCustomerId}`,
    );
  }

  const currentSubscription = await convex.query(
    api.subscriptions.getUserSubscription,
    { userId: user._id },
  );

  try {
    // Get the subscription item (it contains current_period_start/end)
    const subscriptionItem = subscription.items.data[0];

    // If pro plan not changed it means user wants to cancel subscription
    if (subscriptionItem.plan.interval === currentSubscription?.planType) {
      await convex.mutation(api.subscriptions.cancelSubscriptionAtPeriodEnd, {
        stripeSubscriptionId: subscription.id,
      });
      return;
    }

    await convex.mutation(api.subscriptions.upsertSubscription, {
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      planType: subscriptionItem.plan.interval as 'month' | 'year',
      currentPeriodStart: subscriptionItem.current_period_start,
      currentPeriodEnd: subscriptionItem.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
    console.log(
      `Successfully processed ${eventType} for subscription ${subscription.id}`,
    );

    const isCreationEvent = eventType === 'customer.subscription.created';
    if (isCreationEvent) {
      await resend.emails.send({
        from: 'ProLearner <onboarding@resend.dev>',
        to: user.email,
        subject: 'Purchase Confirmed',
        react: ProPlanActivatedEmail({
          name: user.name!,
          planType: subscriptionItem.plan.interval,
          currentPeriodStart: subscriptionItem.current_period_start,
          currentPeriodEnd: subscriptionItem.current_period_end,
          url: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      });
    }
  } catch (error) {
    console.error(
      `Error processed ${eventType} for subscription ${subscription.id}: `,
      error,
    );
  }
};

// Handle subscription deleted
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  try {
    await convex.mutation(api.subscriptions.removeSubscription, {
      stripeSubscriptionId: subscription.id,
    });

    console.log(`successfully deleted subscription ${subscription.id}`);
  } catch (error) {
    console.error(`Error deleting subscription ${subscription.id}`, error);
  }
};
